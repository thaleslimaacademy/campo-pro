'use client'
import { useState } from 'react'
import { CATALOGO } from '@/app/(app)/premios/constants'
import { concederPremio, removerPremio } from '@/app/(app)/premios/actions'

type Item = { id: string; titulo: string; icone: string | null; descricao: string | null; dataConquista: string | null }
const SYNE = 'Syne, sans-serif'

export default function Conquistas({ atletaId, itens, podeEditar }: { atletaId: string; itens: Item[]; podeEditar: boolean }) {
  const [lista, setLista] = useState(itens)
  const [aberto, setAberto] = useState(false)
  const [cat, setCat] = useState(0)
  const [ocupado, setOcupado] = useState(false)

  async function conceder(p: { titulo: string; icone: string; descricao: string }) {
    if (!confirm(`Conceder "${p.titulo}"? Os pais recebem o aviso no celular.`)) return
    setOcupado(true)
    try {
      await concederPremio(atletaId, p.titulo, p.icone, p.descricao)
      setLista(l => [{ id: 'novo-' + Date.now(), titulo: p.titulo, icone: p.icone, descricao: p.descricao, dataConquista: new Date().toISOString().slice(0, 10) }, ...l])
      setAberto(false)
    } catch (e) { alert((e as Error).message) } finally { setOcupado(false) }
  }
  async function remover(i: Item) {
    if (i.id.startsWith('novo-')) return
    if (!confirm(`Remover a conquista "${i.titulo}"?`)) return
    await removerPremio(i.id).catch(e => alert((e as Error).message))
    setLista(l => l.filter(x => x.id !== i.id))
  }

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(16,24,40,0.08)', borderRadius: 18, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🏆</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 16, color: '#1F2937', margin: 0 }}>Conquistas</p>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>{lista.length ? `${lista.length} conquista${lista.length > 1 ? 's' : ''} · aparecem na Área dos Pais` : 'Aparecem na Área dos Pais'}</p>
        </div>
        {podeEditar && (
          <button onClick={() => setAberto(a => !a)} style={{ background: '#B7791F', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: SYNE }}>
            {aberto ? 'Fechar' : '+ Conceder'}
          </button>
        )}
      </div>

      {aberto && (
        <div style={{ marginTop: 12, border: '1px solid #F3E3B5', borderRadius: 12, padding: 10, background: '#FFFBEB' }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
            {CATALOGO.map((c, i) => (
              <button key={c.label} onClick={() => setCat(i)} style={{ flexShrink: 0, padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid ' + (cat === i ? '#B7791F' : '#E5E7EB'), background: cat === i ? '#B7791F' : '#fff', color: cat === i ? '#fff' : '#374151' }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 6, marginTop: 6, maxHeight: 260, overflowY: 'auto' }}>
            {CATALOGO[cat].premios.map(p => (
              <button key={p.titulo} disabled={ocupado} onClick={() => conceder(p)} style={{ textAlign: 'left', padding: 8, borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer' }}>
                <span style={{ fontSize: 18 }}>{p.icone}</span>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#1F2937', margin: '2px 0 0' }}>{p.titulo}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {lista.length === 0 ? (
        <p style={{ fontSize: 13, color: '#6B7280', margin: '12px 0 0', textAlign: 'center', background: '#FAFAF7', borderRadius: 12, padding: 14 }}>Nenhuma conquista ainda.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
          {lista.map(i => (
            <div key={i.id} onClick={() => podeEditar && remover(i)} title={i.descricao || ''} style={{ background: 'linear-gradient(160deg,#FFFBEB,#FEF3C7)', border: '1px solid #F3E3B5', borderRadius: 12, padding: '10px 6px', textAlign: 'center', cursor: podeEditar ? 'pointer' : 'default' }}>
              <div style={{ fontSize: 26, lineHeight: 1 }}>{i.icone || '🏅'}</div>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#78350F', margin: '6px 0 2px', lineHeight: 1.2 }}>{i.titulo}</p>
              {i.dataConquista && <p style={{ fontSize: 9.5, color: '#A16207', margin: 0 }}>{String(i.dataConquista).slice(0, 10).split('-').reverse().join('/')}</p>}
            </div>
          ))}
        </div>
      )}
      {podeEditar && lista.length > 0 && <p style={{ fontSize: 10.5, color: '#9CA3AF', margin: '8px 0 0', textAlign: 'center' }}>Toque numa conquista para remover.</p>}
    </div>
  )
}
