'use client'
import { useEffect, useState } from 'react'
import { usePerfil } from '@/lib/usePerfil'
import { supabase } from '@/lib/supabase'
import { T, INTER } from '@/lib/theme'
import PageHeader from '@/components/ui/PageHeader'
import Stats from '@/components/ui/Stats'
import SearchBar from '@/components/ui/SearchBar'
import ListRow from '@/components/ui/ListRow'

type Atleta = {
  id: string
  nome: string
  posicao: string | null
  fotoUrl: string | null
  bolsista: boolean | null
  dataNascimento: string | null
  turmaId: string | null
}

export default function Atletas() {
  const { escolaId } = usePerfil()
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [turmas, setTurmas] = useState<Map<string, string>>(new Map())
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!escolaId) return
    Promise.all([
      supabase
        .from('Atleta')
        .select('id, nome, posicao, fotoUrl, bolsista, dataNascimento, turmaId')
        .eq('escolaId', escolaId)
        .eq('ativo', true)
        .order('nome'),
      supabase.from('Turma').select('id, nome').eq('escolaId', escolaId),
    ]).then(([a, t]) => {
      setAtletas((a.data as Atleta[]) || [])
      const lista = (t.data as { id: string; nome: string }[]) || []
      setTurmas(new Map(lista.map(x => [x.id, x.nome])))
      setLoading(false)
    })
  }, [escolaId])

  const filtrados = atletas.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))

  const anoNasc = (d: string | null) => (d ? new Date(d).getFullYear() : null)
  const subtitle = (a: Atleta) =>
    [a.posicao, anoNasc(a.dataNascimento), a.turmaId ? turmas.get(a.turmaId) : null]
      .filter(Boolean)
      .join(' · ')

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: INTER, paddingBottom: 90 }}>
      <PageHeader eyebrow="Elenco" title="Atletas" count={atletas.length} actionLabel="Novo" actionHref="/atletas/novo" />

      <Stats
        items={[
          { value: atletas.length, label: 'Total', color: T.accent },
          { value: atletas.filter(a => !a.bolsista).length, label: 'Pagantes', color: T.green },
          { value: atletas.filter(a => a.bolsista).length, label: 'Bolsistas', color: T.sky },
        ]}
      />

      <SearchBar value={busca} onChange={setBusca} placeholder="Buscar atleta, posição..." />

      <div style={{ padding: '8px 18px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <p style={{ color: T.muted, textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Carregando...</p>}
        {!loading && filtrados.length === 0 && (
          <p style={{ color: T.muted, textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Nenhum atleta encontrado.</p>
        )}
        {filtrados.map(a => (
          <ListRow
            key={a.id}
            href={`/atletas/${a.id}`}
            fotoUrl={a.fotoUrl}
            initials={a.nome.slice(0, 2).toUpperCase()}
            title={a.nome}
            subtitle={subtitle(a) || 'Sem posição'}
            badge={a.bolsista ? 'Bolsista' : undefined}
            badgeColor={T.green}
          />
        ))}
      </div>
    </div>
  )
}
