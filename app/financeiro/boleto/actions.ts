'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { buscarClienteAsaas, criarClienteAsaas, criarCobrancaBoleto } from '@/lib/asaas'

const ESCOLA_ID = 'escola-demo'

export async function listarAtletasBoleto() {
  const { data } = await supabaseAdmin
    .from('Atleta').select('id, nome')
    .eq('escolaId', ESCOLA_ID).eq('ativo', true).order('nome')
  return (data ?? []) as { id: string; nome: string }[]
}

export async function gerarBoleto(params: {
  atletaId: string; cpf: string; valor: number; vencimento: string; descricao: string
}) {
  const { atletaId, cpf, valor, vencimento, descricao } = params
  const cpfLimpo = cpf.replace(/\D/g, '')
  if (cpfLimpo.length !== 11 && cpfLimpo.length !== 14) throw new Error('CPF/CNPJ inválido')

  const { data: atleta } = await supabaseAdmin.from('Atleta').select('nome').eq('id', atletaId).single()
  if (!atleta) throw new Error('Atleta não encontrado')

  const { data: resps } = await supabaseAdmin.from('Responsavel')
    .select('nome, email, telefone').eq('atletaId', atletaId).eq('principal', true).limit(1)
  const resp = resps?.[0]

  let cliente = await buscarClienteAsaas(cpfLimpo)
  if (!cliente) {
    cliente = await criarClienteAsaas({
      name: resp?.nome || atleta.nome,
      cpfCnpj: cpfLimpo,
      email: resp?.email || undefined,
      phone: resp?.telefone || undefined,
    })
  }
  if (!cliente?.id) throw new Error('Erro ao criar cliente no Asaas: ' + JSON.stringify(cliente))

  const boleto = await criarCobrancaBoleto({
    customer: cliente.id,
    billingType: 'BOLETO',
    value: valor,
    dueDate: vencimento,
    description: descricao,
  })
  if (!boleto?.bankSlipUrl) throw new Error('Erro ao gerar boleto: ' + JSON.stringify(boleto))

  return {
    bankSlipUrl: boleto.bankSlipUrl as string,
    invoiceUrl: boleto.invoiceUrl as string,
    id: boleto.id as string,
  }
}export async function getCpfResponsavel(atletaId: string) {
  const { data } = await supabaseAdmin.from('Responsavel')
    .select('cpf').eq('atletaId', atletaId).eq('principal', true).limit(1)
  return data?.[0]?.cpf ?? null
}

export async function salvarCpfResponsavel(atletaId: string, cpf: string) {
  await supabaseAdmin.from('Responsavel')
    .update({ cpf: cpf.replace(/\D/g, '') })
    .eq('atletaId', atletaId).eq('principal', true)
  return { ok: true }
}