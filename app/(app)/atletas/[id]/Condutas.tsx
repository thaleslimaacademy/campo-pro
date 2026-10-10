'use client'
import { useState } from 'react'
import { adicionarConduta, removerConduta } from './conduta-actions'

type Item = { id: string; texto: string; tipo: string; criadoEm: string }
const SYNE = 'Syne, sans-serif'

export default function Condutas({ atletaId, itens }: { atletaId: string; itens: Item[] }) {
  const [lista, setLista] = useState(itens)
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState<'positiva' | 'atencao'>('positiva')
  const [salvando, setSalvando] = useState(false)
  const [verTodas, setVerTodas] = useState(false)

  async function salvar() {
    setSalvando(true)
    const r = await adicionarConduta(atletaId, texto, tipo)
    setSalvando(false)
    if (!r.ok) { alert(r.erro); return }
    setLista(l => [r.item as Item, ...l]); setTexto(''); setAberto(false)
  }
  async function remover(id: string) {
    if (!confirm('Remover esta observação?')) return
    const r = await removerConduta(id, atletaId)
    if (r.ok) setLista(l => l.filter(i => i.id !== id))
  }

  const visiveis = verTodas ? lista : lista.slice(0, 4)
  const chip = (ativo: boolean, cor: string): React.CSSProperties => ({
    flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    border: `1px solid ${ativo ? cor : '#E3E8E5'}`, background: ativo ? cor + '14' : '#fff', color: ativo ? cor : '#6B7280',
  })

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(16,24,40,0.08)', borderRadius: 18, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: '#E7F5ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📝</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 16, color: '#1F2937', margin: 0 }}>Condutas</p>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0' }}>Comportamento e atitude · aparece na Área dos Pais</p>
        </div>
        <button onClick={() => setAberto(a => !a)} style={{ background: '#2EA866', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: SYNE }}>
          {aberto ? 'Fechar' : '+ Anotar'}
        </button>
      </div>

      {aberto && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button onClick={() => setTipo('positiva')} style={chip(tipo === 'positiva', '#16A34A')}>👍 Ponto positivo</button>
            <button onClick={() => setTipo('atencao')} style={chip(tipo === 'atencao', '#D97706')}>⚠️ Precisa melhorar</button>
          </div>
          <textarea value={texto} onChange={e => setTexto(e.target.value)} maxLength={300} rows={2}
            placeholder="Ex.: Participa bem das atividades e demonstra interesse."
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E3E8E5', borderRadius: 10, padding: 10, fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'vertical' }} />
          <button onClick={salvar} disabled={salvando || texto.trim().length < 2}
            style={{ marginTop: 8, width: '100%', background: '#2EA866', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontWeight: 800, fontSize: 13, cursor: 'pointer', opacity: salvando || texto.trim().length < 2 ? 0.5 : 1, fontFamily: SYNE }}>
            {salvando ? 'Salvando…' : 'Salvar observação'}
          </button>
        </div>
      )}

      <div style={{ marginTop: 12, background: '#F1F7F3', borderRadius: 12, padding: lista.length ? '6px 12px' : 14 }}>
        {lista.length === 0 ? (
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0, textAlign: 'center' }}>Nenhuma observação ainda.</p>
        ) : visiveis.map(i => (
          <div key={i.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0' }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0, background: i.tipo === 'atencao' ? '#D97706' : '#16A34A' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13.5, color: '#1F2937', margin: 0, lineHeight: 1.4 }}>{i.texto}</p>
              <p style={{ fontSize: 10.5, color: '#9CA3AF', margin: '2px 0 0' }}>{new Date(i.criadoEm).toLocaleDateString('pt-BR')}</p>
            </div>
            <button onClick={() => remover(i.id)} aria-label="Remover" style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 14, padding: 2 }}>✕</button>
          </div>
        ))}
        {lista.length > 4 && (
          <button onClick={() => setVerTodas(v => !v)} style={{ background: 'none', border: 'none', color: '#23874F', fontWeight: 700, fontSize: 12, padding: '4px 0 8px', cursor: 'pointer' }}>
            {verTodas ? 'Ver menos' : `Ver todas (${lista.length})`}
          </button>
        )}
      </div>
    </div>
  )
}
