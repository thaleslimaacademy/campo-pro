import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { msgLembreteD3, msgVencimentoHoje, msgAtraso } from '@/lib/whatsapp-templates'
import { gerarPixOuAgregarFamilia } from '@/lib/cobrancaFamilia'
import { dataVencimentoNoMes } from '@/lib/dataVencimento'

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
      .neq('formaPagamento', 'CARTAO_RECORRENTE') // quem esta em debito automatico e cobrado pela propria assinatura Asaas, nao pela regua

    const atletaIds = (atletas || []).map(a => a.id)

    // Uma unica consulta pra TODOS os atletas da escola, em vez de uma
    // consulta por atleta (N+1). Com poucas dezenas de alunos a diferenca
    // e imperceptivel, mas esse cron roda todo santo dia pra sempre e a
    // base so cresce — na escala de centenas de atletas o N+1 comeca a
    // comer o tempo do cron a toa. 26 ago: otimizado antes da migracao da
    // Iturama (170 atletas) dobrar o tamanho da base.
    const jaTemPorAtleta: Record<string, Set<string>> = {}
    if (atletaIds.length) {
      const { data: existentesTodos } = await supabaseAdmin.from('Cobranca')
        .select('atletaId, competencia, descricao')
        .in('atletaId', atletaIds).is('excluidaEm', null)
        .in('status', ['PENDENTE', 'VENCIDO', 'PAGO'])

      for (const c of existentesTodos || []) {
        if (!c.competencia || !String(c.descricao || '').trim().toLowerCase().startsWith('mensalidade')) continue
        if (!jaTemPorAtleta[c.atletaId]) jaTemPorAtleta[c.atletaId] = new Set()
        jaTemPorAtleta[c.atletaId].add(String(c.competencia).slice(0, 10))
      }
    }

    const todasNovas: Record<string, unknown>[] = []
    const atletaPorNovas: Record<string, string> = {} // rastreia quantas novas por atleta pra contar atletasAfetados certo

    for (const a of atletas || []) {
      const jaTem = jaTemPorAtleta[a.id] || new Set<string>()

      // Dia PREFERIDO do atleta (1-31, sem clamp em 28). O clamp real pro
      // mes especifico acontece dentro de dataVencimentoNoMes(), que sabe
      // quantos dias cada mes realmente tem.
      const diaPreferido = Number(a.diaVencimento) || 10
      const valor = Number(a.valorMensalidade)
        || PLANOS[a.planoMensalidade || '']
        || Number(escola.valorMensalidade)
        || 85

      let novasDoAtleta = 0
      for (let i = 0; i <= meses; i++) {
        const venc = dataVencimentoNoMes(hojeD.getUTCFullYear(), hojeD.getUTCMonth() + i, diaPreferido)
        const competencia = venc.slice(0, 7) + '-01'
        if (jaTem.has(competencia)) continue
        // nao cria retroativo: se o vencimento do mes corrente ja passou, pula
        if (venc < hojeISO) continue
        todasNovas.push({
          id: crypto.randomUUID(), escolaId: escola.id, atletaId: a.id,
          atletaNome: (a.nome || '').trim() || null,
          valor, vencimento: venc, competencia,
          status: 'PENDENTE', tipo: 'MANUAL', descricao: 'Mensalidade',
        })
        novasDoAtleta++
      }
      if (novasDoAtleta) atletaPorNovas[a.id] = a.nome
    }

    // Insert em lote unico por escola em vez de um insert por atleta —
    // mesma logica: menos round-trips ao banco, cron mais rapido e mais
    // barato conforme a base cresce. Se o lote inteiro falhar (uma linha
    // ruim derruba o insert todo no Postgres), cai pro fallback por atleta
    // abaixo — mais lento, mas ninguem fica sem mensalidade por causa de
    // UM atleta com dado invalido.
    if (todasNovas.length) {
      const { error } = await supabaseAdmin.from('Cobranca').insert(todasNovas)
      if (!error) {
        criadas += todasNovas.length
        atletasAfetados += Object.keys(atletaPorNovas).length
      } else {
        console.error('Insert em lote falhou pra escola', escola.id, error.message, '— tentando atleta por atleta')
        const porAtleta: Record<string, Record<string, unknown>[]> = {}
        for (const n of todasNovas) {
          const atletaId = n.atletaId as string
          if (!porAtleta[atletaId]) porAtleta[atletaId] = []
          porAtleta[atletaId].push(n)
        }
        for (const [atletaId, novas] of Object.entries(porAtleta)) {
          const { error: eIndiv } = await supabaseAdmin.from('Cobranca').insert(novas)
          if (eIndiv) {
            console.error('Erro pre-gerando para atleta', atletaId, atletaPorNovas[atletaId], eIndiv.message)
            continue
          }
          criadas += novas.length
          atletasAfetados++
        }
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

  const MESES_A_FRENTE = 3
  const manutencao = await garantirMensalidadesFuturas(MESES_A_FRENTE)

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
      .select('id, valor, asaasId, atletaId, escolaId, descricao, competencia, pixCopiaCola, atletaNome, familiaCobrancaId')
      .in('status', ['PENDENTE', 'VENCIDO'])
      .is('excluidaEm', null)
      .eq('vencimento', dataAlvo)

    if (!cobrancas?.length) continue

    for (const cob of cobrancas) {
      try {
        const { data: escolaConfig } = await supabaseAdmin.from('Escola')
          .select('ativo')
          .eq('id', cob.escolaId).single()

        if (escolaAtivaCache[cob.escolaId] === undefined)
          escolaAtivaCache[cob.escolaId] = !!escolaConfig?.ativo
        if (!escolaAtivaCache[cob.escolaId]) continue

        const { data: atleta } = await supabaseAdmin.from('Atleta')
          .select('nome, asaasCustomerId, bolsista, ativo').eq('id', cob.atletaId).single()
        if (atleta?.bolsista) continue
        if (atleta && atleta.ativo === false) continue
        // Cobranca de debito automatico: nao manda lembrete (nao ha nada
        // que o pai precise fazer) e nao gera PIX (o webhook PAYMENT_CREATED
        // ja criou essa linha com o asaasId da propria cobranca da assinatura).
        if (cob.descricao && String(cob.descricao).includes('débito automático')) continue

        // Ficha individual de filho de familia: o PIX e a mensagem sao da
        // cobranca AGREGADA, nunca da ficha do filho. Sem isso o responsavel
        // recebia 3 avisos no mesmo dia (um por filho + a agregada), com o
        // valor individual no texto e o valor cheio no link de pagamento.
        // O status continua sendo atualizado normalmente, senao o financeiro
        // ficaria com filhos PENDENTE e agregada VENCIDO.
        const ehFilhoDeFamilia = !!cob.familiaCobrancaId

        // Reconfere o status IMEDIATAMENTE antes de agir. A lista foi lida no
        // inicio da execucao e a fila de WhatsApp espera 4-8s por mensagem —
        // com 20+ cobrancas isso leva minutos, e quem pagou nesse intervalo
        // recebia cobranca mesmo ja tendo pago.
        const { data: atual } = await supabaseAdmin.from('Cobranca')
          .select('status').eq('id', cob.id).maybeSingle()
        if (!atual || atual.status === 'PAGO' || atual.status === 'CANCELADO') continue

        const { data: resps } = await supabaseAdmin.from('Responsavel')
          .select('nome, whatsapp').eq('atletaId', cob.atletaId).eq('principal', true).limit(1)
        const resp = resps?.[0]
        const nomeResp = resp?.nome?.split(' ')[0] || ''
        const nomeExibido = (cob.atletaNome || '').trim()
        const link = `https://gestaofc.com.br/pagar/${cob.id}`
        const valorFmt = Number(cob.valor).toFixed(2)

        if (acao === 'lembrete_previo') {
          if (!cob.asaasId && !ehFilhoDeFamilia) {
            await gerarPixOuAgregarFamilia(cob.id, cob.escolaId, cob.atletaId, Number(cob.valor), dataAlvo, String(cob.competencia).slice(0, 10))
          }
          if (resp?.whatsapp && atleta && !ehFilhoDeFamilia) {
            await msgLembreteD3({
              telefone: resp.whatsapp, nomeResp, nomeAtleta: nomeExibido || atleta.nome?.trim() || '',
              valor: Number(cob.valor), dataVenc: fmtBR(dataAlvo),
              linkPagamento: link, escolaId: cob.escolaId,
            })
            lembretesPrevios++
          }
        }

        else if (acao === 'vencimento_hoje') {
          if (!cob.asaasId && !ehFilhoDeFamilia) {
            await gerarPixOuAgregarFamilia(cob.id, cob.escolaId, cob.atletaId, Number(cob.valor), dataAlvo, String(cob.competencia).slice(0, 10))
          }
          if (resp?.whatsapp && atleta && !ehFilhoDeFamilia) {
            await msgVencimentoHoje({
              telefone: resp.whatsapp, nomeResp, nomeAtleta: nomeExibido || atleta.nome?.trim() || '',
              valor: Number(cob.valor), dataVenc: fmtBR(dataAlvo),
              linkPagamento: link, escolaId: cob.escolaId,
            })
            avisosVencimento++
          }
        }

        else if (acao === 'reemitir') {
          const { error: eVenc } = await supabaseAdmin.from('Cobranca')
            .update({ status: 'VENCIDO' }).eq('id', cob.id)
          if (eVenc) { erros++; continue }

          if (!cob.asaasId && !ehFilhoDeFamilia) {
            await gerarPixOuAgregarFamilia(cob.id, cob.escolaId, cob.atletaId, Number(cob.valor), dataAlvo, String(cob.competencia).slice(0, 10))
          }

          if (resp?.whatsapp && atleta && !ehFilhoDeFamilia) {
            await msgAtraso({
              telefone: resp.whatsapp, nomeResp, nomeAtleta: nomeExibido || atleta.nome?.trim() || '',
              valor: Number(cob.valor), diasAtraso: 1,
              linkPagamento: link, escolaId: cob.escolaId,
            })
          }
          avisosAtraso++
        }

        else if (acao === 'aviso_final') {
          await supabaseAdmin.from('Cobranca').update({ status: 'VENCIDO' }).eq('id', cob.id)
          if (resp?.whatsapp && atleta && !ehFilhoDeFamilia) {
            await msgAtraso({
              telefone: resp.whatsapp, nomeResp, nomeAtleta: nomeExibido || atleta.nome?.trim() || '',
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
