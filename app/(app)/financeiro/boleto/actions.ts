'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { buscarClienteAsaas, criarClienteAsaas, criarCobrancaBoleto, cancelarCobrancaAsaas } from '@/lib/asaas'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { requireFinanceiro } from '@/lib/auth'
import { getAsaasKey } from '@/lib/getAsaasKey'

export async function listarAtletasBoleto() {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const { data } = await supabaseAdmin.from('Atleta').select('id, nome')
    .eq('escolaId', ESCOLA_ID).eq('ativo', true).order('nome')
  return (data ?? []) as { id: string; nome: string }[]
}

export async function gerarBoleto(params: {
  atletaId: string; cpf: string; valor: number; vencimento: string; descricao: string
}) {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const apiKey = await getAsaasKey(ESCOLA_ID)
  const { atletaId, cpf, valor, vencimento, descricao } = params
  const cpfLimpo = cpf.replace(/\D/g, '')
  if (cpfLimpo.length !== 11 && cpfLimpo.length !== 14) throw new Error('CPF/CNPJ inválido')
  const { data: atleta } = await supabaseAdmin.from('Atleta').select('nome').eq('id', atletaId).single()
  if (!atleta) throw new Error('Atleta não encontrado')
  const { data: resps } = await supabaseAdmin.from('Responsavel')
    .select('nome, email, telefone').eq('atletaId', atletaId).eq('principal', true).limit(1)
  const resp = resps?.[0]
  let cliente = await buscarClienteAsaas(apiKey, cpfLimpo)
  if (!cliente) {
    cliente = await criarClienteAsaas(apiKey, {
      name: resp?.nome || atleta.nome, cpfCnpj: cpfLimpo,
      email: resp?.email || undefined, phone: resp?.telefone || undefined,
    })
  }
  if (!cliente?.id) throw new Error('Erro ao criar cliente no Asaas: ' + JSON.stringify(cliente))
  const boleto = await criarCobrancaBoleto(apiKey, {
    customer: cliente.id, billingType: 'BOLETO', value: valor, dueDate: vencimento, description: descricao,
  })
  if (!boleto?.bankSlipUrl) throw new Error('Erro ao gerar boleto: ' + JSON.stringify(boleto))
  return { bankSlipUrl: boleto.bankSlipUrl as string, invoiceUrl: boleto.invoiceUrl as string, id: boleto.id as string }
}

export async function getCpfResponsavel(atletaId: string) {
  await requireFinanceiro()
  const { data: resp } = await supabaseAdmin.from('Responsavel')
    .select('cpf').eq('atletaId', atletaId).eq('principal', true).limit(1)
  if (resp?.[0]?.cpf) return resp[0].cpf as string
  const { data: atleta } = await supabaseAdmin.from('Atleta').select('cpf').eq('id', atletaId).single()
  if (atleta?.cpf) return atleta.cpf as string
  const { data: matricula } = await supabaseAdmin.from('Matricula')
    .select('cpf').eq('atletaId', atletaId).not('cpf', 'is', null).limit(1)
  if (matricula?.[0]?.cpf) return matricula[0].cpf as string
  return null
}

export async function salvarCpfResponsavel(atletaId: string, cpf: string) {
  await requireFinanceiro()
  await supabaseAdmin.from('Responsavel')
    .update({ cpf: cpf.replace(/\D/g, '') }).eq('atletaId', atletaId).eq('principal', true)
  return { ok: true }
}

export async function getTelefoneResponsavel(atletaId: string) {
  await requireFinanceiro()
  const { data } = await supabaseAdmin.from('Responsavel')
    .select('telefone').eq('atletaId', atletaId).eq('principal', true).limit(1)
  return data?.[0]?.telefone as string | null
}

export async function listarBoletos() {
  await requireFinanceiro()
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin.from('Cobranca')
    .select('id, atletaId, atletaNome, valor, valorPago, vencimento, status, pagoEm, bankSlipUrl, descricao, asaasId, createdAt')
    .eq('escolaId', escolaId).eq('tipo', 'BOLETO').is('excluidaEm', null)
    .order('createdAt', { ascending: false }).limit(50)
  return (data ?? []) as any[]
}

export async function cancelarBoleto(cobrancaId: string, asaasId: string) {
  await requireFinanceiro()
  const escolaId = await getEscolaIdServer()
  const apiKey = await getAsaasKey(escolaId)
  await cancelarCobrancaAsaas(apiKey, asaasId)
  await supabaseAdmin.from('Cobranca').update({ status: 'CANCELADO' })
    .eq('id', cobrancaId).eq('escolaId', escolaId)
  return { ok: true }
}
