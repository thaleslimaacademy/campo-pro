'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
const BUCKET_WM = 'fotos-watermark'
const BUCKET_ORI = 'fotos-originais'

const storage = supabaseAdmin.storage

// ── ÁLBUNS ────────────────────────────────────────────────

export async function listarAlbuns() {
  const ESCOLA_ID = await getEscolaIdServer()
  const { data, error } = await supabaseAdmin
    .from('Album')
    .select('id, titulo, descricao, dataEvento, capa, ativo, createdAt')
    .eq('escolaId', ESCOLA_ID)
    .order('createdAt', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function criarAlbum(p: { titulo: string; descricao?: string; dataEvento?: string }) {
  const ESCOLA_ID = await getEscolaIdServer()
  const { data, error } = await supabaseAdmin.from('Album').insert({
    escolaId: ESCOLA_ID, ...p
  }).select('id').single()
  if (error) throw new Error(error.message)
  return data
}

export async function excluirAlbum(id: string) {
  const ESCOLA_ID = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Album').delete().eq('id', id).eq('escolaId', ESCOLA_ID)
  if (error) throw new Error(error.message)
  return { ok: true }
}

// ── FOTOS ─────────────────────────────────────────────────

export async function listarFotos(albumId: string) {
  const { data, error } = await supabaseAdmin
    .from('Foto')
    .select('id, urlWatermark, urlOriginal, valor, createdAt')
    .eq('albumId', albumId)
    .order('createdAt')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function uploadFoto(p: {
  albumId: string
  nomeArquivo: string
  conteudoWatermark: string
  conteudoOriginal: string
  valor: number
}) {
  const ESCOLA_ID = await getEscolaIdServer()
  const id = crypto.randomUUID()
  const ext = p.nomeArquivo.split('.').pop() || 'jpg'
  const pathWm  = `${ESCOLA_ID}/${p.albumId}/${id}_wm.${ext}`
  const pathOri = `${ESCOLA_ID}/${p.albumId}/${id}_ori.${ext}`

  const bufWm  = Buffer.from(p.conteudoWatermark.replace(/^data:.+;base64,/, ''), 'base64')
  const bufOri = Buffer.from(p.conteudoOriginal.replace(/^data:.+;base64,/, ''), 'base64')

  const [u1, u2] = await Promise.all([
    storage.from(BUCKET_WM).upload(pathWm, bufWm, { contentType: `image/${ext}`, upsert: true }),
    storage.from(BUCKET_ORI).upload(pathOri, bufOri, { contentType: `image/${ext}`, upsert: true }),
  ])

  if (u1.error) throw new Error('Erro upload watermark: ' + u1.error.message)
  if (u2.error) throw new Error('Erro upload original: ' + u2.error.message)

  const urlWm = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_WM}/${pathWm}`

  const { error } = await supabaseAdmin.from('Foto').insert({
    id,
    albumId: p.albumId,
    escolaId: ESCOLA_ID,
    urlWatermark: urlWm,
    urlOriginal: pathOri,
    valor: p.valor,
  })
  if (error) throw new Error(error.message)
  return { ok: true, id }
}

export async function excluirFoto(id: string) {
  const { data } = await supabaseAdmin.from('Foto').select('urlOriginal').eq('id', id).single()
  if (data?.urlOriginal) {
    await storage.from(BUCKET_ORI).remove([data.urlOriginal])
  }
  await supabaseAdmin.from('Foto').delete().eq('id', id)
  return { ok: true }
}

export async function atualizarValorFoto(id: string, valor: number) {
  const ESCOLA_ID = await getEscolaIdServer()
  await supabaseAdmin.from('Foto').update({ valor }).eq('id', id).eq('escolaId', ESCOLA_ID)
  return { ok: true }
}

// ── COMPRA ────────────────────────────────────────────────

export async function criarCompra(p: {
  compradorNome: string
  compradorTelefone: string
  fotos: string[]
  metodoPagamento: 'PIX' | 'CREDIT_CARD'
  parcelas?: number
}) {
  const ESCOLA_ID = await getEscolaIdServer()
  const { data: fotosData } = await supabaseAdmin
    .from('Foto').select('id, valor').in('id', p.fotos)
  const valorTotal = (fotosData || []).reduce((s, f) => s + Number(f.valor), 0)

  const compraId = crypto.randomUUID()
  await supabaseAdmin.from('FotoCompra').insert({
    id: compraId,
    escolaId: ESCOLA_ID,
    compradorNome: p.compradorNome,
    compradorTelefone: p.compradorTelefone.replace(/\D/g, ''),
    fotos: p.fotos,
    valor: valorTotal,
    status: 'PENDENTE',
    metodoPagamento: p.metodoPagamento,
  })

  return { compraId, valor: valorTotal }
}

export async function gerarLinksOriginais(compraId: string) {
  const { data: compra } = await supabaseAdmin
    .from('FotoCompra').select('fotos, status').eq('id', compraId).single()

  if (!compra || compra.status !== 'PAGO') throw new Error('Compra não encontrada ou não paga')

  const { data: fotos } = await supabaseAdmin
    .from('Foto').select('id, urlOriginal').in('id', compra.fotos)

  const links = await Promise.all((fotos || []).map(async (f) => {
    const { data } = await storage.from(BUCKET_ORI).createSignedUrl(f.urlOriginal, 60 * 60 * 24)
    return { id: f.id, url: data?.signedUrl || '' }
  }))

  return links
}

export async function listarCompras() {
  const ESCOLA_ID = await getEscolaIdServer()
  const { data } = await supabaseAdmin
    .from('FotoCompra')
    .select('id, compradorNome, compradorTelefone, fotos, valor, status, metodoPagamento, pagoEm, linkEnviado, createdAt')
    .eq('escolaId', ESCOLA_ID)
    .order('createdAt', { ascending: false })
  return data ?? []
}