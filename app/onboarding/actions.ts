'use server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function criarEscola(
  nomeEscola: string,
  cidade: string,
  estado: string,
  telefone: string,
  whatsapp: string,
  responsavel: string,
  plano: string = 'PRO'
) {
  const { userId } = await auth()
  if (!userId) return { ok: false, message: 'Não autenticado' }

  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId)
  const email = clerkUser.emailAddresses[0]?.emailAddress || ''

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
    clerkUserId: userId,
    plano,
    ativo: true,
  })
  if (escolaError) return { ok: false, message: escolaError.message }

  const { error: perfilError } = await supabaseAdmin.from('PerfilUsuario').upsert({
    clerkUserId: userId,
    escolaId,
    nome: responsavel,
    email,
    perfil: 'admin',
    ativo: true,
  }, { onConflict: 'clerkUserId' })
  if (perfilError) return { ok: false, message: perfilError.message }

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: { escolaId, role: 'admin' }
  })

  return { ok: true, escolaId }
}
