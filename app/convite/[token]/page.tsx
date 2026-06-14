import { notFound } from 'next/navigation'
import { use } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import ConviteClient from './ConviteClient'

interface Props {
  params: Promise<{ token: string }>
}

export default function ConvitePage({ params }: Props) {
  const { token } = use(params)
  return <ConviteLoader token={token} />
}

async function ConviteLoader({ token }: { token: string }) {
  const { data: convite } = await supabaseAdmin
    .from('ConviteResponsavel')
    .select('id, status, expiradoEm, relacao, atletaId, Atleta(nome)')
    .eq('token', token)
    .single()

  if (!convite) return notFound()

  const expirado = new Date(convite.expiradoEm) < new Date()
  const invalido = convite.status !== 'pendente' || expirado

  return (
    <ConviteClient
      token={token}
      invalido={invalido}
      status={convite.status}
      expirado={expirado}
      atletaNome={(convite.Atleta as any)?.nome ?? ''}
      relacao={convite.relacao}
    />
  )
}
