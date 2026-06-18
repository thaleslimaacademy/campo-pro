import { supabaseAdmin } from '@/lib/supabase'

const FALLBACK_KEY = process.env.ASAAS_API_KEY ?? ''

export async function getAsaasKey(escolaId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('Escola')
    .select('asaasApiKey')
    .eq('id', escolaId)
    .single()
  return data?.asaasApiKey || FALLBACK_KEY
}
