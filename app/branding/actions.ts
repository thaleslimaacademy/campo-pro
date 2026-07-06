'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function salvarBranding(form: {
  corPrimaria: string
  corSecundaria: string
  corTexto: string
  logoUrl?: string
}): Promise<{ ok: boolean; message: string }> {
  const escolaId = await getEscolaIdServer()

  const { error } = await supabaseAdmin.from('Escola').update({
    corPrimaria: form.corPrimaria,
    corSecundaria: form.corSecundaria,
    corTexto: form.corTexto,
    ...(form.logoUrl ? { logoUrl: form.logoUrl } : {}),
  }).eq('id', escolaId)

  if (error) return { ok: false, message: error.message }
  return { ok: true, message: 'Visual salvo!' }
}

export async function uploadLogo(formData: FormData): Promise<{ ok: boolean; url?: string; error?: string }> {
  const escolaId = await getEscolaIdServer()
  const file = formData.get('logo') as File
  if (!file) return { ok: false, error: 'Nenhum arquivo enviado' }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const fileName = `logos/${escolaId}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error } = await supabaseAdmin.storage
    .from('escola-assets')
    .upload(fileName, buffer, { contentType: file.type, upsert: true })

  if (error) return { ok: false, error: error.message }

  const { data } = supabaseAdmin.storage.from('escola-assets').getPublicUrl(fileName)
  const url = data.publicUrl + '?t=' + Date.now()

  await supabaseAdmin.from('Escola').update({ logoUrl: url }).eq('id', escolaId)

  return { ok: true, url }
}
