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
    .from('Escola').select('id, nome, logoUrl, slug').eq('id', escolaId!).single()

  // Super admin: busca lista de todas as escolas para o switcher
  let todasEscolas: { id: string; nome: string }[] = []
  if (isSuperAdmin) {
    const { data } = await supabaseAdmin.from('Escola').select('id, nome').order('nome')
    todasEscolas = data || []
  }

  return NextResponse.json({
    escolaId,
    isSuperAdmin,
    escola: escola || null,
    todasEscolas,
  })
}
