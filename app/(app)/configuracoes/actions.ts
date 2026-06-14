'use server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export interface ConfiguracaoForm {
  nome: string
  telefone: string
  whatsapp: string
  email: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  valorMensalidade: number
  diaVencimento: number
  instagramUrl: string
  facebookUrl: string
  multaAtraso: number
  jurosAoMes: number
  valorDesconto: number
}

export async function salvarConfiguracoes(form: ConfiguracaoForm): Promise<{ ok: boolean; message: string }> {
  const { sessionClaims } = await auth()
  const escolaId = (sessionClaims?.metadata as any)?.escolaId as string
  if (!escolaId) return { ok: false, message: 'escolaId ausente' }

  const { error } = await supabaseAdmin
    .from('Escola')
    .update({
      nome: form.nome,
      telefone: form.telefone,
      whatsapp: form.whatsapp,
      email: form.email,
      endereco: form.endereco,
      cidade: form.cidade,
      estado: form.estado,
      cep: form.cep,
      valorMensalidade: form.valorMensalidade,
      diaVencimento: form.diaVencimento,
      instagramUrl: form.instagramUrl,
      facebookUrl: form.facebookUrl,
      multaAtraso: form.multaAtraso,
      jurosAoMes: form.jurosAoMes,
      valorDesconto: form.valorDesconto,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', escolaId)

  if (error) {
    console.error('[salvarConfiguracoes] erro:', error)
    return { ok: false, message: error.message }
  }

  return { ok: true, message: 'salvo' }
}

export async function listarPlanos() {
  const { userId } = await auth()
  const escolaId = (await import('@/lib/getEscolaIdServer')).getEscolaIdServer
  const { sessionClaims } = await auth()
  const eid = (sessionClaims?.metadata as any)?.escolaId as string
  if (!eid) throw new Error('escolaId ausente')
  const { data } = await supabaseAdmin.from('PlanoMensalidade')
    .select('id, nome, slug, valor').eq('escolaId', eid).order('valor')
  return data ?? []
}

export async function salvarPlano(id: string, valor: number) {
  const { sessionClaims } = await auth()
  const eid = (sessionClaims?.metadata as any)?.escolaId as string
  if (!eid) throw new Error('escolaId ausente')
  const { error } = await supabaseAdmin.from('PlanoMensalidade')
    .update({ valor }).eq('id', id).eq('escolaId', eid)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function criarPlano(nome: string, valor: number) {
  const { sessionClaims } = await auth()
  const eid = (sessionClaims?.metadata as any)?.escolaId as string
  if (!eid) throw new Error('escolaId ausente')
  const slug = nome.toUpperCase().replace(/[^A-Z0-9]/g, '_')
  const { error } = await supabaseAdmin.from('PlanoMensalidade')
    .insert({ id: crypto.randomUUID(), escolaId: eid, nome, slug, valor })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function excluirPlano(id: string) {
  const { sessionClaims } = await auth()
  const eid = (sessionClaims?.metadata as any)?.escolaId as string
  if (!eid) throw new Error('escolaId ausente')
  const { error } = await supabaseAdmin.from('PlanoMensalidade')
    .delete().eq('id', id).eq('escolaId', eid)
  if (error) throw new Error(error.message)
  return { ok: true }
}
