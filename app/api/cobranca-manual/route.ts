import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { atletaId, escolaId, valor, diaVencimento, periodo } = await req.json()

  // Busca dados do atleta e da escola para nome + WhatsApp
  const [atletaRes, escolaRes] = await Promise.all([
    supabaseAdmin.from('Atleta').select('nome, whatsappResponsavel, nomeResponsavel').eq('id', atletaId).single(),
    supabaseAdmin.from('Escola').select('nome').eq('id', escolaId).single(),
  ])
  const atleta = atletaRes.data
  const escolaNome = escolaRes.data?.nome?.split('—').pop()?.trim() || escolaRes.data?.nome || 'Escolinha'

  const qtd = periodo === 'semestral' ? 6 : periodo === 'anual' ? 12 : 1
  const grupoId = qtd > 1 ? crypto.randomUUID() : null
  const agora = new Date()
  const insertions = Array.from({ length: qtd }, (_, i) => {
    const dataVenc = new Date(agora.getFullYear(), agora.getMonth() + i, diaVencimento || 10)
    return {
      id: crypto.randomUUID(), escolaId, atletaId,
      atletaNome: atleta?.nome || null,
      valor: Number(valor),
      vencimento: dataVenc.toISOString().split('T')[0],
      status: 'PENDENTE',
      descricao: `Mensalidade${qtd > 1 ? ` (${i + 1}/${qtd})` : ''}`,
      periodo, qtdParcelas: qtd, parcelaAtual: i + 1,
      grupoCobrancaId: grupoId, tipo: 'MANUAL',
    }
  })

  const { error } = await supabaseAdmin.from('Cobranca').insert(insertions)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Dispara WhatsApp pro responsável (se tiver número)
  if (atleta?.whatsappResponsavel) {
    const primeiraData = new Date(agora.getFullYear(), agora.getMonth(), diaVencimento || 10)
    const dataFormatada = primeiraData.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
    const mensagem = qtd > 1
      ? `Olá${atleta.nomeResponsavel ? `, ${atleta.nomeResponsavel.split(' ')[0]}` : ''}! 💰\n\nFoi gerada a cobrança da mensalidade de *${atleta.nome}* na *${escolaNome}*.\n\n📋 ${qtd} parcelas de R$ ${Number(valor).toFixed(2)}\n📅 Primeiro vencimento: ${dataFormatada}\n\nEm caso de dúvidas, fale com a secretaria. ⚽`
      : `Olá${atleta.nomeResponsavel ? `, ${atleta.nomeResponsavel.split(' ')[0]}` : ''}! 💰\n\nFoi gerada a cobrança da mensalidade de *${atleta.nome}* na *${escolaNome}*.\n\n💵 Valor: R$ ${Number(valor).toFixed(2)}\n📅 Vencimento: ${dataFormatada}\n\nEm caso de dúvidas, fale com a secretaria. ⚽`

    await enviarWhatsApp(atleta.whatsappResponsavel, mensagem, escolaId)
  }

  return NextResponse.json({ ok: true, geradas: qtd, whatsappEnviado: !!atleta?.whatsappResponsavel })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { cobrancaId, valorPago, formaPagamento } = await req.json()
  const { error } = await supabaseAdmin.from('Cobranca').update({
    status: 'PAGO', pagoEm: new Date().toISOString(),
    valorPago: valorPago || null, baixaManual: true,
    baixaManualEm: new Date().toISOString(), baixaManualPor: userId,
    tipo: formaPagamento || 'MANUAL',
  }).eq('id', cobrancaId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
