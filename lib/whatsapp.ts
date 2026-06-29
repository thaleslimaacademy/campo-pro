import { supabaseAdmin } from './supabase'

const EVO_URL = process.env.EVOLUTION_API_URL || 'https://evo.gestaofc.com.br'
const EVO_KEY = process.env.EVOLUTION_API_KEY || 'gestaofc2026'

// Busca instância da escola no banco
async function getInstancia(escolaId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('Escola')
    .select('evolutionInstance, evolutionStatus')
    .eq('id', escolaId)
    .single()
  if (!data?.evolutionInstance || data.evolutionStatus !== 'conectado') return null
  return data.evolutionInstance
}

// Envia mensagem usando a instância da escola
export async function enviarWhatsApp(telefone: string, mensagem: string, escolaId?: string) {
  // Instância: da escola se tiver, senão a global como fallback
  const instancia = escolaId
    ? (await getInstancia(escolaId)) || process.env.EVOLUTION_INSTANCE || 'tlfa'
    : process.env.EVOLUTION_INSTANCE || 'tlfa'

  const numero = telefone.replace(/\D/g, '')
  const numeroFormatado = numero.startsWith('55') ? numero : '55' + numero

  try {
    const res = await fetch(`${EVO_URL}/message/sendText/${instancia}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
      body: JSON.stringify({ number: numeroFormatado, textMessage: { text: mensagem } }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    console.log('📲 WhatsApp enviado via', instancia, ':', data)
    return data
  } catch (err: unknown) {
    console.error('❌ Erro WhatsApp:', (err as Error).message)
  }
}

// Cria instância na Evolution API (chamada ao conectar nova escola)
export async function criarInstanciaEvolution(nomeInstancia: string) {
  try {
    const res = await fetch(`${EVO_URL}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVO_KEY },
      body: JSON.stringify({
        instanceName: nomeInstancia,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    })
    return await res.json()
  } catch (err: unknown) {
    console.error('❌ Erro criar instância:', (err as Error).message)
    return null
  }
}

// Busca QR Code de uma instância
export async function getQrCode(nomeInstancia: string) {
  try {
    const res = await fetch(`${EVO_URL}/instance/connect/${nomeInstancia}`, {
      headers: { 'apikey': EVO_KEY },
    })
    return await res.json()
  } catch { return null }
}

// Verifica status da instância
export async function getStatusInstancia(nomeInstancia: string) {
  try {
    const res = await fetch(`${EVO_URL}/instance/connectionState/${nomeInstancia}`, {
      headers: { 'apikey': EVO_KEY },
    })
    const data = await res.json()
    return data?.instance?.state || 'unknown'
  } catch { return 'unknown' }
}

// Desconecta instância
export async function desconectarInstancia(nomeInstancia: string) {
  try {
    await fetch(`${EVO_URL}/instance/logout/${nomeInstancia}`, {
      method: 'DELETE',
      headers: { 'apikey': EVO_KEY },
    })
  } catch {}
}
