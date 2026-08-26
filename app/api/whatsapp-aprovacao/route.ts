import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { msgMatriculaAprovada, msgMatriculaRecusada } from '@/lib/whatsapp-templates'

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
      : undefined

    const nomeResp = (nomeResponsavel || '').split(' ')[0]
    const linkPais = `https://gestaofc.com.br/pais/${tokenPais}`

    if (tipo === 'aprovacao') {
      await msgMatriculaAprovada({
        telefone: whatsapp,
        nomeResp,
        nomeAtleta,
        nomeEscola: nomeEscola || 'nossa academia',
        cidadeEstado,
        linkPais,
        escolaId,
      })
    } else {
      await msgMatriculaRecusada({
        telefone: whatsapp,
        nomeResp,
        nomeAtleta,
        nomeEscola: nomeEscola || 'nossa academia',
        cidadeEstado,
        contato: whatsappEscola,
        escolaId,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('Erro WhatsApp aprovacao:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
