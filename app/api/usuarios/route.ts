import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const escolaId = 'escola-demo'

async function checkAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('perfil')
    .eq('clerkUserId', userId)
    .single()
  return data?.perfil === 'admin' || data?.perfil === 'superadmin'
}

export async function GET() {
  const { userId } = await auth()
  if (!userId || !(await checkAdmin(userId)))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('*')
    .eq('escolaId', escolaId)
    .order('nome')

  return NextResponse.json({ usuarios: data ?? [] })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId || !(await checkAdmin(userId)))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { nome, email, perfil } = await req.json()
  if (!nome || !email || !perfil)
    return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })

  const emailLower = email.toLowerCase()

  const { data: existing } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('id')
    .eq('email', emailLower)
    .eq('escolaId', escolaId)
    .maybeSingle()

  if (existing)
    return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('PerfilUsuario')
    .insert({ nome, email: emailLower, perfil, escolaId, ativo: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ usuario: data })
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId || !(await checkAdmin(userId)))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('PerfilUsuario')
    .update(updates)
    .eq('id', id)
    .eq('escolaId', escolaId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ usuario: data })
}
