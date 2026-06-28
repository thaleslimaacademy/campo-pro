import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const SUPER_ADMINS = ['user_3EXUg6OJIqPWv0lmQFxafYkeHGR']

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId || !SUPER_ADMINS.includes(userId))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { escolaId } = await req.json()
  const res = NextResponse.json({ ok: true })

  if (escolaId) {
    // Seta o cookie de override (expira em 2h)
    res.cookies.set('escola_override', escolaId, {
      httpOnly: true, secure: true, sameSite: 'lax',
      maxAge: 60 * 60 * 2, path: '/',
    })
  } else {
    // Limpa o cookie (volta pra escola original)
    res.cookies.set('escola_override', '', { maxAge: 0, path: '/' })
  }

  return res
}
