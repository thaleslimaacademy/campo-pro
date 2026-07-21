import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cancelarCobrancaAsaas, criarCobrancaPix, getPixQrCode } from '@/lib/asaas'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { msgLembreteD3, msgVencimentoHoje, msgAtraso } from '@/lib/whatsapp-templates'

// offset em dias a partir de hoje (negativo = passado)
function dataComOffset(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function fmtBR(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && authHeader !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const hoje = dataComOffset(0)
  const amanha = dataComOffset(1)

  // ── REGUA DE COBRANCA ──────────────────────────────────────
  //   D-3   lembrete previo      (cobranca vence em 3 dias)
  //   D0    vence hoje
  //   D+1   reemite com multa+juros (uma unica vez)
  //   D+15  aviso final
  // offset = quantos dias somar em hoje para achar o vencimento alvo
  const regua = [
    { offset:   3, acao: 'lembrete_previo' },
    { offset:   0, acao: 'vencimento_hoje' },
    { offset:  -1, acao: 'reemitir' },
    { offset: -15, acao: 'aviso_final' },
  ]

  let lembretesPrevios = 0, avisosVencimento = 0, reemitidas = 0, avisosFinais = 0, erros = 0
  const escolaAtivaCache: Record<string, boolean> = {}

  for (const { offset, acao } of regua) {
    const dataAlvo = dataComOffset(offset)

    const { data: cobrancas } = await supabaseAdmin.from('Cobranca')
      .select('id, valor, asaasId, atletaId, escolaId, descricao, competencia, pixCopiaCola')
      .in('status', ['PENDENTE', 'VENCIDO'])
      .is('excluidaEm', null)
      .eq('vencimento', dataAlvo)

    if (!cobrancas?.length) continue

    for (const cob of cobrancas) {
      try {
        const { data: escolaConfig } = await supabaseAdmin.from('Escola')
          .select('multaAtraso, jurosAoMes, nome, ativo')
          .eq('id', cob.escolaId).single()

        // escola pausada nao dispara nada
        if (escolaAtivaCache[cob.escolaId] === undefined)
          escolaAtivaCache[cob.escolaId] = !!escolaConfig?.ativo
        if (!escolaAtivaCache[cob.escolaId]) continue

        const multaFixa  = Number(escolaConfig?.multaAtraso || 15)
        const jurosPct   = Number(escolaConfig?.jurosAoMes || 1)
        const escolaNome = escolaConfig?.nome?.split('—').pop()?.trim() || 'GestãoFC'

        const { data: atleta } = await supabaseAdmin.from('Atleta')
          .select('nome, asaasCustomerId, bolsista').eq('id', cob.atletaId).single()
        if (atleta?.bolsista) continue

        const { data: resps } = await supabaseAdmin.from('Responsavel')
          .select('nome, whatsapp').eq('atletaId', cob.atletaId).eq('principal', true).limit(1)
        const resp = resps?.[0]
        const nomeResp = resp?.nome?.split(' ')[0] || ''
        const link = `https://gestaofc.com.br/pagar/${cob.id}`
        const valorFmt = Number(cob.valor).toFixed(2)

        // ── D-3: lembrete previo ──
        if (acao === 'lembrete_previo') {
          if (resp?.whatsapp && atleta) {
            await msgLembreteD3({
              telefone: resp.whatsapp, nomeResp, nomeAtleta: atleta.nome?.trim() || '',
              valor: Number(cob.valor), dataVenc: fmtBR(dataAlvo),
              linkPagamento: link, escolaId: cob.escolaId,
            })
            lembretesPrevios++
          }
        }

        // ── D0: vence hoje ──
        else if (acao === 'vencimento_hoje') {
          if (resp?.whatsapp && atleta) {
            await msgVencimentoHoje({
              telefone: resp.whatsapp, nomeResp, nomeAtleta: atleta.nome?.trim() || '',
              valor: Number(cob.valor), dataVenc: fmtBR(dataAlvo),
              linkPagamento: link, escolaId: cob.escolaId,
            })
            avisosVencimento++
          }
        }

        // ── D+1: reemite com multa + juros ──
        else if (acao === 'reemitir') {
          // nunca reemitir uma reemissao (evita juros compostos em loop)
          const jaEhReemissao = (cob.descricao || '').startsWith('Mensalidade em atraso')
          if (jaEhReemissao) {
            await supabaseAdmin.from('Cobranca').update({ status: 'VENCIDO' }).eq('id', cob.id)
            continue
          }

          const apiKey = await getAsaasKey(cob.escolaId)
          const valorBase  = Number(cob.valor)
          const valorJuros = valorBase * (jurosPct / 100)
          const novoValor  = Math.round((valorBase + multaFixa + valorJuros) * 100) / 100
          const novoId     = crypto.randomUUID()
          const descricao  = `Mensalidade em atraso + multa R$${multaFixa.toFixed(0)} + juros ${jurosPct}%`
          let novaCriada   = false

          if (atleta?.asaasCustomerId && apiKey) {
            const nova = await criarCobrancaPix(apiKey, {
              customer: atleta.asaasCustomerId, billingType: 'PIX',
              value: novoValor, dueDate: amanha, description: descricao,
            })
            if (!nova.errors) {
              const qr = await getPixQrCode(apiKey, nova.id)
              await supabaseAdmin.from('Cobranca').insert({
                id: novoId, escolaId: cob.escolaId, atletaId: cob.atletaId,
                atletaNome: atleta?.nome || null, valor: novoValor, vencimento: amanha,
                status: 'PENDENTE', asaasId: nova.id, competencia: cob.competencia,
                pixCopiaCola: qr.payload || null, pixQrCode: qr.encodedImage || null, descricao,
              })
              novaCriada = true
              if (cob.asaasId) await cancelarCobrancaAsaas(apiKey, cob.asaasId)
            }
          } else {
            await supabaseAdmin.from('Cobranca').insert({
              id: novoId, escolaId: cob.escolaId, atletaId: cob.atletaId,
              atletaNome: atleta?.nome || null, valor: novoValor, vencimento: amanha,
              status: 'PENDENTE', tipo: 'MANUAL', competencia: cob.competencia, descricao,
            })
            novaCriada = true
          }

          // cancela a anterior de verdade, so se a nova existe
          if (novaCriada) {
            await supabaseAdmin.from('Cobranca').update({
              status: 'CANCELADO', excluidaEm: new Date().toISOString(),
            }).eq('id', cob.id)
          } else {
            await supabaseAdmin.from('Cobranca').update({ status: 'VENCIDO' }).eq('id', cob.id)
            erros++
            continue
          }

          if (resp?.whatsapp && atleta) {
            await msgAtraso({
              telefone: resp.whatsapp, nomeResp, nomeAtleta: atleta.nome?.trim() || '',
              valor: novoValor, diasAtraso: 1,
              linkPagamento: `https://gestaofc.com.br/pagar/${novoId}`,
              escolaId: cob.escolaId,
            })
          }
          reemitidas++
        }

        // ── D+15: aviso final ──
        else if (acao === 'aviso_final') {
          await supabaseAdmin.from('Cobranca').update({ status: 'VENCIDO' }).eq('id', cob.id)
          if (resp?.whatsapp && atleta) {
            await msgAtraso({
              telefone: resp.whatsapp, nomeResp, nomeAtleta: atleta.nome?.trim() || '',
              valor: Number(cob.valor), diasAtraso: 15,
              linkPagamento: link, escolaId: cob.escolaId,
            })
            avisosFinais++
          }
        }

        await new Promise(r => setTimeout(r, 300))
      } catch (err) {
        console.error('Erro regua', acao, cob.id, err)
        erros++
      }
    }
  }

  return NextResponse.json({
    ok: true,
    regua: 'D-3 | D0 | D+1 | D+15',
    lembretesPrevios, avisosVencimento, reemitidas, avisosFinais, erros,
    data: hoje,
  })
}
