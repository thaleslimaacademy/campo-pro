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

// Se a varredura achar mais que isso, para tudo e devolve a lista sem
// cancelar — cancelamento no Asaas nao tem desfazer. Da pra subir o teto
// conscientemente com ?teto=N depois de ler a lista.
//
// 24/08/2026 — a primeira execucao real bateu no teto com 59 achados, e a
// trava estava certa: 3 deles eram cobranca de LOJA, GALERIA e TAXA, que
// nao moram na tabela Cobranca. A varredura so olhava Cobranca e chamava
// de orfao tudo que nao achasse ali. Agora consulta as 5 tabelas que
// guardam asaasId.
const TETO_PADRAO = 30

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
  /** Preenchido quando o pagamento foi gerado por uma assinatura recorrente. */
  subscription?: string | null
}

type Achado = {
  asaasId: string
  apiKey?: string
  /** Nome do atleta, descoberto pelo customer do Asaas. */
  atleta?: string | null
  atletaAtivo?: boolean | null
  /** true = o app ja tem cobranca viva desse atleta no mesmo mes (orfao e duplicata). */
  duplicata?: boolean
  /**
   * seguro  = pode cancelar sem pensar (sem dono, atleta inativo, ou duplicata)
   * revisar = atleta ATIVO e o app NAO tem cobranca desse mes — cancelar aqui
   *           apaga a unica via de cobranca de uma divida real
   */
  classificacao?: 'seguro' | 'revisar'
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

  const tetoParam = Number(req.nextUrl.searchParams.get('teto'))
  const teto = Number.isFinite(tetoParam) && tetoParam > 0 ? tetoParam : TETO_PADRAO

  const modoParam = req.nextUrl.searchParams.get('modo')
  const modo = modoParam || process.env.CONCILIACAO_MODO || 'relatorio'
  const vaiCancelar = modo === 'cancelar'
  // Por padrao so cancela o que esta classificado como seguro. Os 'revisar'
  // sao mensalidade de atleta ATIVO sem cobranca equivalente no app —
  // cancelar apaga a unica via de uma divida real.
  const incluirRevisar = req.nextUrl.searchParams.get('incluirRevisar') === '1'

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
  // asaasId NAO mora so na Cobranca: loja (Pedido), galeria (FotoCompra),
  // assinatura do SaaS (PlanoEscola) e a propria Escola tambem guardam.
  // Ignorar qualquer uma dessas faz cobranca legitima ser classificada
  // como orfa — e, em modo cancelar, cancelada de verdade.
  const { data: linhas, error: eCob } = await supabaseAdmin
    .from('Cobranca')
    .select('id, asaasId, status, excluidaEm, atletaNome')
    .not('asaasId', 'is', null)
    .limit(5000)

  if (eCob) return NextResponse.json({ error: 'falha ao ler as cobrancas: ' + eCob.message }, { status: 500 })

  const conhecidas = new Map((linhas ?? []).map(l => [l.asaasId as string, l]))

  // Ids de outras tabelas: nao sao "cobranca de atleta", entao nunca viram
  // orfao nem fantasma — so precisam ser reconhecidos como legitimos.
  const outrosIds = new Set<string>()
  const outrasTabelas = ['Pedido', 'FotoCompra', 'PlanoEscola', 'Escola'] as const

  for (const tabela of outrasTabelas) {
    const { data, error } = await supabaseAdmin.from(tabela).select('asaasId').not('asaasId', 'is', null).limit(5000)
    if (error) {
      // Falha fechada: sem conseguir ler a tabela, nao da pra saber o que e
      // legitimo. Melhor abortar do que cancelar cobranca de loja por engano.
      return NextResponse.json({
        error: `falha ao ler ${tabela} (${error.message}). Varredura abortada — sem essa tabela eu classificaria cobranca legitima como orfa.`,
      }, { status: 500 })
    }
    for (const r of data ?? []) if (r.asaasId) outrosIds.add(r.asaasId as string)
  }

  // ── 2b. De quem e cada cobranca ────────────────────────────────────
  // O orfao perdeu a linha no banco, mas o pagamento no Asaas ainda aponta
  // pro customer. Atleta.asaasCustomerId faz a ponte de volta ao nome.
  const { data: atletas, error: eAtl } = await supabaseAdmin
    .from('Atleta').select('id, nome, ativo, asaasCustomerId')
    .not('asaasCustomerId', 'is', null).limit(5000)
  if (eAtl) return NextResponse.json({ error: 'falha ao ler atletas: ' + eAtl.message }, { status: 500 })

  const porCustomer = new Map<string, { atletaId: string; nome: string; ativo: boolean }>()
  for (const a of atletas ?? []) {
    if (a.asaasCustomerId) porCustomer.set(a.asaasCustomerId as string, {
      atletaId: a.id as string, nome: (a.nome as string) || '(sem nome)', ativo: !!a.ativo,
    })
  }

  // Cobranca de familia tem customer proprio — trata como "dono ativo
  // desconhecido", ou seja, sempre cai em revisar.
  const { data: familias } = await supabaseAdmin
    .from('Familia').select('id, asaasCustomerId').not('asaasCustomerId', 'is', null).limit(1000)
  const customersFamilia = new Set((familias ?? []).map(f => f.asaasCustomerId as string))

  // O que o app ainda cobra hoje, por atleta e mes. Se existe aqui, o orfao
  // e sobra: a familia paga pela cobranca nova, nao pela velha.
  const { data: vivas } = await supabaseAdmin
    .from('Cobranca').select('atletaId, competencia')
    .is('excluidaEm', null).in('status', ['PENDENTE', 'VENCIDO', 'PAGO']).limit(5000)
  const cobrancasVivas = new Set(
    (vivas ?? []).filter(v => v.atletaId && v.competencia)
      .map(v => `${v.atletaId}|${String(v.competencia).slice(0, 7)}`)
  )

  /** Preenche dono, duplicata e classificacao de um achado. */
  function classificar(a: Achado, customerId?: string | null) {
    const mes = String(a.vencimento).slice(0, 7)

    if (customerId && customersFamilia.has(customerId)) {
      a.atleta = '(cobranca de familia)'
      a.atletaAtivo = true
      a.duplicata = false
      a.classificacao = 'revisar'
      return
    }

    const dono = customerId ? porCustomer.get(customerId) : undefined

    if (!dono) {
      // Sem dono no banco: atleta apagado ou cobranca de teste.
      a.atleta = null
      a.atletaAtivo = null
      a.duplicata = false
      a.classificacao = 'seguro'
      return
    }

    a.atleta = dono.nome
    a.atletaAtivo = dono.ativo
    a.duplicata = cobrancasVivas.has(`${dono.atletaId}|${mes}`)

    // Atleta inativo (saiu) ou ja tem cobranca do mes no app = sobra.
    a.classificacao = (!dono.ativo || a.duplicata) ? 'seguro' : 'revisar'
  }

  // ── 3. Compara ─────────────────────────────────────────────────────
  const achados: Achado[] = []
  let totalAbertos = 0
  const errosLeitura: string[] = []
  const ignorados = { assinatura: 0, outrasTabelas: 0 }

  for (const [apiKey, nomes] of chaves) {
    const r = await listarPagamentosAbertos(apiKey)
    if (!r.ok) { errosLeitura.push(`${nomes.join('/')}: ${r.erro}`); continue }

    totalAbertos += r.pagamentos.length

    for (const p of r.pagamentos) {
      // Gerado por assinatura recorrente: quem manda nele e a Asaas, nao o
      // app. Cancelar aqui derrubaria uma cobranca de cartao ativa.
      if (p.subscription) { ignorados.assinatura++; continue }

      // Loja, galeria, plano do SaaS: legitimo, so nao mora na Cobranca.
      if (outrosIds.has(p.id)) { ignorados.outrasTabelas++; continue }

      const linha = conhecidas.get(p.id)

      if (!linha) {
        const a: Achado = {
          asaasId: p.id, apiKey, valor: p.value, vencimento: p.dueDate, statusAsaas: p.status,
          descricao: p.description || '(sem descricao)',
          motivo: 'orfao',
          detalhe: 'ativo no Asaas, nao existe no banco — a linha foi apagada sem cancelar',
        }
        classificar(a, p.customer)
        achados.push(a)
        continue
      }

      const foiCancelada = linha.status === 'CANCELADO' || linha.excluidaEm !== null
      if (foiCancelada) {
        // Fantasma foi cancelado no app de proposito: a intencao ja esta
        // registrada, entao cancelar no Asaas so cumpre o que ficou pela metade.
        achados.push({
          asaasId: p.id, apiKey, valor: p.value, vencimento: p.dueDate, statusAsaas: p.status,
          descricao: p.description || '(sem descricao)',
          motivo: 'fantasma',
          detalhe: `cancelada no app${linha.atletaNome ? ` (${linha.atletaNome})` : ''}, mas segue cobravel no Asaas`,
          atleta: linha.atletaNome as string | null,
          classificacao: 'seguro',
        })
      }
    }
  }

  const resumoBase = {
    modo,
    executadoEm: new Date().toISOString(),
    escaneados: totalAbertos,
    ignorados,
    orfaos: achados.filter(a => a.motivo === 'orfao').length,
    fantasmas: achados.filter(a => a.motivo === 'fantasma').length,
    seguros: achados.filter(a => a.classificacao === 'seguro').length,
    revisar: achados.filter(a => a.classificacao === 'revisar').length,
    valorSeguros: Number(achados.filter(a => a.classificacao === 'seguro').reduce((s, a) => s + Number(a.valor || 0), 0).toFixed(2)),
    valorTotal: Number(achados.reduce((s, a) => s + Number(a.valor || 0), 0).toFixed(2)),
    ...(errosLeitura.length ? { errosLeitura } : {}),
  }

  // ── 4. Age (ou nao) ────────────────────────────────────────────────
  if (achados.length === 0) {
    console.log('[conciliacao] nada a fazer —', totalAbertos, 'pagamentos abertos, todos batem com o banco')
    return NextResponse.json({ ...resumoBase, ok: true, mensagem: 'Nenhum PIX orfao. Tudo conciliado.' })
  }

  const qtdSeguros = achados.filter(a => a.classificacao === 'seguro').length
  if (vaiCancelar && (incluirRevisar ? achados.length : qtdSeguros) > teto) {
    console.error('[conciliacao] TETO ESTOURADO:', achados.length, 'achados — nada foi cancelado')
    return NextResponse.json({
      ...resumoBase,
      ok: false,
      travado: true,
      mensagem: `${achados.length} achados, acima do teto de ${teto}. Nada foi cancelado. ` +
        `Confira a lista item a item. Se estiver tudo certo, suba o teto conscientemente com &teto=${achados.length}.`,
      achados: achados.map(({ apiKey, ...resto }) => resto),
    })
  }

  if (!vaiCancelar) {
    console.log('[conciliacao] modo relatorio —', achados.length, 'achados, nada cancelado')
    return NextResponse.json({
      ...resumoBase,
      ok: true,
      mensagem: `${achados.length} PIX orfao(s) encontrado(s). Nada foi cancelado (modo relatorio). ` +
        `Confira a lista e rode de novo com ?modo=cancelar pra executar.`,
      achados: achados.map(({ apiKey, ...resto }) => resto),
    })
  }

  // modo cancelar — cada achado carrega a chave da conta onde foi visto
  const aCancelar = incluirRevisar ? achados : achados.filter(a => a.classificacao === 'seguro')

  if (aCancelar.length === 0) {
    return NextResponse.json({
      ...resumoBase, ok: true, cancelados: 0,
      mensagem: 'Nenhum achado seguro pra cancelar. Os pendentes sao todos "revisar" — use &incluirRevisar=1 se tiver certeza.',
      achados: achados.map(({ apiKey, ...resto }) => resto),
    })
  }

  let cancelados = 0
  for (const a of aCancelar) {
    if (!a.apiKey) { a.cancelado = false; a.erroAoCancelar = 'chave nao registrada no achado'; continue }
    const r = await cancelarNoAsaas(a.apiKey, a.asaasId)
    a.cancelado = r.ok
    if (r.ok) cancelados++
    else a.erroAoCancelar = r.erro
  }

  // Fantasmas tem linha no banco: limpa o asaasId e o codigo PIX pra nao
  // reaparecerem na proxima varredura nem serem reenviados por engano.
  const idsFantasmaLimpos = aCancelar
    .filter(a => a.motivo === 'fantasma' && a.cancelado)
    .map(a => conhecidas.get(a.asaasId)?.id)
    .filter((v): v is string => !!v)

  if (idsFantasmaLimpos.length) {
    await supabaseAdmin.from('Cobranca')
      .update({ asaasId: null, pixCopiaCola: null, pixQrCode: null })
      .in('id', idsFantasmaLimpos)
  }

  for (const a of achados) delete a.apiKey // nunca devolver chave de API na resposta

  console.log('[conciliacao] cancelados', cancelados, 'de', aCancelar.length, 'tentados')

  return NextResponse.json({
    ...resumoBase,
    ok: true,
    tentados: aCancelar.length,
    cancelados,
    falhas: aCancelar.length - cancelados,
    naoTocados: achados.length - aCancelar.length,
    linhasLimpas: idsFantasmaLimpos.length,
    achados: achados.map(({ apiKey, ...resto }) => resto),
  })
}
