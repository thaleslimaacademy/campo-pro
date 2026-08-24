import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAsaasKey } from '@/lib/getAsaasKey'

/**
 * CONCILIACAO ASAAS — rede de segurança contra PIX órfão.
 *
 * O problema que ela resolve: por meses, excluir uma cobrança (ou um atleta)
 * apagava a linha do banco SEM cancelar o pagamento no Asaas. O `asaasId`
 * sumia junto, então o codigo PIX continuava vivo e cobravel, invisivel pro
 * sistema. Foi assim que sobraram cobrancas de "atleta teste" vencendo em
 * 2027. As tres fontes foram fechadas em 12/08 (commits 95fe03d e 89f2c84);
 * esta rota limpa o que ficou pra tras e vigia o que o webhook deixar passar.
 *
 * A varredura e ao contrario da normal: em vez de perguntar ao banco o que
 * deveria existir no Asaas, pergunta ao Asaas o que existe e confere se o
 * banco conhece.
 *
 * DOIS MODOS (?modo=):
 *   relatorio (padrao) — so lista. Nao cancela nada. Use pra conferir.
 *   cancelar           — cancela de fato no Asaas.
 * Sem parametro, o padrao vem de CONCILIACAO_MODO (env), e cai em relatorio
 * se a env nao existir. Assim da pra virar a chave sem novo deploy de codigo.
 */

const BASE_URL = 'https://api.asaas.com/v3'

// Se a varredura achar mais que isso, algo esta errado na MINHA logica, nao
// no seu Asaas. Para tudo e devolve a lista sem cancelar — cancelamento no
// Asaas nao tem desfazer.
const TETO_SEGURANCA = 30

// Status do Asaas que ainda podem ser pagos por alguem.
const STATUS_ABERTOS = ['PENDING', 'OVERDUE']

type PagamentoAsaas = {
  id: string
  value: number
  dueDate: string
  status: string
  description?: string
  customer?: string
  invoiceUrl?: string
}

type Achado = {
  asaasId: string
  valor: number
  vencimento: string
  statusAsaas: string
  descricao: string
  motivo: 'orfao' | 'fantasma'
  detalhe: string
  cancelado?: boolean
  erroAoCancelar?: string
}

/** Lista os pagamentos abertos de uma conta, paginando ate o fim. */
async function listarPagamentosAbertos(apiKey: string): Promise<{ ok: true; pagamentos: PagamentoAsaas[] } | { ok: false; erro: string }> {
  const todos: PagamentoAsaas[] = []

  for (const status of STATUS_ABERTOS) {
    let offset = 0
    // Trava anti-loop-infinito: 20 paginas x 100 = 2000 cobrancas abertas,
    // muito acima do volume real das duas escolas.
    for (let pagina = 0; pagina < 20; pagina++) {
      let res: Response
      try {
        res = await fetch(`${BASE_URL}/payments?status=${status}&limit=100&offset=${offset}`, {
          headers: { 'Content-Type': 'application/json', access_token: apiKey },
          signal: AbortSignal.timeout(15000),
        })
      } catch (err: any) {
        return { ok: false, erro: `falha ao falar com o Asaas (${status}): ${err?.message || err}` }
      }

      const texto = await res.text()
      let body: any
      try { body = JSON.parse(texto) } catch { return { ok: false, erro: `resposta invalida do Asaas: ${texto.slice(0, 200)}` } }

      if (body?.errors) {
        return { ok: false, erro: `Asaas recusou a listagem: ${JSON.stringify(body.errors).slice(0, 200)}` }
      }

      const lote: PagamentoAsaas[] = body?.data || []
      todos.push(...lote)

      if (!body?.hasMore || lote.length === 0) break
      offset += 100
    }
  }

  return { ok: true, pagamentos: todos }
}

/** DELETE /payments/{id} lendo o status de verdade. */
async function cancelarNoAsaas(apiKey: string, asaasId: string): Promise<{ ok: boolean; erro?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/payments/${asaasId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', access_token: apiKey },
      signal: AbortSignal.timeout(10000),
    })
    const texto = await res.text()
    let body: any = null
    try { body = JSON.parse(texto) } catch { body = { raw: texto } }

    if (body?.deleted === true) return { ok: true }
    if (res.status === 404) return { ok: true } // ja nao existe = objetivo alcancado

    const descricoes = (body?.errors || []).map((e: any) => e?.description || '').join(' | ')
    return { ok: false, erro: descricoes || `HTTP ${res.status}` }
  } catch (err: any) {
    return { ok: false, erro: err?.message || String(err) }
  }
}

export async function GET(req: NextRequest) {
  // ── AUTENTICACAO ──────────────────────────────────────────────────
  // Aceita: cron da Vercel, chamada com CRON_SECRET, ou admin logado
  // (pra voce conseguir rodar pelo navegador). Esta rota pode CANCELAR
  // cobranca — nao pode ficar aberta.
  const authHeader = req.headers.get('authorization')
  const isVercelCron = (req.headers.get('user-agent') || '').includes('vercel-cron')
    || req.headers.get('x-vercel-cron') !== null
  const temSegredo = authHeader === 'Bearer ' + process.env.CRON_SECRET

  let ehAdmin = false
  try {
    const { userId } = await auth()
    ehAdmin = !!userId
  } catch { ehAdmin = false }

  if (!isVercelCron && !temSegredo && !ehAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const modoParam = req.nextUrl.searchParams.get('modo')
  const modo = modoParam || process.env.CONCILIACAO_MODO || 'relatorio'
  const vaiCancelar = modo === 'cancelar'

  // ── 1. Chaves do Asaas (as escolas podem dividir a mesma conta) ────
  const { data: escolas, error: eEscolas } = await supabaseAdmin
    .from('Escola').select('id, nome')

  if (eEscolas) return NextResponse.json({ error: 'falha ao listar escolas: ' + eEscolas.message }, { status: 500 })

  const chaves = new Map<string, string[]>() // apiKey -> nomes das escolas
  for (const esc of escolas ?? []) {
    try {
      const k = await getAsaasKey(esc.id)
      if (!k) continue
      chaves.set(k, [...(chaves.get(k) ?? []), esc.nome])
    } catch { /* escola sem chave, ignora */ }
  }

  if (chaves.size === 0) {
    return NextResponse.json({ error: 'nenhuma escola com chave do Asaas configurada' }, { status: 400 })
  }

  // ── 2. Tudo que o banco conhece ────────────────────────────────────
  const { data: linhas, error: eCob } = await supabaseAdmin
    .from('Cobranca')
    .select('id, asaasId, status, excluidaEm, atletaNome')
    .not('asaasId', 'is', null)
    .limit(5000)

  if (eCob) return NextResponse.json({ error: 'falha ao ler as cobrancas: ' + eCob.message }, { status: 500 })

  const conhecidas = new Map((linhas ?? []).map(l => [l.asaasId as string, l]))

  // ── 3. Compara ─────────────────────────────────────────────────────
  const achados: Achado[] = []
  let totalAbertos = 0
  const errosLeitura: string[] = []

  for (const [apiKey, nomes] of chaves) {
    const r = await listarPagamentosAbertos(apiKey)
    if (!r.ok) { errosLeitura.push(`${nomes.join('/')}: ${r.erro}`); continue }

    totalAbertos += r.pagamentos.length

    for (const p of r.pagamentos) {
      const linha = conhecidas.get(p.id)

      if (!linha) {
        achados.push({
          asaasId: p.id, valor: p.value, vencimento: p.dueDate, statusAsaas: p.status,
          descricao: p.description || '(sem descricao)',
          motivo: 'orfao',
          detalhe: 'ativo no Asaas, nao existe no banco — a linha foi apagada sem cancelar',
        })
        continue
      }

      const foiCancelada = linha.status === 'CANCELADO' || linha.excluidaEm !== null
      if (foiCancelada) {
        achados.push({
          asaasId: p.id, valor: p.value, vencimento: p.dueDate, statusAsaas: p.status,
          descricao: p.description || '(sem descricao)',
          motivo: 'fantasma',
          detalhe: `cancelada no app${linha.atletaNome ? ` (${linha.atletaNome})` : ''}, mas segue cobravel no Asaas`,
        })
      }
    }
  }

  const resumoBase = {
    modo,
    executadoEm: new Date().toISOString(),
    escaneados: totalAbertos,
    orfaos: achados.filter(a => a.motivo === 'orfao').length,
    fantasmas: achados.filter(a => a.motivo === 'fantasma').length,
    valorTotal: Number(achados.reduce((s, a) => s + Number(a.valor || 0), 0).toFixed(2)),
    ...(errosLeitura.length ? { errosLeitura } : {}),
  }

  // ── 4. Age (ou nao) ────────────────────────────────────────────────
  if (achados.length === 0) {
    console.log('[conciliacao] nada a fazer —', totalAbertos, 'pagamentos abertos, todos batem com o banco')
    return NextResponse.json({ ...resumoBase, ok: true, mensagem: 'Nenhum PIX orfao. Tudo conciliado.' })
  }

  if (achados.length > TETO_SEGURANCA) {
    console.error('[conciliacao] TETO ESTOURADO:', achados.length, 'achados — nada foi cancelado')
    return NextResponse.json({
      ...resumoBase,
      ok: false,
      travado: true,
      mensagem: `${achados.length} achados, acima do teto de ${TETO_SEGURANCA}. Nada foi cancelado. ` +
        `Volume assim costuma indicar erro na varredura, nao bagunca real — confira a lista antes de liberar.`,
      achados,
    })
  }

  if (!vaiCancelar) {
    console.log('[conciliacao] modo relatorio —', achados.length, 'achados, nada cancelado')
    return NextResponse.json({
      ...resumoBase,
      ok: true,
      mensagem: `${achados.length} PIX orfao(s) encontrado(s). Nada foi cancelado (modo relatorio). ` +
        `Confira a lista e rode de novo com ?modo=cancelar pra executar.`,
      achados,
    })
  }

  // modo cancelar
  const porChave = new Map<string, string>() // asaasId -> apiKey
  for (const [apiKey] of chaves) {
    for (const a of achados) if (!porChave.has(a.asaasId)) porChave.set(a.asaasId, apiKey)
  }

  let cancelados = 0
  for (const a of achados) {
    const apiKey = porChave.get(a.asaasId)
    if (!apiKey) { a.cancelado = false; a.erroAoCancelar = 'chave nao encontrada'; continue }
    const r = await cancelarNoAsaas(apiKey, a.asaasId)
    a.cancelado = r.ok
    if (r.ok) cancelados++
    else a.erroAoCancelar = r.erro
  }

  // Fantasmas tem linha no banco: limpa o asaasId e o codigo PIX pra nao
  // reaparecerem na proxima varredura nem serem reenviados por engano.
  const idsFantasmaLimpos = achados
    .filter(a => a.motivo === 'fantasma' && a.cancelado)
    .map(a => conhecidas.get(a.asaasId)?.id)
    .filter((v): v is string => !!v)

  if (idsFantasmaLimpos.length) {
    await supabaseAdmin.from('Cobranca')
      .update({ asaasId: null, pixCopiaCola: null, pixQrCode: null })
      .in('id', idsFantasmaLimpos)
  }

  console.log('[conciliacao] cancelados', cancelados, 'de', achados.length)

  return NextResponse.json({
    ...resumoBase,
    ok: true,
    cancelados,
    falhas: achados.length - cancelados,
    linhasLimpas: idsFantasmaLimpos.length,
    achados,
  })
}
