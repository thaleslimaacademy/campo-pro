import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const { whatsapp, nomeResponsavel, nomeAtleta, tokenPais, tipo, escolaId } = await req.json()

    // Busca dados da escola para personalizar a mensagem
    const { data: escola } = await supabaseAdmin
      .from('Escola')
      .select('nome, whatsapp, cidade, estado')
      .eq('id', escolaId || 'escola-demo')
      .single()

    const nomeEscola = escola?.nome?.includes('—')
      ? escola.nome.split('—').pop()?.trim()
      : escola?.nome || 'Thales Lima Football Academy'

    const cidadeEstado = escola?.cidade && escola?.estado
      ? `${escola.cidade}/${escola.estado}`
      : 'Iturama/MG'

    const whatsappEscola = escola?.whatsapp
      ? escola.whatsapp.replace(/\D/g, '').replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '($1) $2 $3-$4')
      : null

    const nomeResp = (nomeResponsavel || '').split(' ')[0]
    const linkPais = `https://gestaofc.com.br/pais/${tokenPais}`

    let mensagem = ''

    if (tipo === 'aprovacao') {
      mensagem =
        `Ola ${nomeResp}! 👋\n\n` +
        `A pre-matricula de *${nomeAtleta}* foi *APROVADA*! ✅\n\n` +
        `Seu filho(a) ja esta matriculado(a) na *${nomeEscola}*.\n\n` +
        `Acesse o link abaixo para acompanhar presenca e mensalidades:\n` +
        `${linkPais}\n\n` +
        `Bem-vindo(a) a familia TLFA! ⚽\n` +
        `_${nomeEscola} - ${cidadeEstado}_`
    } else {
      mensagem =
        `Ola ${nomeResp},\n\n` +
        `Informamos que a pre-matricula de *${nomeAtleta}* nao foi aprovada no momento.\n\n` +
        `Entre em contato conosco para mais informacoes:\n` +
        (whatsappEscola ? `WhatsApp: ${whatsappEscola}\n\n` : '\n') +
        `_${nomeEscola} - ${cidadeEstado}_`
    }

    await enviarWhatsApp(whatsapp, mensagem, escolaId)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('Erro WhatsApp aprovacao:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
