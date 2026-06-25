'use client'
import { useEffect, useState } from 'react'
import { usePerfil } from '@/lib/usePerfil'
import { supabase } from '@/lib/supabase'
import { T, SYNE, INTER } from '@/lib/theme'
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

      {/* HEADER — padrão presença/financeiro */}
      <div style={{ background: T.primary, padding: '20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Elenco</div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 26, color: T.text, letterSpacing: -0.8, textTransform: 'uppercase' }}>
              Atletas <span style={{ color: T.accent, fontStyle: 'italic' }}>{atletas.length}</span>
            </div>
          </div>
          <a href="/atletas/novo" style={{ background: T.text, color: T.primary, borderRadius: 8, padding: '10px 16px', fontFamily: SYNE, fontWeight: 800, fontSize: 12, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>+ Novo</a>
        </div>
      </div>

      {/* STATS STRIP — padrão presença/financeiro */}
      <div style={{ display: 'flex', background: '#080C15', borderBottom: `1px solid ${T.border}` }}>
        {[
          { label: 'Total', valor: atletas.length, color: T.accent },
          { label: 'Pagantes', valor: atletas.filter(a => !a.bolsista).length, color: T.green },
          { label: 'Bolsistas', valor: atletas.filter(a => a.bolsista).length, color: T.sky },
        ].map((s, i, arr) => (
          <div key={s.label} style={{ flex: 1, padding: '13px 0 11px', textAlign: 'center', borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 900, color: s.color, letterSpacing: -0.5, lineHeight: 1 }}>{s.valor}</div>
            <div style={{ fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

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
