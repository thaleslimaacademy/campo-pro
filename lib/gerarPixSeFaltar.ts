import { supabaseAdmin } from '@/lib/supabase'
import { criarClienteAsaas, criarCobrancaPix, getPixQrCode } from '@/lib/asaas'
import { getAsaasKey } from '@/lib/getAsaasKey'

/**
 * Cria o PIX no Asaas para uma cobranca que ainda nao tem.
 * As mensalidades pre-geradas nascem so no banco; o PIX e criado poucos dias
 * antes do vencimento (regua D-3) ou sob demanda, quando o valor da
 * mensalidade muda na ficha do atleta.
 */
export async function gerarPixSeFaltar(
  cobrancaId: string, escolaId: string, atletaId: string,
  valor: number, vencimento: string
): Promise<boolean> {
  try {
    const apiKey = await getAsaasKey(escolaId)
    if (!apiKey) return false

    const { data: cfg } = await supabaseAdmin.from('Escola')
      .select('multaAtraso, jurosAoMes').eq('id', escolaId).single()
    const multa = Number(cfg?.multaAtraso || 0)
    const juros = Number(cfg?.jurosAoMes || 0)

    const { data: atleta } = await supabaseAdmin.from('Atleta')
      .select('nome, cpf, telefone, cep, endereco, numero, bairro, asaasCustomerId')
      .eq('id', atletaId).single()
    if (!atleta) return false

    let customerId = atleta.asaasCustomerId
    if (!customerId) {
      const dados: Record<string, string> = { name: atleta.nome }
      const cpf = (atleta.cpf || '').replace(/\D/g, '')
      if (cpf.length >= 11) dados.cpfCnpj = cpf
      if (atleta.telefone) dados.phone = atleta.telefone.replace(/\D/g, '')
      if (atleta.endereco) dados.address = atleta.endereco
      if (atleta.numero) dados.addressNumber = atleta.numero
      if (atleta.bairro) dados.province = atleta.bairro
      if (atleta.cep) dados.postalCode = atleta.cep.replace(/\D/g, '')
      const cliente = await criarClienteAsaas(apiKey, dados as never)
      if (cliente.errors || !cliente.id) return false
      customerId = cliente.id
      await supabaseAdmin.from('Atleta').update({ asaasCustomerId: customerId }).eq('id', atletaId)
    }

    const nova = await criarCobrancaPix(apiKey, {
      customer: customerId, billingType: 'PIX',
      value: valor, dueDate: vencimento, description: 'Mensalidade',
      ...(multa > 0 ? { fine: { value: multa } } : {}),
      ...(juros > 0 ? { interest: { value: juros } } : {}),
    })
    if (nova.errors || !nova.id) return false

    const qr = await getPixQrCode(apiKey, nova.id)
    const { error } = await supabaseAdmin.from('Cobranca').update({
      asaasId: nova.id, tipo: 'PIX',
      pixCopiaCola: qr.payload || null,
      pixQrCode: qr.encodedImage || null,
    }).eq('id', cobrancaId)
    if (error) { console.error('PIX criado no Asaas mas nao salvo:', error.message); return false }
    return true
  } catch (err) {
    console.error('Erro ao gerar PIX sob demanda:', (err as Error).message)
    return false
  }
}
