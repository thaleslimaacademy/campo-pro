/**
 * Webhook da Meta WhatsApp Business API
 *
 * GET  → Verificação do webhook (Meta manda challenge)
 * POST → Recebe mensagens dos pais e status de entrega
 *
 * Configure no Meta App Dashboard:
 *   URL: https://gestaofc.com.br/api/webhook/meta
 *   Verify Token: valor de META_WEBHOOK_VERIFY
 *   Campos: messages, message_status
 *
 * Env var necessária para o encaminhamento:
 *   ADMIN_WHATSAPP = numero pessoal que recebe as respostas dos pais
 *                    (formato 5534999999999)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { enviarTemplateMeta } from '@/lib/whatsapp-meta'

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
  // Espera o processamento terminar antes de responder — sem isso, a Vercel
  // pode congelar a function assim que a resposta e enviada, cortando o
  // encaminhamento pro admin no meio (testado: mensagem chegava no log, mas
  // o encaminhamento nunca completava). Continua rapido o suficiente pra
  // Meta nao reenviar (um POST no Graph API leva no maximo 1-2s).
  const body = await req.json()
  try {
    await processar(body)
  } catch (err) {
    console.error('Erro webhook Meta:', err)
  }
  return NextResponse.json({ received: true })
}

type MsgMeta = {
  id?: string
  from: string
  type: string
  text?: { body: string }
}
type StatusMeta = { id: string; status: string; recipient_id: string }

function soDigitos(t: string): string {
  return (t || '').replace(/\D/g, '')
}

/**
 * Descobre de quem é o número que respondeu.
 * A Meta manda o numero como 5534999998888; no banco pode estar gravado com
 * mascara, com ou sem DDI. Comparamos so os 8 ultimos digitos, que e a parte
 * que nao muda (evita erro com o 9 extra dos celulares).
 */
async function identificarRemetente(numero: string) {
  const digitos = soDigitos(numero)
  const final = digitos.slice(-8)
  if (!final) return null

  const { data } = await supabaseAdmin
    .from('Responsavel')
    .select('nome, whatsapp, telefone, atletaId')
    .limit(500)

  const achado = (data || []).find(r =>
    soDigitos(r.whatsapp || '').slice(-8) === final ||
    soDigitos(r.telefone || '').slice(-8) === final
  )
  if (!achado) return null

  const { data: atleta } = await supabaseAdmin
    .from('Atleta')
    .select('nome')
    .eq('id', achado.atletaId)
    .single()

  return {
    nomeResponsavel: (achado.nome || '').trim() || 'Responsável',
    nomeAtleta: (atleta?.nome || '').trim() || 'atleta não identificado',
  }
}

/**
 * Encaminha a resposta do pai para o WhatsApp pessoal do admin.
 * O numero da Meta nao pode ser usado no celular, entao sem isso as respostas
 * ficariam invisiveis.
 */
async function encaminharParaAdmin(msg: MsgMeta) {
  const destino = soDigitos(process.env.ADMIN_WHATSAPP || '')
  if (!destino) {
    console.warn('⚠️ ADMIN_WHATSAPP não configurado — resposta não encaminhada')
    return
  }

  // nao encaminha o que o proprio admin mandou (evita eco)
  if (soDigitos(msg.from).slice(-8) === destino.slice(-8)) return

  // Parametro de template da Meta nao aceita quebra de linha/tab nem mais de
  // 4 espacos seguidos (erro 132018) — colapsa tudo em espaco simples, tanto
  // no texto do pai (que pode vir com quebras de linha) quanto no separador
  // que a gente adiciona.
  const texto = msg.text?.body?.trim().replace(/\s+/g, ' ')
  const previaTexto = texto
    ? texto.slice(0, 450)
    : `[mensagem do tipo ${msg.type} — abra o WhatsApp Manager para ver]`
  // Sem o numero, a notificacao avisa mas nao da pra responder — o link
  // wa.me abre o chat com o responsavel direto no WhatsApp pessoal do admin.
  const linkResponder = `https://wa.me/${soDigitos(msg.from)}`
  const conteudo = `${previaTexto} — Responder: ${linkResponder}`

  const quem = await identificarRemetente(msg.from)
  const nomeResp  = quem?.nomeResponsavel || `Número ${msg.from.slice(-4)}`
  const nomeAtleta = quem?.nomeAtleta || 'não identificado'

  try {
    await enviarTemplateMeta({
      to: destino,
      template: 'resposta_pai',
      params: [nomeResp, nomeAtleta, conteudo],
    })
    console.log('📤 Resposta encaminhada ao admin:', nomeResp)
  } catch (err) {
    console.error('❌ Falha ao encaminhar resposta:', (err as Error).message)
  }
}

async function processar(body: Record<string, unknown>) {
  try {
    const entry = (body.entry as {
      changes: { value: { messages?: MsgMeta[]; statuses?: StatusMeta[] } }[]
    }[])?.[0]
    const changes = entry?.changes?.[0]?.value
    if (!changes) return

    // ── Mensagens recebidas (o pai respondeu) ──
    if (changes.messages) {
      for (const msg of changes.messages) {
        console.log('📨 Mensagem de', msg.from, ':', msg.text?.body || msg.type)
        await encaminharParaAdmin(msg)
      }
    }

    // ── Status de entrega (enviado, lido, falhou) ──
    if (changes.statuses) {
      for (const status of changes.statuses) {
        console.log('📊 Status Meta:', status.status, '->', status.recipient_id.slice(-4))

        if (status.status === 'failed') {
          // O query builder do Supabase tem .then() mas NAO tem .catch():
          // usar .catch() aqui derrubava o webhook inteiro com TypeError.
          const { error } = await supabaseAdmin
            .from('Cobranca')
            .update({ metaStatus: 'FALHA' })
            .eq('metaMessageId', status.id)
          if (error) console.warn('Nao foi possivel marcar falha de envio:', error.message)
        }
      }
    }
  } catch (err) {
    console.error('Erro processar Meta webhook:', err)
  }
}
