import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { enviarWhatsApp } from '@/lib/whatsapp'

// PATCH - marcar como pago manualmente
export async function PATCH(req: NextRequest) {
  const { cobrancaId } = await req.json()
  if (!cobrancaId) return NextResponse.json({ error: 'cobrancaId obrigatorio' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('Cobranca')
    .update({ status: 'PAGO', pagoEm: new Date().toISOString() })
    .eq('id', cobrancaId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// POST - reenviar cobrança no WhatsApp
export async function POST(req: NextRequest) {
  const { cobrancaId, atletaId, escolaId } = await req.json()
  if (!cobrancaId || !atletaId) return NextResponse.json({ error: 'campos obrigatorios' }, { status: 400 })

  const { data: cobranca } = await supabaseAdmin
    .from('Cobranca')
    .select('valor, vencimento, descricao, pixCopiaCola')
    .eq('id', cobrancaId)
    .single()

  if (!cobranca) return NextResponse.json({ error: 'Cobranca nao encontrada' }, { status: 404 })

  const { data: atleta } = await supabaseAdmin
    .from('Atleta')
    .select('nome')
    .eq('id', atletaId)
    .single()

  const { data: responsaveis } = await supabaseAdmin
    .from('Responsavel')
    .select('nome, whatsapp')
    .eq('atletaId', atletaId)
    .eq('principal', true)
    .limit(1)

  const responsavel = responsaveis?.[0]
  if (!responsavel?.whatsapp) return NextResponse.json({ error: 'Responsavel sem WhatsApp' }, { status: 400 })

  const dataVenc = new Date(cobranca.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
  const nomeResp = responsavel.nome.split(' ')[0]
  const linkPag = `https://gestaofc.com.br/pagar/${cobrancaId}`

  const mensagem = `Ola ${nomeResp}! 👋\n\nLembrete de cobranca de *${atleta?.nome}*.\n\n💰 *Valor:* R$ ${Number(cobranca.valor).toFixed(2)}\n📅 *Vencimento:* ${dataVenc}\n📝 ${cobranca.descricao || 'Mensalidade'}\n\nPague pelo link:\n👉 ${linkPag}\n\n_Thales Lima Football Academy_ ⚽`

  await enviarWhatsApp(responsavel.whatsapp, mensagem, escolaId)
  return NextResponse.json({ ok: true })
}
