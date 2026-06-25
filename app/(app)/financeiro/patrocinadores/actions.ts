'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { DEFAULT_TEMPLATE } from './constants'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { requireFinanceiro } from '@/lib/auth'

export type { Patrocinador } from './constants'

export async function listarPatrocinadores() {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const { data, error } = await supabaseAdmin
    .from('Patrocinador')
    .select('id, nome, empresa, telefone, valor, vencimento, status, descricao, mensagemCobranca, createdAt')
    .eq('escolaId', ESCOLA_ID)
    .order('vencimento', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function criarPatrocinador(p: {
  nome: string; empresa?: string; telefone?: string; valor: number
  vencimento: string; descricao?: string; mensagemCobranca?: string
}) {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Patrocinador').insert({
    escolaId: ESCOLA_ID, ...p,
    mensagemCobranca: p.mensagemCobranca || DEFAULT_TEMPLATE,
  })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function renovarPatrocinador(id: string, novoVencimento: string) {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Patrocinador')
    .update({ vencimento: novoVencimento, status: 'ATIVO' })
    .eq('id', id).eq('escolaId', ESCOLA_ID)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function atualizarMensagem(id: string, mensagemCobranca: string) {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Patrocinador')
    .update({ mensagemCobranca }).eq('id', id).eq('escolaId', ESCOLA_ID)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function excluirPatrocinador(id: string) {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Patrocinador')
    .delete().eq('id', id).eq('escolaId', ESCOLA_ID)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function enviarCobrancaWhatsApp(id: string) {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const { data, error } = await supabaseAdmin.from('Patrocinador')
    .select('nome, telefone, valor, vencimento, mensagemCobranca')
    .eq('id', id).single()

  if (error || !data) throw new Error('Patrocinador não encontrado')

  const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  const dataVenc = new Date(data.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')

  const mensagem = (data.mensagemCobranca || DEFAULT_TEMPLATE)
    .replace(/\{\{nome\}\}/g, data.nome)
    .replace(/\{\{valor\}\}/g, brl(data.valor))
    .replace(/\{\{vencimento\}\}/g, dataVenc)

  const telefone = data.telefone?.replace(/\D/g, '')
  if (!telefone) throw new Error('Patrocinador sem telefone cadastrado')

  const resp = await fetch(
    `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}/send-text`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Client-Token': process.env.ZAPI_CLIENT_TOKEN ?? '' },
      body: JSON.stringify({ phone: `55${telefone}`, message: mensagem }),
    }
  )
  if (!resp.ok) throw new Error(`Erro Z-API: ${await resp.text()}`)
  return { ok: true }
}