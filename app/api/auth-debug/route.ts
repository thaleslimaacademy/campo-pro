import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { userId } = await auth()
  const { data } = userId ? await supabaseAdmin
    .from('PerfilUsuario').select('*').eq('clerkUserId', userId).maybeSingle() : { data: null }
  return NextResponse.json({ userId, perfil: data })
}
