import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export type Papel = 'admin' | 'professor' | 'responsavel'

export interface Sessao {
  clerkUserId: string
  escolaId: string
  perfil: Papel
  ativo: boolean
}

export async function getSessao(): Promise<Sessao | null> {
  const { userId } = await auth()
  if (!userId) return null

  const { data, error } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('escolaId, perfil, ativo')
    .eq('clerkUserId', userId)
    .single()

  if (error || !data) return null

  return {
    clerkUserId: userId,
    escolaId: data.escolaId,
    perfil: data.perfil as Papel,
    ativo: data.ativo,
  }
}

export async function requirePapel(papelRequerido: Papel | Papel[]): Promise<Sessao> {
  const sessao = await getSessao()

  if (!sessao) {
    throw new Error('NAO_AUTENTICADO')
  }

  if (!sessao.ativo) {
    throw new Error('CONTA_INATIVA')
  }

  const papeis = Array.isArray(papelRequerido) ? papelRequerido : [papelRequerido]

  if (!papeis.includes(sessao.perfil)) {
    throw new Error('SEM_PERMISSAO')
  }

  return sessao
}

export async function getAtletasDoResponsavel(clerkUserId: string, escolaId: string) {
  const { data } = await supabaseAdmin
    .from('ResponsavelAtleta')
    .select('atletaId, relacao, principal, Atleta(id, nome, dataNascimento, foto, turmaId, Turma(nome))')
    .eq('clerkUserId', clerkUserId)
    .eq('escolaId', escolaId)
    .eq('status', 'ativo')

  return data ?? []
}
