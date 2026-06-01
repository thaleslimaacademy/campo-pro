'use server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function salvarBranding(form: {
  corPrimaria: string
  corSecundaria: string
  corTexto: string
  logoUrl?: string
}): Promise<{ ok: boolean; message: string }> {
  const { sessionClaims } = await auth()
  const escolaId = (sessionClaims?.metadata as any)?.escolaId as string
  if (!escolaId) return { ok: false, message: 'escolaId ausente' }

  const { error } = await supabaseAdmin
    .from('Escola')
    .update({
      corPrimaria: form.corPrimaria,
      corSecundaria: form.corSecundaria,
      corTexto: form.corTexto,
      ...(form.logoUrl ? { logoUrl: form.logoUrl } : {}),
      updatedAt: new Date().toISOString(),
    })
    .eq('id', escolaId)

  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Visual salvo!' }
}
