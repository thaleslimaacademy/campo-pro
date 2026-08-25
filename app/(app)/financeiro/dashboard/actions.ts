'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { requireFinanceiro } from '@/lib/auth'

export type ResumoFinanceiro = {
  previsto: number
  recebido: number
  emAberto: number
  vencido: number
  inadimplencia: number
  ticketMedio: number
  totalAtivosComCobranca: number
}

export type MesReceita = {
  mes: string
  label: string
  recebido: number
  previsto: number
}

export type Devedor = {
  atletaId: string
  nome: string
  totalVencido: number
  qtdCobrancas: number
  vencimentoMaisAntigo: string
}

export type DashboardFinanceiroData = {
  resumo: ResumoFinanceiro
  grafico12Meses: MesReceita[]
  topDevedores: Devedor[]
  patrocinadores: number
}

const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago','Set', 'Out', 'Nov', 'Dez']

export async function getDashboardFinanceiro(): Promise<DashboardFinanceiroData> {
  await requireFinanceiro()
  const escolaId = await getEscolaIdServer()

  const agora = new Date()
  const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const fimMesAtual = new Date(agora.getFullYear(), agora.getMonth() + 1,0, 23, 59, 59)
  const inicio12Meses = new Date(agora.getFullYear(), agora.getMonth() - 11, 1)

  // 25/08/2026 — duas correcoes nesta consulta:
  //
  // 1) `.is('excluidaEm', null)`. O filtro era so `.neq(status,'CANCELADO')`,
  //    e isso deixa passar cobranca EXCLUIDA que nao ficou com status
  //    CANCELADO (acontecia no fluxo antigo de exclusao). Resultado: valor
  //    excluido contando como vencido, inflando a inadimplencia do painel.
  //
  // 2) `familiaCobrancaId`. Cobranca de irmaos existe em DUAS camadas: a
  //    linha da familia (o PIX unico que o pai paga, ex. R$160) e uma linha
  //    por filho apontando pra ela (ex. R$80 + R$80). Somar as duas conta a
  //    mesma mensalidade duas vezes.
  const { data: cobrancas12, error: err1 } = await supabaseAdmin
    .from('Cobranca')
    .select('id, valor, status, vencimento, pagoEm, atletaId, familiaCobrancaId')
    .eq('escolaId', escolaId)
    .gte('vencimento', inicio12Meses.toISOString())
    .neq('status', 'CANCELADO')
    .is('excluidaEm', null)
    .order('vencimento', { ascending: true })

  if (err1) throw new Error(err1.message)

  // Descarta as linhas dos filhos e mantem a da familia: o dinheiro que
  // entra e um PIX so, no valor da familia. As linhas de R$80 continuam
  // aparecendo na ficha de cada atleta, que e onde elas fazem sentido.
  //
  // Efeito colateral aceito: a divida da familia aparece em "top devedores"
  // sob o atleta dono da linha agregada, nao rateada entre os irmaos.
  const cobrancas = (cobrancas12 ?? []).filter(c => !c.familiaCobrancaId)

  const cobrancasMesAtual = cobrancas.filter(c => {
    const v = new Date(c.vencimento)
    return v >= inicioMesAtual && v <= fimMesAtual
  })

  const previsto = cobrancasMesAtual.reduce((s, c) => s + (c.valor ?? 0),0)
  const recebidoMes = cobrancasMesAtual.filter(c => c.status === 'PAGO').reduce((s, c) => s + (c.valor ?? 0), 0)
  const emAberto = cobrancasMesAtual.filter(c => c.status === 'PENDENTE').reduce((s, c) => s + (c.valor ?? 0), 0)
  const vencidoMes = cobrancasMesAtual.filter(c => c.status === 'VENCIDO').reduce((s, c) => s + (c.valor ?? 0), 0)
  const inadimplencia = previsto > 0 ? (vencidoMes / previsto) * 100 : 0

  const atletasComPagamento = new Set(cobrancas.filter(c => c.status === 'PAGO').map(c => c.atletaId))
  const totalRecebido12 = cobrancas.filter(c => c.status === 'PAGO').reduce((s, c) => s + (c.valor ?? 0), 0)
  const ticketMedio = atletasComPagamento.size > 0 ? totalRecebido12 / atletasComPagamento.size : 0

  const grafico12Meses: MesReceita[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    const mesStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const doMes = cobrancas.filter(c => {
      const v = new Date(c.vencimento)
      return v.getFullYear() === d.getFullYear() && v.getMonth() === d.getMonth()
    })
    grafico12Meses.push({
      mes: mesStr,
      label: MESES_PT[d.getMonth()],
      recebido: doMes.filter(c => c.status === 'PAGO').reduce((s, c) => s+ (c.valor ?? 0), 0),
      previsto: doMes.reduce((s, c) => s + (c.valor ?? 0), 0),
    })
  }

  const vencidas = cobrancas.filter(c => c.status === 'VENCIDO')
  const atletaIdsVencidos = [...new Set(vencidas.map(c => c.atletaId))]
  let topDevedores: Devedor[] = []

  if (atletaIdsVencidos.length > 0) {
    const { data: atletas } = await supabaseAdmin
      .from('Atleta')
      .select('id, nome')
      .in('id', atletaIdsVencidos.slice(0, 50))

    const atletaMap = new Map((atletas ?? []).map(a => [a.id, a.nome]))

    topDevedores = atletaIdsVencidos
      .map(atletaId => {
        const cobAtleta = vencidas.filter(c => c.atletaId === atletaId)
        return {
          atletaId,
          nome: atletaMap.get(atletaId) ?? 'Atleta',
          totalVencido: cobAtleta.reduce((s, c) => s + (c.valor ?? 0), 0),
          qtdCobrancas: cobAtleta.length,
          vencimentoMaisAntigo: cobAtleta.map(c => c.vencimento).sort()[0] ?? '',
        }
      })
      .sort((a, b) => b.totalVencido - a.totalVencido)
      .slice(0, 8)
  }

  return {
    resumo: { previsto, recebido: recebidoMes, emAberto, vencido: vencidoMes, inadimplencia, ticketMedio, totalAtivosComCobranca: atletasComPagamento.size },
    grafico12Meses,
    topDevedores,
    patrocinadores: 0,
  }
}
