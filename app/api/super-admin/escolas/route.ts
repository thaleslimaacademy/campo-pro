import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

// IDs de usuários com acesso super-admin (seu clerkUserId)
const SUPER_ADMINS = [
  'user_3EXUg6OJIqPWv0lmQFxafYkeHGR', // Thales Cruz — super admin
]

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verifica se é super admin pelo userId OU pelo perfil no banco
  const { data: perfil } = await supabaseAdmin
    .from('PerfilUsuario')
    .select('perfil')
    .eq('clerkUserId', userId)
    .single()

  const isSuperAdmin = perfil?.perfil === 'superadmin' || SUPER_ADMINS.includes(userId)
  if (!isSuperAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: escolas } = await supabaseAdmin
    .from('Escola')
    .select('id, nome, slug, cidade, estado, planoGestaoFC, statusPlano, trialEndsAt, ativo, email, whatsapp, createdAt')
    .order('createdAt', { ascending: false })

  if (!escolas) return NextResponse.json([])

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()
  const fimMes   = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString()

  const stats = await Promise.all(escolas.map(async (e) => {
    const [atletasRes, cobrancasRes, adminsRes] = await Promise.all([
      supabaseAdmin.from('Atleta').select('*', { count:'exact', head:true }).eq('escolaId', e.id).eq('ativo', true),
      supabaseAdmin.from('Cobranca').select('valor, status').eq('escolaId', e.id).gte('vencimento', inicioMes).lte('vencimento', fimMes),
      supabaseAdmin.from('PerfilUsuario').select('email, perfil').eq('escolaId', e.id).eq('perfil', 'admin').limit(1),
    ])
    const trialAtivo  = e.trialEndsAt ? new Date(e.trialEndsAt) > agora : false
    const diasTrial   = e.trialEndsAt && trialAtivo ? Math.ceil((new Date(e.trialEndsAt).getTime() - agora.getTime()) / 86400000) : 0
    const receitaMes  = cobrancasRes.data?.filter(c => c.status === 'PAGO').reduce((s, c) => s + Number(c.valor), 0) || 0
    return {
      ...e,
      totalAtletas:  atletasRes.count || 0,
      receitaMes,
      totalCobrancas: cobrancasRes.data?.length || 0,
      trialAtivo,
      diasTrial,
      adminEmail: adminsRes.data?.[0]?.email || null,
    }
  }))

  return NextResponse.json(stats)
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: perfil } = await supabaseAdmin.from('PerfilUsuario').select('perfil').eq('clerkUserId', userId).single()
  if (perfil?.perfil !== 'superadmin' && !SUPER_ADMINS.includes(userId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { escolaId, plano, trialDias } = await req.json()
  const update: Record<string, unknown> = {}
  if (plano) { update.planoGestaoFC = plano; update.maxModalidades = plano === 'ELITE' ? 99 : plano === 'PRO' ? 3 : 1; update.statusPlano = 'ATIVO'; update.trialEndsAt = null }
  if (trialDias) { update.trialEndsAt = new Date(Date.now() + trialDias * 86400000).toISOString() }
  await supabaseAdmin.from('Escola').update(update).eq('id', escolaId)
  return NextResponse.json({ ok: true })
}
