'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export interface ConfiguracaoForm {
  nome: string; telefone: string; whatsapp: string; email: string
  endereco: string; cidade: string; estado: string; cep: string
  valorMensalidade: number; diaVencimento: number; valorMatricula?: number; diasNPS?: number
  instagramUrl: string; facebookUrl: string
  multaAtraso: number; jurosAoMes: number; valorDesconto: number
  asaasApiKey?: string
}

export async function salvarConfiguracoes(form: ConfiguracaoForm): Promise<{ ok: boolean; message: string }> {
  const escolaId = await getEscolaIdServer()
  const payload: Record<string, any> = {
    nome: form.nome, telefone: form.telefone, whatsapp: form.whatsapp,
    email: form.email, endereco: form.endereco, cidade: form.cidade,
    estado: form.estado, cep: form.cep,
    valorMensalidade: form.valorMensalidade, diaVencimento: form.diaVencimento,
    valorMatricula: form.valorMatricula ?? 0,
    diasNPS: form.diasNPS ?? 0,
    instagramUrl: form.instagramUrl, facebookUrl: form.facebookUrl,
    multaAtraso: form.multaAtraso, jurosAoMes: form.jurosAoMes,
    valorDesconto: form.valorDesconto, updatedAt: new Date().toISOString(),
  }
  if (form.asaasApiKey !== undefined && form.asaasApiKey.trim() !== '') {
    payload.asaasApiKey = form.asaasApiKey.trim()
  }
  const { error } = await supabaseAdmin.from('Escola').update(payload).eq('id', escolaId)
  if (error) { console.error('[salvarConfiguracoes] erro:', error); return { ok: false, message: error.message } }
  return { ok: true, message: 'salvo' }
}

export async function carregarConfiguracoes() {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin
    .from('Escola')
    .select('nome, telefone, whatsapp, email, endereco, cidade, estado, cep, valorMensalidade, diaVencimento, instagramUrl, facebookUrl, multaAtraso, jurosAoMes, valorDesconto, valorMatricula, asaasApiKey')
    .eq('id', escolaId).single()
  return data
}

export async function listarPlanos() {
  const eid = await getEscolaIdServer()
  const { data } = await supabaseAdmin.from('PlanoMensalidade')
    .select('id, nome, slug, valor').eq('escolaId', eid).order('valor')
  return data ?? []
}

export async function salvarPlano(id: string, valor: number) {
  const eid = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('PlanoMensalidade')
    .update({ valor }).eq('id', id).eq('escolaId', eid)
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function criarPlano(nome: string, valor: number) {
  const eid = await getEscolaIdServer()
  const slug = nome.toUpperCase().replace(/[^A-Z0-9]/g, '_')
  const { error } = await supabaseAdmin.from('PlanoMensalidade')
    .insert({ id: crypto.randomUUID(), escolaId: eid, nome, slug, valor })
  if (error) throw new Error(error.message)
  return { ok: true }
}

export async function excluirPlano(id: string) {
  const eid = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('PlanoMensalidade')
    .delete().eq('id', id).eq('escolaId', eid)
  if (error) throw new Error(error.message)
  return { ok: true }
}
