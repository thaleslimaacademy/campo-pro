import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { enviarWhatsApp } from '@/lib/whatsapp'

const BUCKET_ORI = 'fotos-originais'

const storage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
).storage

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const evento = body.event
    const pagamento = body.payment

    if (!['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(evento)) {
      return NextResponse.json({ ignorado: true })
    }

    if (!pagamento?.id) return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })

    // Busca a compra pelo asaasId
    const { data: compra } = await supabaseAdmin
      .from('FotoCompra')
      .select('id, fotos, compradorNome, compradorTelefone, linkEnviado')
      .eq('asaasId', pagamento.id)
      .single()

    if (!compra) return NextResponse.json({ ignorado: true })

    // Marca como PAGO
    await supabaseAdmin.from('FotoCompra')
      .update({ status: 'PAGO', pagoEm: new Date().toISOString() })
      .eq('id', compra.id)

    // Só envia uma vez
    if (compra.linkEnviado) return NextResponse.json({ ok: true, msg: 'Link já enviado' })

    // Gera signed URLs para as fotos originais (válidas por 7 dias)
    const { data: fotos } = await supabaseAdmin
      .from('Foto').select('id, urlOriginal').in('id', compra.fotos)

    const links = await Promise.all((fotos || []).map(async (f, i) => {
      const { data } = await storage.from(BUCKET_ORI)
        .createSignedUrl(f.urlOriginal, 60 * 60 * 24 * 7) // 7 dias
      return `📷 Foto ${i + 1}: ${data?.signedUrl || ''}`
    }))

    const primeiroNome = compra.compradorNome.split(' ')[0]
    const msg = [
      `✅ *Pagamento confirmado!*`,
      ``,
      `Olá, *${primeiroNome}*! 🎉`,
      ``,
      `Suas fotos estão prontas. Os links são válidos por *7 dias*:`,
      ``,
      ...links,
      ``,
      `⬇️ Clique em cada link para baixar a foto original sem marca d'água.`,
      ``,
      `_Gestão FC · gestaofc.com.br_`,
    ].join('\n')

    await enviarWhatsApp(compra.compradorTelefone, msg)

    await supabaseAdmin.from('FotoCompra')
      .update({ linkEnviado: true })
      .eq('id', compra.id)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('Webhook fotos:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}