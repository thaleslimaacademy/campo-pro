import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { atletaId, escolaId, valor, diaVencimento, periodo } = await req.json()
  const qtd = periodo === 'semestral' ? 6 : periodo === 'anual' ? 12 : 1
  const grupoId = qtd > 1 ? crypto.randomUUID() : null
  const agora = new Date()
  const insertions = Array.from({ length: qtd }, (_, i) => {
    const dataVenc = new Date(agora.getFullYear(), agora.getMonth() + i, diaVencimento || 10)
    return {
      id: crypto.randomUUID(), escolaId, atletaId,
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
  return NextResponse.json({ ok: true, geradas: qtd })
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
