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

  // ── Tokens visuais ──
  const syne = 'Syne, sans-serif'
  const neon = '#39FF14'
  const gold = '#D4AF37'
  const cardBg = 'rgba(255,255,255,0.03)'
  const cardBorder = '1px solid rgba(255,255,255,0.07)'

  // Extrai ano de nascimento
  const anoNasc = (d: string | null) => {
    if (!d) return null
    return new Date(d.includes('T') ? d : d + 'T12:00:00').getFullYear()
  }

  // Iniciais do atleta
  const iniciais = (nome: string) =>
    nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  // ── Data fetching ──
  async function carregar() {
    const { data: t } = await supabase.from('Turma').select('*').eq('id', id).single()
    if (t) setTurma(t)

    const { data: comTurma } = await supabase
      .from('Atleta')
      .select('id, nome, posicao, fotoUrl, turmaId, dataNascimento')
      .eq('turmaId', id)
      .eq('ativo', true)
      .order('nome')
    setAtletasTurma(comTurma || [])

    const { data: semTurma } = await supabase
      .from('Atleta')
      .select('id, nome, posicao, fotoUrl, turmaId, dataNascimento')
      .eq('escolaId', escolaId!)
      .eq('ativo', true)
      .is('turmaId', null)
      .order('nome')
    setAtletasSemTurma(semTurma || [])

    if (t) setFormEdit({ nome: t.nome || '', diasSemana: t.diasSemana || '', horario: t.horario || '', descricao: t.descricao || '' })
    setLoading(false)
  }

  useEffect(() => { if (escolaId) carregar() }, [id, escolaId])

  async function adicionarAtleta(atletaId: string) {
    await supabase.from('Atleta').update({ turmaId: id }).eq('id', atletaId)
    await carregar()
  }

  async function removerAtleta(atletaId: string) {
    await supabase.from('Atleta').update({ turmaId: null }).eq('id', atletaId)
    await carregar()
  }

  async function salvarEdicao() {
    await supabase.from('Turma').update({ nome: formEdit.nome, diasSemana: formEdit.diasSemana, horario: formEdit.horario, descricao: formEdit.descricao }).eq('id', id)
    setTurma(prev => prev ? { ...prev, ...formEdit } : prev)
    setEditando(false)
  }

  async function excluirTurma() {
    if (!confirm('Excluir esta turma? Os atletas serão desvinculados.')) return
    await supabase.from('Atleta').update({ turmaId: null }).eq('turmaId', id)
    await supabase.from('Turma').update({ ativa: false }).eq('id', id)
    router.push('/turmas')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a1a06,#050505,#111003)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter,sans-serif' }}>Carregando...</p>
    </div>
  )

  if (!turma) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a1a06,#050505,#111003)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Turma não encontrada.</p>
    </div>
  )

  const linkMensagem = '/mensagens/nova?turmaId=' + id + '&turmaNome=' + encodeURIComponent(turma.nome)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a1a06,#050505,#111003)', color: '#F0F0F0', fontFamily: 'Inter,sans-serif', paddingBottom: '96px' }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/turmas" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none' }}>← Voltar</a>
          <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: '22px', color: '#F0F0F0', margin: 0 }}>{turma.nome}</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setEditando(!editando)} style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: gold, padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, fontFamily: syne, cursor: 'pointer' }}>✏️ Editar</button>
          <button onClick={excluirTurma} style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)', color: '#ff5555', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontFamily: syne, cursor: 'pointer' }}>Excluir</button>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* ── INFO DA TURMA ── */}
        <div style={{ background: cardBg, border: '1px solid rgba(57,255,20,0.15)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
          {turma.diasSemana && (
            <p style={{ color: neon, fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>
              📅 {turma.diasSemana}{turma.horario ? ' — ' + turma.horario : ''}
            </p>
          )}
          {turma.descricao && (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '4px 0' }}>{turma.descricao}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: '22px', color: neon }}>{atletasTurma.length}</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>atletas nesta turma</span>
          </div>
        </div>

        {/* ── FORM EDIÇÃO ── */}
        {editando && (
          <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
            <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: gold, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>✏️ Editar Turma</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Nome', key: 'nome', placeholder: 'Ex: Sub-11' },
                { label: 'Dias da semana', key: 'diasSemana', placeholder: 'Ex: Segunda e Quinta' },
                { label: 'Horário', key: 'horario', placeholder: 'Ex: 18:00 - 19:00' },
                { label: 'Descrição', key: 'descricao', placeholder: 'Faixa etária, observações...' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{field.label}</label>
                  <input
                    value={formEdit[field.key as keyof typeof formEdit]}
                    onChange={e => setFormEdit(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', color: '#F0F0F0', fontFamily: 'Inter,sans-serif', fontSize: '13px', marginTop: '4px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={salvarEdicao} style={{ flex: 1, background: 'linear-gradient(135deg,#39FF14,#2bcc0f)', color: '#050505', padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: 'pointer' }}>Salvar</button>
                <button onClick={() => setEditando(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', padding: '11px', borderRadius: '10px', fontSize: '13px', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── CARD ATLETAS ── */}
        <div style={{ background: cardBg, border: cardBorder, borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: neon, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Atletas</p>
            <button onClick={() => setAdicionando(!adicionando)} style={{ background: adicionando ? 'rgba(255,255,255,0.05)' : 'rgba(57,255,20,0.1)', border: adicionando ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(57,255,20,0.3)', color: adicionando ? 'rgba(255,255,255,0.4)' : neon, padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, fontFamily: syne, cursor: 'pointer' }}>
              {adicionando ? 'Fechar' : '+ Adicionar'}
            </button>
          </div>

          {atletasTurma.length === 0 && !adicionando && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nenhum atleta nesta turma</p>
          )}

          {/* Lista atletas na turma */}
          {atletasTurma.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {atletasTurma.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(57,255,20,0.04)', border: '1px solid rgba(57,255,20,0.12)', borderRadius: '12px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {a.fotoUrl ? (
                      <img src={a.fotoUrl} alt={a.nome} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(57,255,20,0.4)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: syne, fontWeight: 800, fontSize: '13px', color: neon, flexShrink: 0 }}>
                        {iniciais(a.nome)}
                      </div>
                    )}
                    <div>
                      <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '13px', color: '#F0F0F0', margin: 0 }}>{a.nome}</p>
                      {anoNasc(a.dataNascimento) && (
                        <p style={{ fontSize: '11px', color: gold, fontWeight: 800, margin: '1px 0 0', fontFamily: syne }}>{anoNasc(a.dataNascimento)}</p>
                      )}
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '1px 0 0' }}>{a.posicao || 'Sem posição'}</p>
                    </div>
                  </div>
                  <button onClick={() => removerAtleta(a.id)} style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)', color: '#ff5555', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>Remover</button>
                </div>
              ))}
            </div>
          )}

          {/* Lista atletas sem turma */}
          {adicionando && atletasSemTurma.length > 0 && (
            <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>Atletas sem turma</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {atletasSemTurma.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {a.fotoUrl ? (
                        <img src={a.fotoUrl} alt={a.nome} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: syne, fontWeight: 800, fontSize: '13px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
                          {iniciais(a.nome)}
                        </div>
                      )}
                      <div>
                        <p style={{ fontFamily: syne, fontWeight: 600, fontSize: '13px', color: '#F0F0F0', margin: 0 }}>{a.nome}</p>
                        {anoNasc(a.dataNascimento) && (
                          <p style={{ fontSize: '11px', color: gold, fontWeight: 800, margin: '1px 0 0', fontFamily: syne }}>{anoNasc(a.dataNascimento)}</p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => adicionarAtleta(a.id)} style={{ background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', color: neon, padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, fontFamily: syne, cursor: 'pointer' }}>+ Adicionar</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adicionando && atletasSemTurma.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textAlign: 'center', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>Todos os atletas já estão em uma turma</p>
          )}
        </div>

        {/* ── BOTÃO MENSAGEM ── */}
        <a
          href={linkMensagem}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', background: 'linear-gradient(135deg,#39FF14,#2bcc0f)', color: '#050505', padding: '15px', borderRadius: '14px', fontWeight: 800, fontSize: '14px', fontFamily: syne, textDecoration: 'none', boxShadow: '0 0 24px rgba(57,255,20,0.25)', boxSizing: 'border-box' }}
        >
          💬 Enviar Mensagem para a Turma
        </a>

      </div>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 0 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(10px)' }}>
        {[
          { href: '/dashboard', label: 'Inicio' },
          { href: '/atletas', label: 'Atletas' },
          { href: '/presenca', label: 'Presença' },
          { href: '/financeiro', label: 'Financeiro' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.4)', fontFamily: syne, fontWeight: 400 }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
