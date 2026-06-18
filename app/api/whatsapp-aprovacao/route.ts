import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { whatsapp, nomeResponsavel, nomeAtleta, tokenPais, tipo } = await req.json()

    const baseUrl = process.env.EVOLUTION_API_URL
    const apiKey = process.env.EVOLUTION_API_KEY
    const instance = process.env.EVOLUTION_INSTANCE

    if (!baseUrl || !apiKey || !instance) {
      return NextResponse.json({ error: 'Evolution API nao configurada' }, { status: 500 })
    }

    const numero = whatsapp.replace(/\D/g, '')
    const numeroFormatado = numero.startsWith('55') ? numero : '55' + numero
    const nomeResp = nomeResponsavel.split(' ')[0]
    const linkPais = 'https://gestaofc.com.br/pais/' + tokenPais

    let mensagem = ''
    if (tipo === 'aprovacao') {
      mensagem =
        'Ola ' + nomeResp + '!\n\n' +
        'A pre-matricula de *' + nomeAtleta + '* foi *APROVADA*!\n\n' +
        'Seu filho(a) ja esta matriculado(a) na *Thales Lima Football Academy*.\n\n' +
        'Acesse o link abaixo para acompanhar presenca e mensalidades:\n' +
        linkPais + '\n\n' +
        'Bem-vindo(a) a familia TLFA!\n' +
        '_Thales Lima Football Academy - Iturama/MG_'
    } else {
      mensagem =
        'Ola ' + nomeResp + ',\n\n' +
        'Informamos que a pre-matricula de *' + nomeAtleta + '* nao foi aprovada no momento.\n\n' +
        'Entre em contato conosco para mais informacoes:\n' +
        'WhatsApp: (34) 99xxx-xxxx\n\n' +
        '_Thales Lima Football Academy - Iturama/MG_'
    }

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
    })

    const data = await res.json()
    console.log('WhatsApp resultado:', JSON.stringify(data))
    return NextResponse.json({ ok: true, data, numeroEnviado: numeroFormatado })
  } catch (err: any) {
    console.error('Erro WhatsApp aprovacao:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
