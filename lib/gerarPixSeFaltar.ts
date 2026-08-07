import { supabaseAdmin } from '@/lib/supabase'
import { criarCobrancaPix, getPixQrCode } from '@/lib/asaas'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { garantirClienteAsaas } from '@/lib/asaasCliente'

/**
 * Cria o PIX no Asaas para uma cobranca que ainda nao tem.
 * As mensalidades pre-geradas nascem so no banco; o PIX e criado poucos dias
 * antes do vencimento (regua D-3) ou sob demanda, quando o valor da
 * mensalidade muda na ficha do atleta.
 *
 * 06/08/2026 — o cliente Asaas era montado aqui com Atleta.cpf (campo
 * opcional) e so quando ainda nao existia. Atleta sem CPF proprio gerava
 * cliente sem cpfCnpj, e o Asaas recusa cobranca nesse caso — a regua
 * falhava em silencio (retorna false, ninguem ve). Agora passa pelo
 * garantirClienteAsaas, que usa o CPF do responsavel principal como
 * pagador e atualiza o cliente que ja existe.
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

    const cli = await garantirClienteAsaas(apiKey, atletaId)
    if (!cli.ok) {
      console.error('[gerarPixSeFaltar] cliente Asaas indisponivel para', atletaId, '—', cli.erro)
      return false
    }
    const customerId = cli.customerId

    const nova = await criarCobrancaPix(apiKey, {
      customer: customerId, billingType: 'PIX',
      value: valor, dueDate: vencimento, description: 'Mensalidade',
      ...(multa > 0 ? { fine: { value: multa } } : {}),
      ...(juros > 0 ? { interest: { value: juros } } : {}),
    })
    if (nova.errors || !nova.id) {
      console.error('[gerarPixSeFaltar] Asaas recusou a cobranca de', atletaId, JSON.stringify(nova.errors || nova))
      return false
    }

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
