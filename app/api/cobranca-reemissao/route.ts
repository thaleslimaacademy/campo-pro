import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { criarClienteAsaas, criarCobrancaPix, getPixQrCode } from '@/lib/asaas'
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


/**
 * Cria o PIX no Asaas para uma cobranca que ainda nao tem.
 * As mensalidades pre-geradas nascem so no banco; o PIX e criado poucos dias
 * antes do vencimento, para o link do WhatsApp abrir uma pagina pagavel.
 */
async function gerarPixSeFaltar(
  cobrancaId: string, escolaId: string, atletaId: string,
  valor: number, vencimento: string
): Promise<boolean> {
  try {
    const apiKey = await getAsaasKey(escolaId)
    if (!apiKey) return false

    // Multa e juros vao no proprio PIX: se o responsavel pagar depois do
    // vencimento, o Asaas cobra o acrescimo sozinho. Por isso nao existe mais
    // reemissao de cobranca no D+1.
    const { data: cfg } = await supabaseAdmin.from('Escola')
      .select('multaAtraso, jurosAoMes').eq('id', escolaId).single()
    const multa = Number(cfg?.multaAtraso || 0)
    const juros = Number(cfg?.jurosAoMes || 0)

    const { data: atleta } = await supabaseAdmin.from('Atleta')
      .select('nome, cpf, telefone, cep, endereco, numero, bairro, asaasCustomerId')
      .eq('id', atletaId).single()
    if (!atleta) return false

    let customerId = atleta.asaasCustomerId
    if (!customerId) {
      const dados: Record<string, string> = { name: atleta.nome }
      const cpf = (atleta.cpf || '').replace(/\D/g, '')
      if (cpf.length >= 11) dados.cpfCnpj = cpf
      if (atleta.telefone) dados.phone = atleta.telefone.replace(/\D/g, '')
      if (atleta.endereco) dados.address = atleta.endereco
      if (atleta.numero) dados.addressNumber = atleta.numero
      if (atleta.bairro) dados.province = atleta.bairro
      if (atleta.cep) dados.postalCode = atleta.cep.replace(/\D/g, '')
      const cliente = await criarClienteAsaas(apiKey, dados as never)
      if (cliente.errors || !cliente.id) return false
      customerId = cliente.id
      await supabaseAdmin.from('Atleta').update({ asaasCustomerId: customerId }).eq('id', atletaId)
    }

    const nova = await criarCobrancaPix(apiKey, {
      customer: customerId, billingType: 'PIX',
      value: valor, dueDate: vencimento, description: 'Mensalidade',
      ...(multa > 0 ? { fine: { value: multa } } : {}),
      ...(juros > 0 ? { interest: { value: juros } } : {}),
    })
    if (nova.errors || !nova.id) return false

    const qr = await getPixQrCode(apiKey, nova.id)
    const { error } = await supabaseAdmin.from('Cobranca').update({
      asaasId: nova.id, tipo: 'PIX',
      pixCopiaCola: qr.payload || null,
      pixQrCode: qr.encodedImage || null,
    }).eq('id', cobrancaId)
    if (error) { console.error('PIX criado no Asaas mas nao salvo:', error.message); return false }
    return true
  } catch (err) {
    console.error('Erro ao gerar PIX sob demanda:', (err as Error).message)
    return false
  }
}

/**
 * Garante que todo atleta ativo tenha `meses` mensalidades pre-geradas a frente.
 * Antes nada criava a competencia seguinte: quem ja estava cadastrado ficava
 * sem cobranca no mes que vem. Roda todo dia e se auto-corrige.
 */
async function garantirMensalidadesFuturas(meses: number) {
  let criadas = 0, atletasAfetados = 0
  const hojeD = new Date()
  const hojeISO = hojeD.toISOString().slice(0, 10)

  const { data: escolas } = await supabaseAdmin.from('Escola')
    .select('id, valorMensalidade').eq('ativo', true)

  for (const escola of escolas || []) {
    const { data: planos } = await supabaseAdmin.from('PlanoMensalidade')
      .select('slug, valor').eq('escolaId', escola.id)
    const PLANOS: Record<string, number> = {}
    for (const p of planos || []) PLANOS[p.slug] = Number(p.valor)

    const { data: atletas } = await supabaseAdmin.from('Atleta')
      .select('id, nome, diaVencimento, valorMensalidade, planoMensalidade')
      .eq('escolaId', escola.id).eq('ativo', true).eq('bolsista', false)

    for (const a of atletas || []) {
      const { data: existentes } = await supabaseAdmin.from('Cobranca')
        .select('competencia, descricao')
        .eq('atletaId', a.id).is('excluidaEm', null)
        .in('status', ['PENDENTE', 'VENCIDO', 'PAGO'])

      const jaTem = new Set(
        (existentes || [])
          .filter(c => c.competencia && String(c.descricao || '').trim().toLowerCase().startsWith('mensalidade'))
          .map(c => String(c.competencia).slice(0, 10))
      )

      const dia = Math.min(Number(a.diaVencimento) || 10, 28)
      const valor = Number(a.valorMensalidade)
        || PLANOS[a.planoMensalidade || '']
        || Number(escola.valorMensalidade)
        || 85

      const novas = []
      for (let i = 0; i <= meses; i++) {
        const alvo = new Date(Date.UTC(hojeD.getUTCFullYear(), hojeD.getUTCMonth() + i, dia))
        const venc = alvo.toISOString().slice(0, 10)
        const competencia = venc.slice(0, 7) + '-01'
        if (jaTem.has(competencia)) continue
        // nao cria retroativo: se o vencimento do mes corrente ja passou, pula
        if (venc < hojeISO) continue
        novas.push({
          id: crypto.randomUUID(), escolaId: escola.id, atletaId: a.id,
          atletaNome: (a.nome || '').trim() || null,
          valor, vencimento: venc, competencia,
          status: 'PENDENTE', tipo: 'MANUAL', descricao: 'Mensalidade',
        })
      }

      if (novas.length) {
        const { error } = await supabaseAdmin.from('Cobranca').insert(novas)
        if (error) { console.error('Erro pre-gerando para', a.nome, error.message); continue }
        criadas += novas.length
        atletasAfetados++
      }
    }
  }

  return { criadas, atletasAfetados, mesesAFrente: meses }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && authHeader !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const hoje = dataComOffset(0)

  // Quantos meses de mensalidade manter sempre pre-gerados a frente.
  // Sem isso nenhuma competencia nova nascia sozinha: os atletas antigos
  // ficavam sem cobranca no mes seguinte.
  const MESES_A_FRENTE = 3
  const manutencao = await garantirMensalidadesFuturas(MESES_A_FRENTE)

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

  let lembretesPrevios = 0, avisosVencimento = 0, avisosAtraso = 0, avisosFinais = 0, erros = 0
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
          .select('ativo')
          .eq('id', cob.escolaId).single()

        // escola pausada nao dispara nada
        if (escolaAtivaCache[cob.escolaId] === undefined)
          escolaAtivaCache[cob.escolaId] = !!escolaConfig?.ativo
        if (!escolaAtivaCache[cob.escolaId]) continue


        const { data: atleta } = await supabaseAdmin.from('Atleta')
          .select('nome, asaasCustomerId, bolsista, ativo').eq('id', cob.atletaId).single()
        if (atleta?.bolsista) continue
        // Atleta desativado (desistiu) nao pode continuar recebendo as
        // mensalidades futuras que ja foram pre-geradas.
        if (atleta && atleta.ativo === false) continue

        const { data: resps } = await supabaseAdmin.from('Responsavel')
          .select('nome, whatsapp').eq('atletaId', cob.atletaId).eq('principal', true).limit(1)
        const resp = resps?.[0]
        const nomeResp = resp?.nome?.split(' ')[0] || ''
        const link = `https://gestaofc.com.br/pagar/${cob.id}`
        const valorFmt = Number(cob.valor).toFixed(2)

        // ── D-3: lembrete previo ──
        if (acao === 'lembrete_previo') {
          // As mensalidades pre-geradas nascem sem PIX (evita criar 12 cobrancas
          // no Asaas de uma vez e permite mudar o valor no meio do caminho).
          // O PIX e criado aqui, 3 dias antes, para o link do aviso funcionar.
          if (!cob.asaasId) {
            await gerarPixSeFaltar(cob.id, cob.escolaId, cob.atletaId, Number(cob.valor), dataAlvo)
          }
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
          if (!cob.asaasId) {
            await gerarPixSeFaltar(cob.id, cob.escolaId, cob.atletaId, Number(cob.valor), dataAlvo)
          }
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
          // NAO reemite mais. O PIX ja foi criado com multa e juros do Asaas
          // (fine/interest), entao pagar atrasado no MESMO link ja cobra o
          // acrescimo. Reemitir gerava cobranca duplicada e juros compostos.
          const { error: eVenc } = await supabaseAdmin.from('Cobranca')
            .update({ status: 'VENCIDO' }).eq('id', cob.id)
          if (eVenc) { erros++; continue }

          // garante o PIX caso o D-3 nao tenha rodado para esta cobranca
          if (!cob.asaasId) {
            await gerarPixSeFaltar(cob.id, cob.escolaId, cob.atletaId, Number(cob.valor), dataAlvo)
          }

          if (resp?.whatsapp && atleta) {
            await msgAtraso({
              telefone: resp.whatsapp, nomeResp, nomeAtleta: atleta.nome?.trim() || '',
              valor: Number(cob.valor), diasAtraso: 1,
              linkPagamento: link, escolaId: cob.escolaId,
            })
          }
          avisosAtraso++
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
    regua: 'D-3 aviso | D0 vence hoje | D+1 atraso | D+15 aviso final (sem reemissao)',
    manutencao,
    lembretesPrevios, avisosVencimento, avisosAtraso, avisosFinais, erros,
    data: hoje,
  })
}
