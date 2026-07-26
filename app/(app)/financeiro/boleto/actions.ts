'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { buscarClienteAsaas, criarClienteAsaas, criarCobrancaBoleto, cancelarCobrancaAsaas } from '@/lib/asaas'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { requireFinanceiro } from '@/lib/auth'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { dataVencimentoNoMes } from '@/lib/dataVencimento'

export async function listarAtletasBoleto() {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const { data } = await supabaseAdmin.from('Atleta').select('id, nome')
    .eq('escolaId', ESCOLA_ID).eq('ativo', true).order('nome')
  return (data ?? []) as { id: string; nome: string }[]
}

/**
 * Gera 1 ou mais boletos (um por mes) com desconto por antecipacao e
 * multa/juros reais de atraso configurados na propria cobranca da Asaas —
 * nao sao mais so uma estimativa calculada na tela.
 *
 * valorBoleto e o valor de face (o que aparece no boleto); valorMensalidade
 * e o valor que o responsavel efetivamente paga se quitar ate o vencimento.
 * A diferenca vira desconto, valido ate a data de vencimento
 * (dueDateLimitDays: 0 = valido ate o proprio dia do vencimento, nao antes).
 */
export async function gerarBoleto(params: {
  atletaId: string; cpf: string
  valorMensalidade: number; valorBoleto: number
  vencimento: string; descricao: string; meses: number
}) {
  await requireFinanceiro()
  const ESCOLA_ID = await getEscolaIdServer()
  const apiKey = await getAsaasKey(ESCOLA_ID)
  const { atletaId, cpf, valorMensalidade, valorBoleto, vencimento, descricao, meses } = params

  const cpfLimpo = cpf.replace(/\D/g, '')
  if (cpfLimpo.length !== 11 && cpfLimpo.length !== 14) throw new Error('CPF/CNPJ inválido')
  if (valorBoleto < valorMensalidade) throw new Error('O valor do boleto não pode ser menor que o valor da mensalidade.')

  const { data: atleta } = await supabaseAdmin.from('Atleta').select('nome').eq('id', atletaId).single()
  if (!atleta) throw new Error('Atleta não encontrado')

  const { data: escolaConfig } = await supabaseAdmin.from('Escola')
    .select('multaAtraso, jurosAoMes').eq('id', ESCOLA_ID).single()
  const multa = Number(escolaConfig?.multaAtraso || 0)
  const juros = Number(escolaConfig?.jurosAoMes || 0)

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

  const desconto = Number((valorBoleto - valorMensalidade).toFixed(2))
  const [anoBase, mesBase] = vencimento.slice(0, 7).split('-').map(Number)
  const diaPreferido = Number(vencimento.slice(8, 10))
  const qtd = Math.max(1, Math.min(12, Number(meses) || 1))

  const gerados: { mes: string; vencimento: string; bankSlipUrl: string; invoiceUrl: string; id: string }[] = []

  for (let i = 0; i < qtd; i++) {
    const venc = dataVencimentoNoMes(anoBase, (mesBase - 1) + i, diaPreferido)
    const boleto = await criarCobrancaBoleto(apiKey, {
      customer: cliente.id, billingType: 'BOLETO', value: valorBoleto, dueDate: venc,
      description: qtd > 1 ? `${descricao} (${i + 1}/${qtd})` : descricao,
      ...(desconto > 0 ? { discount: { value: desconto, dueDateLimitDays: 0, type: 'FIXED' as const } } : {}),
      ...(multa > 0 ? { fine: { value: multa } } : {}),
      ...(juros > 0 ? { interest: { value: juros } } : {}),
    })
    if (!boleto?.bankSlipUrl) {
      throw new Error(`Erro ao gerar boleto do mês ${i + 1}/${qtd}: ` + JSON.stringify(boleto))
    }
    gerados.push({
      mes: venc.slice(0, 7),
      vencimento: venc,
      bankSlipUrl: boleto.bankSlipUrl as string,
      invoiceUrl: boleto.invoiceUrl as string,
      id: boleto.id as string,
    })
  }

  return gerados
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

export async function getValorMensalidadeAtleta(atletaId: string) {
  await requireFinanceiro()
  const { data } = await supabaseAdmin.from('Atleta').select('valorMensalidade').eq('id', atletaId).single()
  return data?.valorMensalidade ? Number(data.valorMensalidade) : null
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
