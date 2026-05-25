export async function enviarWhatsApp(telefone: string, mensagem: string) {
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN

  if (!instanceId || !token) {
    console.warn('⚠️ Z-API não configurada')
    return
  }

  const numero = telefone.replace(/\D/g, '')
  const numeroFormatado = numero.startsWith('55') ? numero : `55${numero}`

  try {
    const res = await fetch(
      `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': clientToken || '',
        },
        body: JSON.stringify({
          phone: numeroFormatado,
          message: mensagem,
        }),
        signal: AbortSignal.timeout(10000),
      }
    )

    const data = await res.json()
    console.log('📲 WhatsApp enviado:', data)
    return data
  } catch (err: any) {
    console.error('❌ Erro WhatsApp:', err.message)
  }
}