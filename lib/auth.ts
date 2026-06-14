import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export type Papel = 'admin' | 'professor' | 'comissao' | 'pai' | 'aluno'

export interface Sessao {
  clerkUserId: string
  perfilId: string
  escolaId: string
  papel: Papel
  nome: string
}

export async function getSessao(): Promise<Sessao | null> {
  const { userId } = await auth()
  if (!userId) return null

  const { data, error } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('id, escolaId, perfil, nome')
    .eq('clerkUserId', userId)
    .eq('ativo', true)
    .maybeSingle()

  if (error || !data) return null

  return {
    clerkUserId: userId,
    perfilId: data.id,
    escolaId: data.escolaId,
    papel: data.perfil as Papel,
    nome: data.nome,
  }
}

export async function requireSessao(): Promise<Sessao> {
  const sessao = await getSessao()
  if (!sessao) redirect('/acesso-negado')
  return sessao
}

export async function requirePapel(...papeis: Papel[]): Promise<Sessao> {
  const sessao = await getSessao()
  if (!sessao) throw new Error('NAO_AUTENTICADO')
  if (!papeis.includes(sessao.papel)) throw new Error('SEM_PERMISSAO')
  return sessao
}
