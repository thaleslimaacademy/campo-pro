import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export type Papel = 'admin' | 'superadmin' | 'diretor' | 'professor' | 'preparador' | 'responsavel'

export interface Sessao {
  clerkUserId: string
  escolaId: string
  perfil: Papel
  ativo: boolean
}

const SUPER_ADMINS = ['user_3EXUg6OJIqPWv0lmQFxafYkeHGR']

export async function getSessao(): Promise<Sessao | null> {
  const { userId } = await auth()
  if (!userId) return null

  const { data, error } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('escolaId, perfil, ativo')
    .eq('clerkUserId', userId)
    .single()

  if (error || !data) return null

  // Super admin: respeita cookie de override de escola
  let escolaId = data.escolaId
  if (SUPER_ADMINS.includes(userId)) {
    const cookieStore = await cookies()
    const override = cookieStore.get('escola_override')?.value
    if (override) escolaId = override
  }

  return {
    clerkUserId: userId,
    escolaId,
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

export const PAPEIS_FINANCEIRO: Papel[] = ['admin', 'superadmin', 'diretor']

export async function podeFinanceiro(): Promise<boolean> {
  const sessao = await getSessao()
  return !!sessao && sessao.ativo && PAPEIS_FINANCEIRO.includes(sessao.perfil)
}

export async function requireFinanceiro(): Promise<Sessao> {
  const sessao = await getSessao()
  if (!sessao) throw new Error('NAO_AUTENTICADO')
  if (!sessao.ativo) throw new Error('CONTA_INATIVA')
  if (!PAPEIS_FINANCEIRO.includes(sessao.perfil)) throw new Error('SEM_PERMISSAO')
  return sessao
}
