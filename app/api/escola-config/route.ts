import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin
    .from('Escola').select('asaasApiKey').eq('id', escolaId).single()
  return NextResponse.json({ temAsaas: !!data?.asaasApiKey, escolaId })
}
