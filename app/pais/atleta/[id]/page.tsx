import { notFound, redirect } from 'next/navigation'
import { use } from 'react'
import { requirePapel } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import FichaAtletaClient from './FichaAtletaClient'

interface Props {
  params: Promise<{ id: string }>
}

export default function FichaAtletaPage({ params }: Props) {
  const { id } = use(params)
  return <FichaAtletaLoader atletaId={id} />
}

async function FichaAtletaLoader({ atletaId }: { atletaId: string }) {
  let sessao
  try {
    sessao = await requirePapel('responsavel')
  } catch {
    redirect('/sign-in')
  }

  // Verifica vínculo
  const { data: vinculo } = await supabaseAdmin
    .from('ResponsavelAtleta')
    .select('relacao')
    .eq('clerkUserId', sessao.clerkUserId)
    .eq('atletaId', atletaId)
    .eq('status', 'ativo')
    .single()

  if (!vinculo) return notFound()

  const mesAtual = new Date().toISOString().slice(0, 7)

  const [atletaRes, presencaRes, mensalidadeRes, avaliacaoRes, convocacaoRes, premiacaoRes] =
    await Promise.all([
      supabaseAdmin
        .from('Atleta')
        .select('id, nome, dataNascimento, foto, posicao, Turma(nome)')
        .eq('id', atletaId)
        .single(),
      supabaseAdmin
        .from('Presenca')
        .select('presente, data')
        .eq('atletaId', atletaId)
        .gte('data', mesAtual + '-01')
        .lte('data', mesAtual + '-31'),
      supabaseAdmin
        .from('Mensalidade')
        .select('mes, valor, status, vencimento')
        .eq('atletaId', atletaId)
        .order('vencimento', { ascending: false })
        .limit(6),
      supabaseAdmin
        .from('AvaliacaoFisica')
        .select('data, peso, altura, imc, gordura, observacoes')
        .eq('atletaId', atletaId)
        .order('data', { ascending: false })
        .limit(3),
      supabaseAdmin
        .from('Convocacao')
        .select('titulo, data, local, tipo')
        .eq('escolaId', sessao.escolaId)
        .gte('data', new Date().toISOString().slice(0, 10))
        .order('data', { ascending: true })
        .limit(5),
      supabaseAdmin
        .from('Premiacao')
        .select('titulo, descricao, icone, dataConquista')
        .eq('atletaId', atletaId)
        .order('dataConquista', { ascending: false }),
    ])

  if (!atletaRes.data) return notFound()

  const presencas = presencaRes.data ?? []
  const totalAulas = presencas.length
  const presentes = presencas.filter((p) => p.presente).length
  const frequencia = totalAulas > 0 ? Math.round((presentes / totalAulas) * 100) : null

  return (
    <FichaAtletaClient
      atleta={atletaRes.data as any}
      relacao={vinculo.relacao}
      frequencia={frequencia}
      totalAulas={totalAulas}
      presentes={presentes}
      mensalidades={mensalidadeRes.data ?? []}
      avaliacoes={avaliacaoRes.data ?? []}
      convocacoes={convocacaoRes.data ?? []}
      premiacoes={premiacaoRes.data ?? []}
    />
  )
}
