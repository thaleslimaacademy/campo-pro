import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { msgMatriculaAprovada, msgMatriculaRecusada } from '@/lib/whatsapp-templates'
import { sessaoFinanceiroApi } from '@/lib/apiAuth'

export async function POST(req: NextRequest) {
  try {
    // Antes era publica: qualquer pessoa disparava template da Meta para
    // qualquer numero (custo e risco de bloqueio do numero). Agora exige
    // admin/diretor logado e usa a escola da sessao.
    const sessao = await sessaoFinanceiroApi()
    if (sessao instanceof NextResponse) return sessao
    const escolaId = sessao.escolaId
    const { whatsapp, nomeResponsavel, nomeAtleta, tokenPais, tipo } = await req.json()
    if (!whatsapp) return NextResponse.json({ error: 'whatsapp obrigatorio' }, { status: 400 })

    // Busca dados da escola para personalizar a mensagem
    const { data: escola } = await supabaseAdmin
      .from('Escola')
      .select('nome, whatsapp, cidade, estado')
      .eq('id', escolaId)
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
