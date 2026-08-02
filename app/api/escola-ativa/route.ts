import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

const SUPER_ADMINS = ['user_3EXUg6OJIqPWv0lmQFxafYkeHGR']

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ escolaId: null })

  const isSuperAdmin = SUPER_ADMINS.includes(userId)
  let escolaId: string | null = null

  if (isSuperAdmin) {
    const cookieStore = await cookies()
    const override = cookieStore.get('escola_override')?.value
    if (override) escolaId = override
  }

  if (!escolaId) {
    const { data } = await supabaseAdmin
      .from('PerfilUsuario').select('escolaId').eq('clerkUserId', userId).single()
    escolaId = data?.escolaId || null
  }

  // Busca dados completos da escola ativa
  const { data: escola } = await supabaseAdmin
    .from('Escola').select('id, nome, logoUrl, slug, cidade, estado').eq('id', escolaId!).single()

  // Switcher normal: só escolas vinculadas ao usuário via PerfilUsuario.
  // Acesso irrestrito a todas as escolas fica só no menu Super Admin (/super-admin).
  let todasEscolas: { id: string; nome: string }[] = []
  if (isSuperAdmin) {
    const { data: perfis } = await supabaseAdmin
      .from('PerfilUsuario').select('escolaId').eq('clerkUserId', userId)
    const escolaIds = Array.from(new Set((perfis || []).map(p => p.escolaId).filter(Boolean)))
    if (escolaIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('Escola').select('id, nome').in('id', escolaIds).order('nome')
      todasEscolas = data || []
    }
  }

  return NextResponse.json({
    escolaId,
    isSuperAdmin,
    escola: escola || null,
    todasEscolas,
  })
}
