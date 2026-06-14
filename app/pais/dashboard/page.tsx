import { redirect } from 'next/navigation'
import { requirePapel, getAtletasDoResponsavel } from '@/lib/auth'
import PaisDashboardClient from './PaisDashboardClient'

export default async function PaisDashboardPage() {
  let sessao
  try {
    sessao = await requirePapel('responsavel')
  } catch {
    redirect('/sign-in')
  }

  const atletas = await getAtletasDoResponsavel(sessao.clerkUserId, sessao.escolaId)

  if (atletas.length === 0) {
    redirect('/pais/sem-vinculo')
  }

  return <PaisDashboardClient atletas={atletas as any} />
}
