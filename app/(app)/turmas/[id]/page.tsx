'use client'
import { usePerfil } from '@/lib/usePerfil'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Atleta = {
  id: string
  nome: string
  posicao: string | null
  fotoUrl: string | null
  turmaId: string | null
  dataNascimento: string | null
}

type Turma = {
  id: string
  nome: string
  descricao: string | null
  diasSemana: string | null
  horario: string | null
  ativa: boolean
}

export default function TurmaDetalhes() {
  const { escolaId } = usePerfil()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [turma, setTurma] = useState<Turma | null>(null)
  const [atletasTurma, setAtletasTurma] = useState<Atleta[]>([])
  const [atletasSemTurma, setAtletasSemTurma] = useState<Atleta[]>([])
  const [loading, setLoading] = useState(true)
  const [adicionando, setAdicionando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [formEdit, setFormEdit] = useState({ nome: '', diasSemana: '', horario: '', descricao: '' })

  const syne = 'Syne, sans-serif'
  const blue = '#4169E1'
  const cyan = '#00BFFF'
  const skyBlue = '#7DD3FC'
  const offWhite = '#F0F4FF'
  const navy = '#0A0E1A'
  const cardBg = 'rgba(65,105,225,0.08)'
  const cardBorder = '1px solid rgba(65,105,225,0.25)'

  const anoNasc = (d: string | null) => {
    if (!d) return null
    return new Date(d.includes('T') ? d : d + 'T12:00:00').getFullYear()
  }

  const iniciais = (nome: string) =>
    nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  async function carregar() {
    setLoading(true)
    const { data: t } = await supabase.from('Turma').select('*').eq('id', id).single()
    if (t) {
      setTurma(t)
      setFormEdit({ nome: t.nome || '', diasSemana: t.diasSemana || '', horario: t.horario || '', descricao: t.descricao || '' })
    }

    const res = await fetch('/api/atleta-turma?turmaId=' + id)
    const vinculos: { atletaId: string }[] = res.ok ? await res.json() : []
    const idsNaTurma = vinculos.map(v => v.atletaId)

    if (idsNaTurma.length > 0) {
      const { data: comTurma } = await supabase
        .from('Atleta')
        .select('id, nome, posicao, fotoUrl, turmaId, dataNascimento')
        .in('id', idsNaTurma)
        .eq('ativo', true)
        .order('nome')
      setAtletasTurma(comTurma || [])
    } else {
      setAtletasTurma([])
    }

    if (escolaId) {
      const { data: todos } = await supabase
        .from('Atleta')
        .select('id, nome, posicao, fotoUrl, turmaId, dataNascimento')
        .eq('escolaId', escolaId)
        .eq('ativo', true)
        .order('nome')
      setAtletasSemTurma((todos || []).filter(a => !idsNaTurma.includes(a.id)))
    }

    setLoading(false)
  }

  useEffect(() => { if (escolaId) carregar() }, [id, escolaId])

  async function adicionarAtleta(atletaId: string) {
    await fetch('/api/atleta-turma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ atletaId, turmaId: id, escolaId }),
    })
    await carregar()
  }

  async function removerAtleta(atletaId: string) {
    await fetch('/api/atleta-turma', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ atletaId, turmaId: id }),
    })
    await carregar()
  }

  async function salvarEdicao() {
    await supabase.from('Turma').update({
      nome: formEdit.nome,
      diasSemana: formEdit.diasSemana,
      horario: formEdit.horario,
      descricao: formEdit.descricao,
    }).eq('id', id)
    setTurma(prev => prev ? { ...prev, ...formEdit } : prev)
    setEditando(false)
  }

  async function excluirTurma() {
    if (!confirm('Excluir esta turma? Os atletas serao desvinculados.')) return
    await fetch('/api/atleta-turma', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turmaId: id, atletaId: '__all__' }),
    })
    await supabase.from('Turma').update({ ativa: false }).eq('id', id)
    router.push('/turmas')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: skyBlue, fontFamily: syne, fontSize: 14 }}>Carregando...</div>
    </div>
  )

  if (!turma) return (
    <div style={{ minHeight: '100vh', background: navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#FF6B6B', fontFamily: syne, fontSize: 14 }}>Turma nao encontrada.</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: navy, paddingBottom: 88, fontFamily: 'Inter, sans-serif', color: offWhite }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1A3FA8 0%, #4169E1 100%)', padding: '16px 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: offWhite, flexShrink: 0 }}
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 18 }} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 20, color: offWhite, textTransform: 'uppercase', letterSpacing: 1 }}>
              {turma.nome}
            </div>
            {turma.diasSemana && (
              <div style={{ fontSize: 12, color: skyBlue, marginTop: 2 }}>
                {turma.diasSemana}{turma.horario ? ' — ' + turma.horario : ''}
              </div>
            )}
          </div>
          <button
            onClick={() => setEditando(true)}
            style={{ background: 'rgba(0,191,255,0.15)', border: '1px solid #00BFFF', borderRadius: 8, padding: '6px 12px', color: cyan, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            <i className="ti ti-pencil" style={{ fontSize: 13, marginRight: 4 }} />
            Editar
          </button>
          <button
            onClick={excluirTurma}
            style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.4)', borderRadius: 8, padding: '6px 12px', color: '#FF6B6B', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Excluir
          </button>
        </div>
        {turma.descricao && (
          <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.7)', marginLeft: 48 }}>{turma.descricao}</div>
        )}
        <div style={{ marginLeft: 48, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-users" style={{ fontSize: 13, color: cyan }} />
          <span style={{ fontSize: 12, color: cyan }}>{atletasTurma.length} atleta{atletasTurma.length !== 1 ? 's' : ''} nesta turma</span>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>

        {/* Atletas na turma */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 12, color: skyBlue, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Atletas na Turma
          </div>
          {atletasTurma.length === 0 ? (
            <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '20px', textAlign: 'center', color: 'rgba(240,244,255,0.4)', fontSize: 13 }}>
              Nenhum atleta adicionado ainda.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {atletasTurma.map(a => (
                <div key={a.id} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(65,105,225,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: cyan, flexShrink: 0, overflow: 'hidden' }}>
                    {a.fotoUrl ? <img src={a.fotoUrl} alt={a.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniciais(a.nome)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: offWhite, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</div>
                    <div style={{ fontSize: 11, color: skyBlue }}>{anoNasc(a.dataNascimento) ?? ''}{a.posicao ? ' · ' + a.posicao : ''}</div>
                  </div>
                  <button
                    onClick={() => removerAtleta(a.id)}
                    style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '5px 10px', color: '#FF6B6B', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Adicionar atletas */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 12, color: skyBlue, textTransform: 'uppercase', letterSpacing: 1 }}>
              Adicionar Atleta
            </div>
            <button
              onClick={() => setAdicionando(!adicionando)}
              style={{ background: adicionando ? 'rgba(255,107,107,0.1)' : 'rgba(0,191,255,0.1)', border: adicionando ? '1px solid rgba(255,107,107,0.4)' : '1px solid rgba(0,191,255,0.4)', borderRadius: 8, padding: '5px 12px', color: adicionando ? '#FF6B6B' : cyan, fontSize: 12, cursor: 'pointer' }}
            >
              {adicionando ? 'Fechar' : 'Abrir lista'}
            </button>
          </div>

          {adicionando && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {atletasSemTurma.length === 0 ? (
                <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '20px', textAlign: 'center', color: 'rgba(240,244,255,0.4)', fontSize: 13 }}>
                  Todos os atletas ja estao nesta turma.
                </div>
              ) : (
                atletasSemTurma.map(a => (
                  <div key={a.id} style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(65,105,225,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: skyBlue, flexShrink: 0, overflow: 'hidden' }}>
                      {a.fotoUrl ? <img src={a.fotoUrl} alt={a.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniciais(a.nome)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: offWhite, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nome}</div>
                      <div style={{ fontSize: 11, color: skyBlue }}>{anoNasc(a.dataNascimento) ?? ''}{a.posicao ? ' · ' + a.posicao : ''}</div>
                    </div>
                    <button
                      onClick={() => adicionarAtleta(a.id)}
                      style={{ background: 'rgba(65,105,225,0.2)', border: '1px solid rgba(65,105,225,0.5)', borderRadius: 8, padding: '5px 12px', color: cyan, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                    >
                      + Adicionar
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Editar */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,26,0.92)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }}>
          <div style={{ width: '100%', background: '#0F1629', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', border: '1px solid rgba(65,105,225,0.3)' }}>
            <div style={{ fontFamily: syne, fontWeight: 700, fontSize: 16, color: offWhite, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>Editar Turma</div>
            {[
              { label: 'Nome', key: 'nome', placeholder: 'Ex: Sub-11' },
              { label: 'Dias da semana', key: 'diasSemana', placeholder: 'Ex: Segunda e Quarta' },
              { label: 'Horario', key: 'horario', placeholder: 'Ex: 19:00 - 20:30' },
              { label: 'Descricao', key: 'descricao', placeholder: 'Opcional' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: skyBlue, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{f.label}</div>
                <input
                  value={formEdit[f.key as keyof typeof formEdit]}
                  onChange={e => setFormEdit(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', background: 'rgba(65,105,225,0.1)', border: '1px solid rgba(65,105,225,0.3)', borderRadius: 10, padding: '10px 14px', color: offWhite, fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditando(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px', color: offWhite, fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={salvarEdicao} style={{ flex: 2, background: blue, border: 'none', borderRadius: 10, padding: '12px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
