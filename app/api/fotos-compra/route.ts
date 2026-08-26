import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Rota publica — sem Clerk. O id da FotoCompra (crypto.randomUUID(), nao
// sequencial) funciona como token, mesmo padrao do /api/pagar.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

  const { data: compra } = await supabaseAdmin
    .from('FotoCompra')
    .select('id, escolaId, compradorNome, fotos, status')
    .eq('id', id)
    .single()

  if (!compra) return NextResponse.json({ error: 'nao encontrada' }, { status: 404 })
  if (compra.status !== 'PAGO') return NextResponse.json({ error: 'pagamento nao confirmado' }, { status: 403 })

  const { data: fotos } = await supabaseAdmin
    .from('Foto').select('id, urlOriginal').in('id', compra.fotos)

  // Signed URLs geradas na hora — validas por 24h a partir de agora, nao a
  // partir da compra. Assim o link do WhatsApp nunca expira antes do pai abrir.
  const links = await Promise.all((fotos || []).map(async (f: { id: string; urlOriginal: string }, i: number) => {
    const { data } = await supabaseAdmin.storage.from('fotos-originais')
      .createSignedUrl(f.urlOriginal, 60 * 60 * 24)
    return { numero: i + 1, url: data?.signedUrl || null }
  }))

  return NextResponse.json({
    compradorNome: compra.compradorNome,
    fotos: links.filter(l => l.url),
  })
}
