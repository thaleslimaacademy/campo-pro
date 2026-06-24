import { NextRequest, NextResponse } from 'next/server'

// Proxy server-side para verificar chave Asaas sem CORS
export async function POST(req: NextRequest) {
  try {
    const { chave } = await req.json()
    if (!chave?.trim()) return NextResponse.json({ ok: false, erro: 'Chave não informada' }, { status: 400 })

    const res = await fetch('https://api.asaas.com/v3/customers?limit=1', {
      headers: { access_token: chave.trim(), 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
    })

    if (res.ok) return NextResponse.json({ ok: true })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ ok: false, erro: data?.errors?.[0]?.description || 'Chave inválida' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ ok: false, erro: 'Erro de conexão com Asaas' }, { status: 500 })
  }
}
