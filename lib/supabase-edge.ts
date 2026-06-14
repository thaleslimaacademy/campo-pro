import { createClient } from '@supabase/supabase-js'

// Cliente leve para Edge Runtime (middleware)
// Nao usa node-fetch — compativel com Vercel Edge
export function createSupabaseEdge() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
