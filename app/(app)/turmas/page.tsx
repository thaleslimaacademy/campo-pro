'use client'
import { usePerfil } from '@/lib/usePerfil'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Turma = {
  id: string
  nome: string
  descricao: string | null
  diasSemana: string | null
  horario: string | null
  ativa: boolean
  totalAtletas?: number
}

export default function Turmas() {
  const { escolaId } = usePerfil()
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [criando, setCriando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', descricao: '', diasSemana: '', horario: '' })

  const syne = 'Syne, sans-serif'
  const neon = '#39FF14'
  const gold = '#D4AF37'
  const muted = 'rgba(255,255,255,0.4)'
  const card = 'rgba(255,255,255,0.05)'
  const border = '1px solid rgba(255,255,255,0.07)'

  async function carregar() {
    const { data } = await supabase.from('Turma').select('*').eq('escolaId', escolaId!).eq('ativa', true).order('nome')
    if (data) {
      const turmasComTotal = await Promise.all(data.map(async t => {
        const { count } = await supabase.from('Atleta').select('*', { count: 'exact', head: true }).eq('turmaId', t.id).eq('ativo', true)
        return { ...t, totalAtletas: count || 0 }
      }))
      setTurmas(turmasComTotal)
    }
    setLoading(false)
  }

  useEffect(() => { if (escolaId) carregar() }, [escolaId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function salvar() {
    if (!form.nome) return
    setSalvando(true)
    await supabase.from('Turma').insert({
      escolaId: escolaId!, nome: form.nome,
      descricao: form.descricao || null,
      diasSemana: form.diasSemana || null,
      horario: form.horario || null,
    })
    setForm({ nome: '', descricao: '', diasSemana: '', horario: '' })
    setCriando(false)
    await carregar()
    setSalvando(false)
  }

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: '#F0F0F0', fontFamily: 'Inter, sans-serif', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: '10px', color: muted, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', color: '#F0F0F0', fontFamily: 'Inter, sans-serif' }}>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="/dashboard" style={{ color: muted, fontSize: '13px', textDecoration: 'none' }}>Voltar</a>
            <div>
              <div style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2px' }}>Gestao</div>
              <div style={{ fontFamily: syne, fontSize: '24px', fontWeight: 800, color: '#F0F0F0' }}>
                Turmas <span style={{ color: neon }}>({turmas.length})</span>
              </div>
            </div>
          </div>
          <button onClick={() => setCriando(!criando)} style={{ background: 'linear-gradient(135deg,#39FF14,#00cc00)', color: '#000', padding: '10px 18px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: 'pointer', boxShadow: '0 0 16px rgba(57,255,20,0.3)' }}>
            + Nova
          </button>
        </div>
      </div>

      {criando && (
        <div style={{ margin: '16px 20px', background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.2)', borderRadius: '16px', padding: '16px' }}>
          <p style={{ fontFamily: syne, fontWeight: 800, fontSize: '14px', color: neon, marginBottom: '16px' }}>Nova Turma</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Nome da turma *</label>
              <input name="nome" value={form.nome} onChange={handleChange} style={inputStyle} placeholder="Ex: Sub-10, Iniciante..." />
            </div>
            <div>
              <label style={labelStyle}>Dias da semana</label>
              <input name="diasSemana" value={form.diasSemana} onChange={handleChange} style={inputStyle} placeholder="Ex: Seg, Qua, Sex" />
            </div>
            <div>
              <label style={labelStyle}>Horario</label>
              <input name="horario" value={form.horario} onChange={handleChange} style={inputStyle} placeholder="Ex: 18:00 - 19:00" />
            </div>
            <div>
              <label style={labelStyle}>Descricao</label>
              <textarea name="descricao" value={form.descricao} onChange={handleChange} rows={2} style={{ ...inputStyle, resize: 'none' }} placeholder="Observacoes..." />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={salvar} disabled={salvando || !form.nome} style={{ flex: 1, background: 'linear-gradient(135deg,#39FF14,#00cc00)', color: '#000', padding: '14px', borderRadius: '12px', fontWeight: 800, fontFamily: syne, fontSize: '13px', border: 'none', cursor: 'pointer', opacity: salvando || !form.nome ? 0.5 : 1 }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setCriando(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: muted, padding: '14px', borderRadius: '12px', fontWeight: 700, fontFamily: syne, fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: muted }}>Carregando...</div>}

      {!loading && turmas.length === 0 && !criando && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontFamily: syne, fontSize: '18px', fontWeight: 700, color: '#F0F0F0', marginBottom: '8px' }}>Nenhuma turma</p>
          <p style={{ fontSize: '13px', color: muted }}>Clique em + Nova para criar a primeira</p>
        </div>
      )}

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {turmas.map((t, i) => (
          <a key={t.id} href={'/turmas/' + t.id} style={{ display: 'block', background: card, border: border, borderRadius: '16px', padding: '16px', textDecoration: 'none', color: '#F0F0F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: syne, fontWeight: 800, fontSize: '11px', color: neon }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '15px', color: '#F0F0F0', margin: 0 }}>{t.nome}</p>
                </div>
                {t.diasSemana && <p style={{ fontSize: '12px', color: neon, margin: '0 0 2px', fontWeight: 600 }}>{t.diasSemana}{t.horario ? ' · ' + t.horario : ''}</p>}
                {t.descricao && <p style={{ fontSize: '11px', color: muted, margin: 0 }}>{t.descricao}</p>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)', color: neon, fontSize: '11px', fontWeight: 700, fontFamily: syne, padding: '4px 10px', borderRadius: '20px' }}>
                  {t.totalAtletas} atleta{t.totalAtletas !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 0 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(10px)' }}>
        {[
          { href: '/dashboard', label: 'Inicio', active: false },
          { href: '/atletas', label: 'Atletas', active: false },
          { href: '/presenca', label: 'Presenca', active: false },
          { href: '/financeiro', label: 'Financeiro', active: false },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: item.active ? neon : muted, fontFamily: syne, fontWeight: item.active ? 700 : 400 }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
