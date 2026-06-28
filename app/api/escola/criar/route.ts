import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-clerk-user-id')
    if (!userId) return NextResponse.json({ ok: false, message: 'Não autenticado' }, { status: 401 })

    const clerk = await clerkClient()
    const clerkUser = await clerk.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress || ''

    const { nomeEscola, cidade, estado, telefone, whatsapp, responsavel, plano } = await req.json()

    const slug = nomeEscola.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30) + '-' + Date.now().toString().slice(-4)
    const escolaId = 'escola-' + slug

    const { error: escolaError } = await supabaseAdmin.from('Escola').insert({
      id: escolaId, slug, nome: nomeEscola, cidade, estado,
      telefone: telefone || null, whatsapp, email,
      clerkUserId: userId, plano, ativo: true,
      planoGestaoFC: 'STARTER',
      maxModalidades: 1,
      trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    })
    if (escolaError) return NextResponse.json({ ok: false, message: escolaError.message })

    const { error: perfilError } = await supabaseAdmin.from('PerfilUsuario').upsert({
      clerkUserId: userId, escolaId, nome: responsavel,
      email, perfil: 'admin', ativo: true,
    }, { onConflict: 'clerkUserId' })
    if (perfilError) return NextResponse.json({ ok: false, message: perfilError.message })

    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { escolaId, role: 'admin' }
    })

    return NextResponse.json({ ok: true, escolaId })
  } catch (e) {
    console.error('Erro criar escola:', e)
    return NextResponse.json({ ok: false, message: String(e) })
  }
}
