'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

const ESCOLA_ID = 'escola-demo'

// ── PRODUTOS ──────────────────────────────────────────────

export async function listarProdutos() {
  const { data } = await supabaseAdmin
    .from('Produto')
    .select('*, ProdutoVariacao(*)')
    .eq('escolaId', ESCOLA_ID)
    .order('createdAt', { ascending: false })
  return data ?? []
}

export async function criarProduto(p: { nome: string; descricao?: string; categoria?: string; foto?: string }) {
  const { data, error } = await supabaseAdmin.from('Produto')
    .insert({ escolaId: ESCOLA_ID, ...p }).select('id').single()
  if (error) throw new Error(error.message)
  return data
}

export async function atualizarProduto(id: string, p: { nome?: string; descricao?: string; categoria?: string; foto?: string; ativo?: boolean }) {
  await supabaseAdmin.from('Produto').update(p).eq('id', id).eq('escolaId', ESCOLA_ID)
  return { ok: true }
}

export async function excluirProduto(id: string) {
  await supabaseAdmin.from('Produto').delete().eq('id', id).eq('escolaId', ESCOLA_ID)
  return { ok: true }
}

export async function uploadFotoProduto(produtoId: string, base64: string, nome: string) {
  const ext = nome.split('.').pop() || 'jpg'
  const path = `${ESCOLA_ID}/produtos/${produtoId}.${ext}`
  const buf = Buffer.from(base64.replace(/^data:.+;base64,/, ''), 'base64')
  const { error } = await supabaseAdmin.storage.from('fotos-watermark')
    .upload(path, buf, { contentType: `image/${ext}`, upsert: true })
  if (error) throw new Error(error.message)
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fotos-watermark/${path}`
  await supabaseAdmin.from('Produto').update({ foto: url }).eq('id', produtoId)
  return { url }
}

// ── VARIAÇÕES ─────────────────────────────────────────────

export async function criarVariacao(p: { produtoId: string; tamanho?: string; cor?: string; preco: number; estoque: number }) {
  const { data, error } = await supabaseAdmin.from('ProdutoVariacao').insert(p).select('id').single()
  if (error) throw new Error(error.message)
  return data
}

export async function atualizarVariacao(id: string, p: { tamanho?: string; cor?: string; preco?: number; estoque?: number }) {
  await supabaseAdmin.from('ProdutoVariacao').update(p).eq('id', id)
  return { ok: true }
}

export async function excluirVariacao(id: string) {
  await supabaseAdmin.from('ProdutoVariacao').delete().eq('id', id)
  return { ok: true }
}

// ── PEDIDOS ───────────────────────────────────────────────

export async function listarPedidos() {
  const { data } = await supabaseAdmin
    .from('Pedido')
    .select('*')
    .eq('escolaId', ESCOLA_ID)
    .order('createdAt', { ascending: false })
  return data ?? []
}

export async function atualizarStatusPedido(id: string, status: string) {
  const update: Record<string, unknown> = { status }
  if (status === 'ENTREGUE') update.entregueEm = new Date().toISOString()
  await supabaseAdmin.from('Pedido').update(update).eq('id', id)
  return { ok: true }
}