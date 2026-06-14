import { redirect } from 'next/navigation'
import { use } from 'react'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

interface Props {
  params: Promise<{ token: string }>
}

export default function AceitarConvitePage({ params }: Props) {
  const { token } = use(params)
  return <AceitarConviteLoader token={token} />
}

async function AceitarConviteLoader({ token }: { token: string }) {
  const { userId } = await auth()

  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent(`/convite/${token}/aceitar`)}`)
  }

  const { data: convite } = await supabaseAdmin
    .from('ConviteResponsavel')
    .select('id, escolaId, atletaId, relacao, status, expiradoEm')
    .eq('token', token)
    .single()

  if (!convite || convite.status !== 'pendente' || new Date(convite.expiradoEm) < new Date()) {
    redirect('/convite/invalido')
  }

  await supabaseAdmin
    .from('PerfilUsuario')
    .upsert(
      {
        escolaId: convite.escolaId,
        clerkUserId: userId,
        perfil: 'responsavel',
        ativo: true,
      },
      { onConflict: 'escolaId,clerkUserId' }
    )

  await supabaseAdmin
    .from('ResponsavelAtleta')
    .upsert(
      {
        escolaId: convite.escolaId,
        clerkUserId: userId,
        atletaId: convite.atletaId,
        relacao: convite.relacao,
        status: 'ativo',
        principal: true,
      },
      { onConflict: 'escolaId,clerkUserId,atletaId' }
    )

  await supabaseAdmin
    .from('ConviteResponsavel')
    .update({ status: 'aceito' })
    .eq('id', convite.id)

  redirect('/pais/dashboard')
}
