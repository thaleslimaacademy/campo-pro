import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { criarInstanciaEvolution, getQrCode, getStatusInstancia, desconectarInstancia } from '@/lib/whatsapp'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

// GET: status da conexão WhatsApp da escola
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const escolaId = await getEscolaIdServer()
  const { data: escola } = await supabaseAdmin
    .from('Escola')
    .select('evolutionInstance, evolutionStatus, slug')
    .eq('id', escolaId)
    .single()

  if (!escola?.evolutionInstance) {
    return NextResponse.json({ conectado: false, instancia: null, status: 'desconectado' })
  }

  // Verifica status real na Evolution API
  const statusReal = await getStatusInstancia(escola.evolutionInstance)
  const conectado = statusReal === 'open'

  // Atualiza status no banco
  await supabaseAdmin.from('Escola').update({
    evolutionStatus: conectado ? 'conectado' : 'desconectado'
  }).eq('id', escolaId)

  return NextResponse.json({
    conectado,
    instancia: escola.evolutionInstance,
    status: statusReal,
  })
}

// POST: criar instância e retornar QR Code
export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const escolaId = await getEscolaIdServer()
  const { data: escola } = await supabaseAdmin
    .from('Escola')
    .select('evolutionInstance, slug')
    .eq('id', escolaId)
    .single()

  // Usa instância existente ou cria com o slug da escola
  const nomeInstancia = escola?.evolutionInstance || `gestaofc-${escola?.slug || escolaId.slice(-8)}`

  // Cria instância se não existir
  if (!escola?.evolutionInstance) {
    await criarInstanciaEvolution(nomeInstancia)
    await supabaseAdmin.from('Escola').update({
      evolutionInstance: nomeInstancia,
      evolutionStatus: 'aguardando_qr',
    }).eq('id', escolaId)
  }

  // Busca QR Code
  const qr = await getQrCode(nomeInstancia)
  // Evolution API retorna QR em formatos diferentes por versão
  const qrBase64 = qr?.base64 
    || qr?.qrcode?.base64 
    || qr?.qrcode 
    || qr?.code
    || null
  
  // Remove prefixo data:image se já vier com ele
  const qrLimpo = qrBase64?.replace(/^data:image\/[^;]+;base64,/, '') || null

  return NextResponse.json({
    ok: true,
    instancia: nomeInstancia,
    qrCode: qrLimpo,
    qrCodeRaw: qr, // debug
    pairingCode: qr?.pairingCode || null,
  })
}

// DELETE: desconectar WhatsApp
export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const escolaId = await getEscolaIdServer()
  const { data: escola } = await supabaseAdmin
    .from('Escola')
    .select('evolutionInstance')
    .eq('id', escolaId)
    .single()

  if (escola?.evolutionInstance) {
    await desconectarInstancia(escola.evolutionInstance)
    await supabaseAdmin.from('Escola').update({ evolutionStatus: 'desconectado' }).eq('id', escolaId)
  }

  return NextResponse.json({ ok: true })
}
