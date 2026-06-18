export async function enviarWhatsApp(telefone: string, mensagem: string) {
  const baseUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY
  const instance = process.env.EVOLUTION_INSTANCE

  if (!baseUrl || !apiKey || !instance) {
    console.warn('⚠️ Evolution API não configurada')
    return
  }

  const numero = telefone.replace(/\D/g, '')
  const numeroFormatado = numero.startsWith('55') ? numero : '55' + numero

  try {
    const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: numeroFormatado,
        textMessage: { text: mensagem },
      }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    console.log('📲 WhatsApp enviado:', data)
    return data
  } catch (err: any) {
    console.error('❌ Erro WhatsApp:', err.message)
  }
}
