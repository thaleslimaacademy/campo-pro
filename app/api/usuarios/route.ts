import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function getPerfil(userId: string) {
  const { data } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('escolaId, perfil')
    .eq('clerkUserId', userId)
    .single()
  return data
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const perfil = await getPerfil(userId)
  if (!perfil?.escolaId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (perfil.perfil !== 'admin' && perfil.perfil !== 'superadmin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('*')
    .eq('escolaId', perfil.escolaId)
    .order('nome')

  return NextResponse.json({ usuarios: data ?? [] })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const perfil = await getPerfil(userId)
  if (!perfil?.escolaId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (perfil.perfil !== 'admin' && perfil.perfil !== 'superadmin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { nome, email, perfilNovo } = await req.json()
  if (!nome || !email || !perfilNovo)
    return NextResponse.json({ error: 'Campos obrigatórios' }, { status: 400 })

  const emailLower = email.toLowerCase()
  const { data: existing } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('id')
    .eq('email', emailLower)
    .eq('escolaId', perfil.escolaId)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('PerfilUsuario')
    .insert({ nome, email: emailLower, perfil: perfilNovo, escolaId: perfil.escolaId, ativo: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ usuario: data })
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const perfil = await getPerfil(userId)
  if (!perfil?.escolaId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (perfil.perfil !== 'admin' && perfil.perfil !== 'superadmin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('PerfilUsuario')
    .update(updates)
    .eq('id', id)
    .eq('escolaId', perfil.escolaId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ usuario: data })
}
