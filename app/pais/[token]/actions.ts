'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { criarClienteAsaas, criarAssinaturaCartao } from '@/lib/asaas'
import { dataVencimentoNoMes } from '@/lib/dataVencimento'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function ativarDebitoAutomatico(token: string, dados: {
  nomeTitular: string; numeroCartao: string; validadeMes: string; validadeAno: string; cvv: string
  cpfTitular: string; cep: string; numeroEndereco: string
}) {
  // Resolve o atleta pelo token — nunca confia em atletaId vindo do cliente.
  const { data: atleta } = await supabaseAdmin.from('Atleta')
    .select('id, nome, escolaId, valorMensalidade, diaVencimento, asaasCustomerId, asaasSubscriptionId')
    .eq('tokenPais', token).single()
  if (!atleta) throw new Error('Link inválido.')
  if (atleta.asaasSubscriptionId) throw new Error('Este atleta já está com débito automático ativo.')

  const valor = Number(atleta.valorMensalidade)
  if (!valor) throw new Error('A escola ainda não configurou o valor da mensalidade deste atleta. Fale com a escola antes de ativar.')

  const cpfLimpo = dados.cpfTitular.replace(/\D/g, '')
  if (cpfLimpo.length !== 11) throw new Error('CPF do titular inválido.')

  const apiKey = await getAsaasKey(atleta.escolaId)

  let customerId = atleta.asaasCustomerId
  if (!customerId) {
    const cliente = await criarClienteAsaas(apiKey, { name: atleta.nome, cpfCnpj: cpfLimpo } as never)
    if (!cliente?.id) throw new Error('Erro ao registrar o responsável na Asaas.')
    customerId = cliente.id
    await supabaseAdmin.from('Atleta').update({ asaasCustomerId: customerId }).eq('id', atleta.id)
  }

  // Primeira cobrança: no dia preferido, no mes atual se ainda nao passou,
  // senao no mes seguinte.
  const dia = Math.min(Math.max(1, Number(atleta.diaVencimento) || 10), 31)
  const hoje = new Date()
  const hojeISO = hoje.toISOString().slice(0, 10)
  const tentativaEsteMes = dataVencimentoNoMes(hoje.getFullYear(), hoje.getMonth(), dia)
  const nextDueDate = tentativaEsteMes >= hojeISO
    ? tentativaEsteMes
    : dataVencimentoNoMes(hoje.getFullYear(), hoje.getMonth() + 1, dia)

  const hdrs = await headers()
  const remoteIp = hdrs.get('x-forwarded-for')?.split(',')[0].trim() || hdrs.get('x-real-ip') || '127.0.0.1'

  const assinatura = await criarAssinaturaCartao(apiKey, {
    customer: customerId,
    value: valor,
    nextDueDate,
    cycle: 'MONTHLY',
    description: 'Mensalidade — débito automático',
    creditCard: {
      holderName: dados.nomeTitular,
      number: dados.numeroCartao.replace(/\D/g, ''),
      expiryMonth: dados.validadeMes,
      expiryYear: dados.validadeAno,
      ccv: dados.cvv,
    },
    creditCardHolderInfo: {
      name: dados.nomeTitular,
      cpfCnpj: cpfLimpo,
      postalCode: dados.cep.replace(/\D/g, ''),
      addressNumber: dados.numeroEndereco,
    },
    remoteIp,
  })

  if (!assinatura?.id) {
    const motivo = assinatura?.errors?.[0]?.description || 'Cartão recusado ou dados inválidos.'
    throw new Error(motivo)
  }

  const { error } = await supabaseAdmin.from('Atleta').update({
    asaasSubscriptionId: assinatura.id,
    formaPagamento: 'CARTAO_RECORRENTE',
  }).eq('id', atleta.id)
  if (error) throw new Error('Assinatura criada na Asaas, mas falhou ao salvar no sistema: ' + error.message)

  revalidatePath(`/pais/${token}`)
  return { ok: true }
}
