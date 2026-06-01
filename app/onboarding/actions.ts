'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'

export async function criarEscola(
  clerkUserId: string,
  email: string,
  nomeEscola: string,
  cidade: string,
  estado: string,
  telefone: string,
  whatsapp: string,
  responsavel: string
) {
  const slug = nomeEscola.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30) + '-' + Date.now().toString().slice(-4)
  const escolaId = 'escola-' + slug

  const { error: escolaError } = await supabaseAdmin.from('Escola').insert({
    id: escolaId,
    slug,
    nome: nomeEscola,
    cidade,
    estado,
    telefone: telefone || null,
    whatsapp,
    email,
    clerkUserId,
    plano: 'basico',
    ativo: true,
  })

  if (escolaError) return { ok: false, message: escolaError.message }

  const { error: perfilError } = await supabaseAdmin.from('PerfilUsuario').upsert({
    clerkUserId,
    escolaId,
    nome: responsavel,
    email,
    perfil: 'admin',
    ativo: true,
  }, { onConflict: 'clerkUserId' })

  if (perfilError) return { ok: false, message: perfilError.message }

  return { ok: true, escolaId }
}
