/**
 * Webhook da Meta WhatsApp Business API
 *
 * GET  → Verificação do webhook (Meta manda challenge)
 * POST → Recebe mensagens e status de entrega
 *
 * Configure no Meta App Dashboard:
 *   URL: https://gestaofc.com.br/api/webhook/meta
 *   Verify Token: valor de META_WEBHOOK_VERIFY
 *   Campos: messages, message_status
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET — verificação do webhook pela Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY) {
    console.log('✅ Meta webhook verificado')
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
}

// POST — recebe eventos da Meta
export async function POST(req: NextRequest) {
  // Responde 200 imediatamente (igual ao webhook Asaas)
  const body = await req.json()
  processar(body).catch(err => console.error('Erro webhook Meta:', err))
  return NextResponse.json({ received: true })
}

async function processar(body: Record<string, unknown>) {
  try {
    const entry = (body.entry as {changes: {value: {messages?: {from:string;text?:{body:string};type:string}[]; statuses?: {id:string;status:string;recipient_id:string}[]}}[]}[])?.[0]
    const changes = entry?.changes?.[0]?.value

    if (!changes) return

    // Mensagens recebidas (pai respondeu)
    if (changes.messages) {
      for (const msg of changes.messages) {
        console.log('📨 Mensagem recebida de', msg.from, ':', msg.text?.body || msg.type)
        // Futuramente: resposta automática ou log de conversa
      }
    }

    // Status de entrega (enviado, lido, falhou)
    if (changes.statuses) {
      for (const status of changes.statuses) {
        console.log('📊 Status Meta:', status.status, '->', status.recipient_id.slice(-4))

        // Se falhou, marca no banco para retentar
        if (status.status === 'failed') {
          await supabaseAdmin.from('Cobranca')
            .update({ metaStatus: 'FALHA' })
            .eq('metaMessageId', status.id)
            .catch(() => {}) // ignora se coluna não existe ainda
        }
      }
    }
  } catch (err) {
    console.error('Erro processar Meta webhook:', err)
  }
}
