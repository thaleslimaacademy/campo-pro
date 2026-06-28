import { notFound } from 'next/navigation'
import MatriculaClient from './MatriculaClient'
import { supabaseAdmin } from '@/lib/supabase'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function MatriculaSlugPage({ params }: Props) {
  const { slug } = await params

  const { data: escola } = await supabaseAdmin
    .from('Escola')
    .select('id, nome, slug, logoUrl, valorMatricula, corPrimaria, corSecundaria')
    .eq('slug', slug)
    .single()

  if (!escola) notFound()

  return (
    <MatriculaClient
      escolaId={escola.id}
      escolaNome={escola.nome}
      escolaLogoUrl={escola.logoUrl}
      valorMatricula={Number(escola.valorMatricula || 0)}
      corPrimaria={escola.corPrimaria || '#0A0E1A'}
      corSecundaria={escola.corSecundaria || '#4169E1'}
    />
  )
}
