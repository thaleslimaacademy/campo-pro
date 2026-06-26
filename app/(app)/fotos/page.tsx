'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Image, ChevronRight } from 'lucide-react'
import { listarAlbuns, criarAlbum, excluirAlbum } from './actions'

const C = { bg: '#0A0E1A', surface: '#1A1A2E', orange: '#4169E1', gold: '#FFD700', text: '#F0F4FF', muted: 'rgba(240,240,240,0.45)', border: 'rgba(255,255,255,0.08)' }
const SYNE = 'Syne, sans-serif'

type Album = { id: string; titulo: string; descricao: string | null; dataEvento: string | null; capa: string | null; ativo: boolean }

export default function FotosPage() {
  const [albuns, setAlbuns] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataEvento, setDataEvento] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = async () => {
    setLoading(true)
    try { setAlbuns(await listarAlbuns() as Album[]) }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  const salvar = async () => {
    if (!titulo) return
    setSalvando(true)
    try { await criarAlbum({ titulo, descricao, dataEvento: dataEvento || undefined }); setTitulo(''); setDescricao(''); setDataEvento(''); setShowForm(false); await carregar() }
    catch (e) { alert((e as Error).message) }
    finally { setSalvando(false) }
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir álbum e todas as fotos?')) return
    await excluirAlbum(id); await carregar()
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: 20 }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: SYNE, fontSize: 26, fontWeight: 800, color: C.orange, margin: 0 }}>📸 Álbuns de Fotos</h1>
            <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Gerencie álbuns, faça upload e defina preços</p>
          </div>
          <button onClick={() => setShowForm(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.orange, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px', fontFamily: SYNE, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            <Plus size={16} /> Novo álbum
          </button>
        </div>

        {showForm && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontFamily: SYNE, color: C.gold, margin: '0 0 16px' }}>Novo álbum</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <Campo label="Título *"><input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Treino 10/06" style={inp} /></Campo>
              <Campo label="Descrição"><input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição opcional" style={inp} /></Campo>
              <Campo label="Data do evento"><input type="date" value={dataEvento} onChange={e => setDataEvento(e.target.value)} style={inp} /></Campo>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={salvar} disabled={salvando} style={{ background: C.orange, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontFamily: SYNE, fontWeight: 700, cursor: 'pointer' }}>
                {salvando ? 'Salvando...' : 'Criar álbum'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 20px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: C.muted, textAlign: 'center', padding: 40 }}>Carregando...</p>
        ) : albuns.length === 0 ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
            <p style={{ color: C.muted }}>Nenhum álbum ainda. Crie o primeiro!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {albuns.map(a => (
              <div key={a.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: `${C.orange}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {a.capa ? <img src={a.capa} style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover' }} alt="" /> : <Image size={24} color={C.orange} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 15, color: C.text }}>{a.titulo}</div>
                  {a.descricao && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{a.descricao}</div>}
                  {a.dataEvento && <div style={{ fontSize: 11, color: C.orange, marginTop: 2 }}>📅 {a.dataEvento.slice(0, 10).split('-').reverse().join('/')}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`/fotos/${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${C.orange}18`, color: C.orange, border: `1px solid ${C.orange}44`, borderRadius: 10, padding: '8px 14px', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                    Fotos <ChevronRight size={14} />
                  </a>
                  <button onClick={() => excluir(a.id)} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 10px', color: '#FF4757', cursor: 'pointer', display: 'flex' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 24, background: `${C.gold}10`, border: `1px solid ${C.gold}33`, borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 13, color: C.gold, marginBottom: 4 }}>🔗 Link público da galeria</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>gestaofc.com.br/galeria</div>
          <button onClick={() => { navigator.clipboard.writeText('https://gestaofc.com.br/galeria'); alert('Copiado!') }}
            style={{ background: C.gold, color: '#1a1400', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: SYNE, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            📋 Copiar link
          </button>
        </div>
      </div>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'rgba(240,240,240,0.45)' }}>{label}{children}</label>
}

const inp: React.CSSProperties = { background: '#0A0E1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', color: '#F0F4FF', fontSize: 14, width: '100%', boxSizing: 'border-box' }