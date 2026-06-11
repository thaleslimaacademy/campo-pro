'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const ESCOLA_ID = 'escola-demo'
const BUCKET_WM = 'fotos-watermark'
const BUCKET_ORI = 'fotos-originais'

// Cliente Supabase com service role para Storage
const storage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).storage

// ── ÁLBUNS ────────────────────────────────────────────────

export async function listarAlbuns() {
  const { data, error } = await supabaseAdmin
    .from('Album')
    .select('id, titulo, descricao, dataEvento, capa, ativo, createdAt')
    .eq('escolaId', ESCOLA_ID)
    .order('createdAt', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function criarAlbum(p: { titulo: string; descricao?: string; dataEvento?: string }) {
  const { data, error } = await supabaseAdmin.from('Album').insert({
    escolaId: ESCOLA_ID, ...p
  }).select('id').single()
  if (error) throw new Error(error.message)
  return data
}

export async function excluirAlbum(id: string) {
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
  conteudoWatermark: string  // base64
  conteudoOriginal: string   // base64
  valor: number
}) {
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
    id, albumId: p.albumId, escolaId: ESCOLA_ID,
    urlWatermark: urlWm,
    urlOriginal: pathOri, // path privado — só acessado via signed URL
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
  await supabaseAdmin.from('Foto').update({ valor }).eq('id', id).eq('escolaId', ESCOLA_ID)
  return { ok: true }
}

// ── COMPRA ────────────────────────────────────────────────

export async function criarCompra(p: {
  compradorNome: string
  compradorTelefone: string
  fotos: string[]  // array de Foto.id
  metodoPagamento: 'PIX' | 'CREDIT_CARD'
  parcelas?: number
}) {
  // Calcula valor total
  const { data: fotosData } = await supabaseAdmin
    .from('Foto').select('id, valor').in('id', p.fotos)
  const valorTotal = (fotosData || []).reduce((s, f) => s + Number(f.valor), 0)

  // Cria cliente Asaas
  const telefone = p.compradorTelefone.replace(/\D/g, '')
  const asaasCustomer = await fetch(`https://api.asaas.com/v3/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': process.env.ASAAS_API_KEY! },
    body: JSON.stringify({ name: p.compradorNome, mobilePhone: telefone, cpfCnpj: '00000000191' }),
  }).then(r => r.json())

  const customerId = asaasCustomer.id || asaasCustomer.errors?.[0]?.description

  // Cria cobrança no Asaas
  const body: Record<string, unknown> = {
    customer: customerId,
    billingType: p.metodoPagamento,
    value: valorTotal,
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    description: `Fotos GestaoFC (${p.fotos.length} foto${p.fotos.length > 1 ? 's' : ''})`,
  }
  if (p.metodoPagamento === 'CREDIT_CARD' && p.parcelas && p.parcelas > 1) {
    body.installmentCount = p.parcelas
    body.installmentValue = Number((valorTotal / p.parcelas).toFixed(2))
    delete body.value
  }

  const asaasCobranca = await fetch(`https://api.asaas.com/v3/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': process.env.ASAAS_API_KEY! },
    body: JSON.stringify(body),
  }).then(r => r.json())

  const compraId = crypto.randomUUID()
  await supabaseAdmin.from('FotoCompra').insert({
    id: compraId,
    escolaId: ESCOLA_ID,
    compradorNome: p.compradorNome,
    compradorTelefone: telefone,
    fotos: p.fotos,
    valor: valorTotal,
    status: 'PENDENTE',
    asaasId: asaasCobranca.id,
    metodoPagamento: p.metodoPagamento,
  })

  // Retorna dados para o frontend mostrar QR Code ou link de cartão
  let pixData = null
  if (p.metodoPagamento === 'PIX' && asaasCobranca.id) {
    const qr = await fetch(`https://api.asaas.com/v3/payments/${asaasCobranca.id}/pixQrCode`, {
      headers: { 'access_token': process.env.ASAAS_API_KEY! },
    }).then(r => r.json())
    pixData = { copiaCola: qr.payload, qrCodeImage: qr.encodedImage }
  }

  return {
    compraId,
    valor: valorTotal,
    asaasId: asaasCobranca.id,
    pixData,
    creditCardUrl: asaasCobranca.invoiceUrl || null,
  }
}

// Gera signed URLs para fotos originais (após pagamento)
export async function gerarLinksOriginais(compraId: string) {
  const { data: compra } = await supabaseAdmin
    .from('FotoCompra').select('fotos, status').eq('id', compraId).single()

  if (!compra || compra.status !== 'PAGO') throw new Error('Compra não encontrada ou não paga')

  const { data: fotos } = await supabaseAdmin
    .from('Foto').select('id, urlOriginal').in('id', compra.fotos)

  const links = await Promise.all((fotos || []).map(async (f) => {
    const { data } = await storage.from(BUCKET_ORI).createSignedUrl(f.urlOriginal, 60 * 60 * 24) // 24h
    return { id: f.id, url: data?.signedUrl || '' }
  }))

  return links
}

export async function listarCompras() {
  const { data } = await supabaseAdmin
    .from('FotoCompra')
    .select('id, compradorNome, compradorTelefone, fotos, valor, status, metodoPagamento, pagoEm, linkEnviado, createdAt')
    .eq('escolaId', ESCOLA_ID)
    .order('createdAt', { ascending: false })
  return data ?? []
}