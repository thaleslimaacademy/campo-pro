'use client'
import { useEffect, useState } from 'react'
import { listarAtletasParaPremio, listarPremiacoes, concederPremio, removerPremio } from './actions'
import { CATALOGO, NIVEL_POR_CONQUISTAS } from './constants'

const C = { bg:'#0F0F1A', surface:'#1A1A2E', orange:'#FF6B00', gold:'#FFD700', green:'#00C896', muted:'rgba(255,255,255,0.4)', border:'rgba(255,255,255,0.08)' }
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

type Atleta = { id:string; nome:string; fotoUrl:string|null; posicao:string|null; tokenPais:string|null }
type Premiacao = { id:string; titulo:string; icone:string; descricao:string|null; dataConquista:string }

export default function PremiosPage() {
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [atletaSel, setAtletaSel] = useState<Atleta|null>(null)
  const [premiacoes, setPremiacoes] = useState<Premiacao[]>([])
  const [catSel, setCatSel] = useState(0)
  const [salvando, setSalvando] = useState<string|null>(null)
  const [busca, setBusca] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => { listarAtletasParaPremio().then(setAtletas as any) }, [])

  const selecionarAtleta = async (a: Atleta) => {
    setAtletaSel(a)
    const p = await listarPremiacoes(a.id)
    setPremiacoes(p as Premiacao[])
  }

  const dar = async (titulo: string, icone: string, descricao: string) => {
    if (!atletaSel) return
    const jatem = premiacoes.some(p => p.titulo === titulo)
    if (jatem) { alert('Atleta já tem este prêmio!'); return }
    setSalvando(titulo)
    await concederPremio(atletaSel.id, titulo, icone, descricao)
    const p = await listarPremiacoes(atletaSel.id)
    setPremiacoes(p as Premiacao[])
    setSalvando(null)
  }

  const remover = async (id: string) => {
    if (!confirm('Remover este prêmio?')) return
    await removerPremio(id)
    const p = await listarPremiacoes(atletaSel!.id)
    setPremiacoes(p as Premiacao[])
  }

  const copiarLink = () => {
    if (!atletaSel?.tokenPais) return
    navigator.clipboard.writeText(`https://gestaofc.com.br/pais/${atletaSel.tokenPais}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const nivel = NIVEL_POR_CONQUISTAS(premiacoes.length)
  const atletasFiltrados = atletas.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:'#F0F0F0', fontFamily:INTER, paddingBottom:80 }}>

      <div style={{ padding:'20px 20px 16px' }}>
        <p style={{ color:C.muted, fontSize:11, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Sistema de Conquistas</p>
        <h1 style={{ fontFamily:SYNE, fontSize:26, fontWeight:800, color:C.gold, margin:0 }}>🏆 Premiações</h1>
      </div>

      {!atletaSel ? (
        <div style={{ padding:'0 20px' }}>
          <input
            placeholder="Buscar atleta..."
            value={busca} onChange={e => setBusca(e.target.value)}
            style={{ width:'100%', background:C.surface, border:`1px solid ${C.border}`, color:'#fff', padding:'12px 16px', borderRadius:12, fontFamily:INTER, fontSize:14, marginBottom:16, boxSizing:'border-box' as const }}
          />
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {atletasFiltrados.map(a => (
              <button key={a.id} onClick={() => selecionarAtleta(a)}
                style={{ display:'flex', alignItems:'center', gap:14, background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 16px', cursor:'pointer', textAlign:'left', width:'100%' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:`${C.gold}20`, border:`1px solid ${C.gold}40`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:SYNE, fontWeight:800, fontSize:18, color:C.gold, flexShrink:0 }}>
                  {a.fotoUrl ? <img src={a.fotoUrl} style={{ width:44, height:44, borderRadius:12, objectFit:'cover' }} /> : a.nome[0]}
                </div>
                <div>
                  <p style={{ fontFamily:SYNE, fontWeight:700, fontSize:15, color:'#fff', margin:0 }}>{a.nome}</p>
                  <p style={{ color:C.muted, fontSize:12, marginTop:2 }}>{a.posicao || 'Sem posição'}</p>
                </div>
                <span style={{ marginLeft:'auto', color:C.orange, fontSize:18 }}>→</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding:'0 20px' }}>

          {/* Atleta header */}
          <div style={{ background:C.surface, borderRadius:16, padding:16, border:`1px solid ${C.gold}33`, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              <button onClick={() => setAtletaSel(null)} style={{ background:'transparent', border:'none', color:C.muted, cursor:'pointer', fontSize:20 }}>←</button>
              <div style={{ width:44, height:44, borderRadius:12, background:`${C.gold}20`, border:`1px solid ${C.gold}40`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:SYNE, fontWeight:800, fontSize:18, color:C.gold }}>
                {atletaSel.fotoUrl ? <img src={atletaSel.fotoUrl} style={{ width:44, height:44, borderRadius:12, objectFit:'cover' }} /> : atletaSel.nome[0]}
              </div>
              <div>
                <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:16, color:'#fff', margin:0 }}>{atletaSel.nome}</p>
                <p style={{ color:C.muted, fontSize:12 }}>{nivel.emoji} {nivel.label} · {premiacoes.length} conquistas</p>
              </div>
            </div>
            <button onClick={copiarLink}
              style={{ width:'100%', background: copiado ? C.green : `${C.gold}20`, border:`1px solid ${C.gold}40`, color: copiado ? '#fff' : C.gold, padding:'10px', borderRadius:10, cursor:'pointer', fontFamily:SYNE, fontWeight:700, fontSize:12 }}>
              {copiado ? '✅ Link copiado!' : '🔗 Copiar link dos pais'}
            </button>
          </div>

          {/* Conquistas do atleta */}
          {premiacoes.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <p style={{ fontFamily:SYNE, fontWeight:700, fontSize:13, color:C.gold, marginBottom:8 }}>Conquistas ({premiacoes.length})</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {premiacoes.map(p => (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:6, background:`${C.gold}15`, border:`1px solid ${C.gold}30`, borderRadius:20, padding:'6px 12px' }}>
                    <span style={{ fontSize:16 }}>{p.icone}</span>
                    <span style={{ fontSize:11, fontFamily:SYNE, fontWeight:600, color:C.gold }}>{p.titulo}</span>
                    <button onClick={() => remover(p.id)} style={{ background:'transparent', border:'none', color:'rgba(255,68,68,0.6)', cursor:'pointer', fontSize:12, padding:0, marginLeft:4 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Catálogo por categoria */}
          <div style={{ display:'flex', gap:6, overflowX:'auto', marginBottom:12, paddingBottom:4 }}>
            {CATALOGO.map((cat, i) => (
              <button key={i} onClick={() => setCatSel(i)}
                style={{ whiteSpace:'nowrap', padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontFamily:SYNE, fontWeight:700, fontSize:11, background: catSel===i ? C.orange : C.surface, color: catSel===i ? '#fff' : C.muted }}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {CATALOGO[catSel].premios.map((p, i) => {
              const temPremio = premiacoes.some(pr => pr.titulo === p.titulo)
              return (
                <button key={i} onClick={() => dar(p.titulo, p.icone, p.descricao)}
                  disabled={!!salvando || temPremio}
                  style={{ background: temPremio ? `${C.gold}15` : C.surface, border:`1px solid ${temPremio ? C.gold : C.border}`, borderRadius:14, padding:'14px 12px', cursor: temPremio ? 'default' : 'pointer', textAlign:'left', opacity: salvando===p.titulo ? 0.6 : 1 }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>{p.icone}</div>
                  <p style={{ fontFamily:SYNE, fontWeight:700, fontSize:12, color: temPremio ? C.gold : '#fff', margin:'0 0 4px' }}>{p.titulo}</p>
                  <p style={{ color:C.muted, fontSize:10, lineHeight:1.4, margin:0 }}>{p.descricao}</p>
                  {temPremio && <p style={{ color:C.gold, fontSize:10, marginTop:4 }}>✓ Conquistado</p>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}