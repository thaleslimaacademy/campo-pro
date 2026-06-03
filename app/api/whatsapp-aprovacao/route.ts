import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { whatsapp, nomeResponsavel, nomeAtleta, tokenPais, tipo } = await req.json()

    const instanceId = process.env.ZAPI_INSTANCE_ID
    const token = process.env.ZAPI_TOKEN
    const clientToken = process.env.ZAPI_CLIENT_TOKEN

    if (!instanceId || !token) {
      return NextResponse.json({ error: 'Z-API nao configurado' }, { status: 500 })
    }

    const numero = whatsapp.replace(/\D/g, '')
    const numeroFormatado = numero.startsWith('55') ? numero : '55' + numero
    const nomeResp = nomeResponsavel.split(' ')[0]
    const linkPais = 'https://gestaofc.com.br/pais/' + tokenPais

    let mensagem = ''

    if (tipo === 'aprovacao') {
      mensagem =
        'Ola ' + nomeResp + '! \n\n' +
        'A matricula de *' + nomeAtleta + '* foi *APROVADA*!\n\n' +
        'Seu filho(a) ja esta matriculado(a) na *Thales Lima Football Academy*.\n\n' +
        'Acompanhe a presenca e mensalidades pelo link:\n' +
        linkPais + '\n\n' +
        'Bem-vindo(a) a familia!\n' +
        '_Thales Lima Football Academy - Iturama/MG_'
    } else {
      mensagem =
        'Ola ' + nomeResp + ',\n\n' +
        'Infelizmente a pre-matricula de *' + nomeAtleta + '* nao foi aprovada no momento.\n\n' +
        'Entre em contato conosco para mais informacoes.\n\n' +
        '_Thales Lima Football Academy - Iturama/MG_'
    }

    const res = await fetch(
      'https://api.z-api.io/instances/' + instanceId + '/token/' + token + '/send-text',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': clientToken || '',
        },
        body: JSON.stringify({ phone: numeroFormatado, message: mensagem }),
      }
    )

    const data = await res.json()
    console.log('WhatsApp aprovacao:', data)
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    console.error('Erro WhatsApp aprovacao:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
