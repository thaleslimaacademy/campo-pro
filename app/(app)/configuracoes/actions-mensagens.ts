'use server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function salvarMensagens(form: {
  msgInadimplente: string
  msgLembrete: string
  msgAniversario: string
}): Promise<{ ok: boolean; message: string }> {
  const { sessionClaims } = await auth()
  const escolaId = (sessionClaims?.metadata as any)?.escolaId as string
  if (!escolaId) return { ok: false, message: 'escolaId ausente' }

  const { error } = await supabaseAdmin
    .from('Escola')
    .update({
      msgInadimplente: form.msgInadimplente,
      msgLembrete: form.msgLembrete,
      msgAniversario: form.msgAniversario,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', escolaId)

  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Mensagens salvas!' }
}
