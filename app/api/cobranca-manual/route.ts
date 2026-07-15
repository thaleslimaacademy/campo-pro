import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { atletaId, escolaId, valor, diaVencimento, periodo, forcar } = await req.json()

  // Atleta.whatsappResponsavel e Atleta.nomeResponsavel NAO existem no schema.
  // O select antigo pedia essas colunas, dava erro, atleta virava null — e por
  // isso o WhatsApp nunca era enviado e a cobranca nascia sem atletaNome.
  // O responsavel mora na tabela Responsavel.
  const [atletaRes, escolaRes, respRes] = await Promise.all([
    supabaseAdmin.from('Atleta').select('nome').eq('id', atletaId).single(),
    supabaseAdmin.from('Escola').select('nome').eq('id', escolaId).single(),
    supabaseAdmin.from('Responsavel').select('nome, whatsapp, telefone').eq('atletaId', atletaId).eq('principal', true).limit(1),
  ])
  const atleta     = atletaRes.data
  const resp       = respRes.data?.[0] || null
  const respWhats  = resp?.whatsapp || resp?.telefone || null
  const escolaNome = escolaRes.data?.nome?.split('—').pop()?.trim() || escolaRes.data?.nome || 'Escolinha'

  const qtd     = periodo === 'semestral' ? 6 : periodo === 'anual' ? 12 : 1
  const grupoId = qtd > 1 ? crypto.randomUUID() : null
  const agora   = new Date()

  // ── TRAVA DE DUPLICATA: pula meses que ja tem mensalidade ativa ──
  const { data: jaAtivas } = await supabaseAdmin.from('Cobranca')
    .select('competencia, descricao')
    .eq('atletaId', atletaId)
    .is('excluidaEm', null)
    .in('status', ['PENDENTE', 'VENCIDO', 'PAGO'])
  const jaTem = new Set(
    (jaAtivas || [])
      .filter(c => c.competencia && String(c.descricao || '').trim().toLowerCase().startsWith('mensalidade'))
      .map(c => String(c.competencia).slice(0, 10))
  )

  const insertions = []
  const pulados: string[] = []
  for (let i = 0; i < qtd; i++) {
    const dataVenc = new Date(agora.getFullYear(), agora.getMonth() + i, diaVencimento || 10)
    const venc = dataVenc.toISOString().split('T')[0]
    const competencia = venc.slice(0, 7) + '-01'
    if (!forcar && jaTem.has(competencia)) { pulados.push(competencia.slice(0, 7)); continue }
    insertions.push({
      id: crypto.randomUUID(), escolaId, atletaId,
      atletaNome: atleta?.nome?.trim() || null,
      valor: Number(valor),
      vencimento: venc, competencia,
      status: 'PENDENTE',
      descricao: `Mensalidade${qtd > 1 ? ` (${i + 1}/${qtd})` : ''}`,
      periodo, qtdParcelas: qtd, parcelaAtual: i + 1,
      grupoCobrancaId: grupoId, tipo: 'MANUAL',
    })
  }

  if (!insertions.length) {
    return NextResponse.json({
      error: `Este atleta ja tem mensalidade ativa em ${pulados.join(', ')}. Nada foi gerado.`,
      jaExiste: true,
    }, { status: 409 })
  }

  const { error } = await supabaseAdmin.from('Cobranca').insert(insertions)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Dispara WhatsApp pro responsável (se tiver número)
  if (respWhats) {
    const primeiraData  = new Date(agora.getFullYear(), agora.getMonth(), diaVencimento || 10)
    const dataFormatada = primeiraData.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
    const saudacao      = resp?.nome ? `, ${resp.nome.split(' ')[0]}` : ''
    const nomeAtleta    = atleta?.nome?.trim() || 'seu atleta'
    const mensagem = insertions.length > 1
      ? `Olá${saudacao}!💰\n\nFoi gerada a cobrança da mensalidade de *${nomeAtleta}* na *${escolaNome}*.\n\n📋 ${insertions.length} parcelas de R$ ${Number(valor).toFixed(2)}\n📅 Primeiro vencimento: ${dataFormatada}\n\nEm caso de dúvidas, fale com a secretaria. ⚽`
      : `Olá${saudacao}!💰\n\nFoi gerada a cobrança da mensalidade de *${nomeAtleta}* na *${escolaNome}*.\n\n💵 Valor: R$ ${Number(valor).toFixed(2)}\n📅 Vencimento: ${dataFormatada}\n\nEm caso de dúvidas, fale com a secretaria. ⚽`

    await enviarWhatsApp(respWhats, mensagem, escolaId)
  }

  return NextResponse.json({ ok: true, geradas: insertions.length, puladas: pulados, whatsappEnviado: !!respWhats })
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
