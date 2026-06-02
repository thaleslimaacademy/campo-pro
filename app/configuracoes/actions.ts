'use server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
      updatedAt: new Date().toISOString(),
    })
    .eq('id', escolaId)

  if (error) {
    console.error('[salvarConfiguracoes] erro:', error)
    return { ok: false, message: error.message }
  }

  return { ok: true, message: 'salvo' }
}
