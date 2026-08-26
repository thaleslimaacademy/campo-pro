import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requirePapel } from '@/lib/auth'
// Z-API foi desativado (26 ago) — este fluxo mandava WhatsApp por ele.
// Sem template proprio, enviarTextoMeta so alcanca quem ja escreveu pro
// numero nas ultimas 24h (janela de conversa da Meta).
import { enviarTextoMeta } from '@/lib/whatsapp-meta'

export async function POST(req: NextRequest) {
  try {
    const sessao = await requirePapel(['admin', 'professor'])
    const { atletaId, email, relacao, telefone } = await req.json()

    if (!atletaId || !email || !relacao || !telefone) {
      return NextResponse.json(
        { erro: 'Campos obrigatórios: atletaId, email, relacao, telefone' },
        { status: 400 }
      )
    }

    // Verifica se atleta pertence à escola
    const { data: atleta } = await supabaseAdmin
      .from('Atleta')
      .select('id, nome')
      .eq('id', atletaId)
      .eq('escolaId', sessao.escolaId)
      .single()

    if (!atleta) {
      return NextResponse.json({ erro: 'Atleta não encontrado' }, { status: 404 })
    }

    // Cancela convites pendentes anteriores para o mesmo email + atleta
    await supabaseAdmin
      .from('ConviteResponsavel')
      .update({ status: 'cancelado' })
      .eq('escolaId', sessao.escolaId)
      .eq('atletaId', atletaId)
      .eq('email', email)
      .eq('status', 'pendente')

    // Cria novo convite (token gerado pelo DEFAULT do banco)
    const { data: convite, error } = await supabaseAdmin
      .from('ConviteResponsavel')
      .insert({
        escolaId: sessao.escolaId,
        atletaId,
        email,
        relacao,
      })
      .select('id, token, expiradoEm')
      .single()

    if (error || !convite) {
      console.error('Erro ao criar convite:', error)
      return NextResponse.json({ erro: 'Erro ao criar convite' }, { status: 500 })
    }

    const linkConvite = `${process.env.NEXT_PUBLIC_APP_URL}/convite/${convite.token}`

    // Monta mensagem WhatsApp
    const mensagem = `Olá! Você foi convidado para acompanhar o desempenho de *${atleta.nome}* na academia.

Acesse o link abaixo para criar sua conta e ter acesso à área dos responsáveis:

${linkConvite}

⏳ O link expira em *7 dias*.

_GestãoFC_`

    // Envia WhatsApp
    let whatsappEnviado = false
    let whatsappErro = null

    try {
      await enviarTextoMeta(telefone, mensagem)
      whatsappEnviado = true
    } catch (err: any) {
      console.error('Erro WhatsApp convite:', err.message)
      whatsappErro = err.message
    }

    return NextResponse.json({
      sucesso: true,
      conviteId: convite.id,
      link: linkConvite,
      expiradoEm: convite.expiradoEm,
      atleta: atleta.nome,
      whatsapp: {
        enviado: whatsappEnviado,
        erro: whatsappErro,
      },
    })
  } catch (err: any) {
    if (err.message === 'NAO_AUTENTICADO') {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
    }
    if (err.message === 'SEM_PERMISSAO') {
      return NextResponse.json({ erro: 'Sem permissão' }, { status: 403 })
    }
    console.error('Erro interno:', err)
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
