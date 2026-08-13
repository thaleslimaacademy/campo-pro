import { supabaseAdmin } from '@/lib/supabase'
import { getAsaasKey } from '@/lib/getAsaasKey'

const BASE_URL = 'https://api.asaas.com/v3'

/**
 * Campos que precisam ser zerados sempre que o PIX deixa de ser pagavel.
 * Se o codigo continuar no banco, a pagina /pagar e a regua continuam
 * entregando um QR que nao existe mais no Asaas.
 */
export const CAMPOS_PIX_LIMPOS = {
  pixCopiaCola: null as string | null,
  pixQrCode: null as string | null,
  bankSlipUrl: null as string | null,
}

export type ResultadoPix =
  | { ok: true; cancelado: boolean; observacao?: string }
  | { ok: false; erro: string }

/**
 * DELETE /payments/{id} com leitura do status HTTP.
 * Proposital nao reusar cancelarCobrancaAsaas() do lib/asaas.ts: aquela
 * descarta o status e o corpo do erro, entao o chamador nao consegue
 * distinguir "cancelei" de "o Asaas recusou".
 */
async function deletarPagamentoAsaas(apiKey: string, asaasId: string): Promise<{
  ok: boolean; jaInexistente: boolean; erro?: string
}> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}/payments/${asaasId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', access_token: apiKey },
      signal: AbortSignal.timeout(10000),
    })
  } catch (err: any) {
    return { ok: false, jaInexistente: false, erro: `nao consegui falar com o Asaas (${err?.message || err})` }
  }

  const text = await res.text()
  let body: any = null
  try { body = JSON.parse(text) } catch { body = { raw: text } }
  console.log('📦 Asaas DELETE payment', asaasId, res.status, text.slice(0, 300))

  if (body?.deleted === true) return { ok: true, jaInexistente: false }

  const descricoes: string = (body?.errors || [])
    .map((e: any) => `${e?.code || ''} ${e?.description || ''}`)
    .join(' | ')
    .toLowerCase()

  // Ja nao existe no Asaas = objetivo alcancado.
  if (res.status === 404 || /not_found|nao foi possivel encontrar|não foi possível encontrar/.test(descricoes)) {
    return { ok: true, jaInexistente: true }
  }

  // O Asaas recusa deletar cobranca ja recebida. Isso NAO e sucesso:
  // significa que o dinheiro entrou e o app nao sabe.
  if (/recebid|confirmad|received/.test(descricoes)) {
    return {
      ok: false, jaInexistente: false,
      erro: 'o Asaas diz que esta cobranca ja foi recebida/confirmada — confira o pagamento antes de excluir',
    }
  }

  return { ok: false, jaInexistente: false, erro: descricoes || `resposta inesperada do Asaas (HTTP ${res.status})` }
}

/**
 * Cancela o PIX de uma cobranca no Asaas. NAO altera o banco — quem chama
 * decide o que gravar, e so grava se aqui voltar ok:true.
 */
export async function cancelarPixDaCobranca(cobrancaId: string): Promise<ResultadoPix> {
  const { data: cob, error } = await supabaseAdmin
    .from('Cobranca')
    .select('id, asaasId, escolaId, status')
    .eq('id', cobrancaId)
    .maybeSingle()

  if (error) return { ok: false, erro: 'erro ao ler a cobranca: ' + error.message }
  if (!cob) return { ok: false, erro: 'cobranca nao encontrada' }
  if (!cob.asaasId) return { ok: true, cancelado: false, observacao: 'cobranca sem PIX no Asaas' }
  if (cob.status === 'PAGO') return { ok: true, cancelado: false, observacao: 'cobranca ja paga — PIX preservado' }

  let apiKey: string | null = null
  try {
    apiKey = await getAsaasKey(cob.escolaId)
  } catch (err: any) {
    return { ok: false, erro: 'nao consegui ler a chave do Asaas: ' + (err?.message || err) }
  }
  if (!apiKey) return { ok: false, erro: 'escola sem chave do Asaas configurada — o PIX nao pode ser cancelado' }

  const r = await deletarPagamentoAsaas(apiKey, cob.asaasId)
  if (!r.ok) return { ok: false, erro: r.erro || 'falha ao cancelar o PIX no Asaas' }

  return {
    ok: true,
    cancelado: !r.jaInexistente,
    observacao: r.jaInexistente ? 'PIX ja nao existia no Asaas' : undefined,
  }
}
