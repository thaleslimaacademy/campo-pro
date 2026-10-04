import { NextResponse } from 'next/server'
import { getSessao, PAPEIS_FINANCEIRO, type Sessao } from '@/lib/auth'

/**
 * Para API routes do financeiro. Devolve a sessao (com escolaId ja resolvido,
 * respeitando o override do super admin) ou uma resposta 401/403 pronta.
 *
 *   const s = await sessaoFinanceiroApi()
 *   if (s instanceof NextResponse) return s
 *
 * Nunca use escolaId vindo do body: sempre s.escolaId.
 */
export async function sessaoFinanceiroApi(): Promise<Sessao | NextResponse> {
  const sessao = await getSessao().catch(() => null)
  if (!sessao) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  if (!sessao.ativo) return NextResponse.json({ error: 'Conta inativa' }, { status: 403 })
  if (!PAPEIS_FINANCEIRO.includes(sessao.perfil)) {
    return NextResponse.json({ error: 'Sem permissao para o financeiro' }, { status: 403 })
  }
  return sessao
}
