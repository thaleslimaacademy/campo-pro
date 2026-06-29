'use client'
import { useEffect, useState, useTransition } from 'react'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/ui/BottomNav'
import { getCategorias, criarCategoria, editarCategoria, excluirCategoria, vincularTurmaCategoria } from './actions'

const T = { bg:'#0A0E1A', surface:'#0D1220', surface2:'#121A2E', primary:'#4169E1', text:'#F0F4FF', muted:'rgba(240,244,255,0.4)', border:'rgba(240,244,255,0.08)', green:'#00D67A', red:'#FF4444', gold:'#FFD700' }
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'
const INP: React.CSSProperties = { width:'100%', background:'#080C15', border:`1px solid rgba(240,244,255,0.1)`, borderRadius:8, padding:'11px 14px', color:T.text, fontFamily:INTER, fontSize:13, boxSizing:'border-box' }
const LBL: React.CSSProperties = { fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:4 }

const CORES = ['#4169E1','#00BFFF','#00D67A','#FFD700','#FF9500','#FF4444','#8B5CF6','#EC4899','#06B6D4','#F97316']
const MODALIDADES = ['futebol','futsal','futvolei','artes_marciais','outras']

type Categoria = { id: string; nome: string; descricao: string | null; idadeMin: number | null; idadeMax: number | null; modalidade: string; cor: string }
type Turma = { id: string; nome: string; categoriaId: string | null }

const FORM_VAZIO = { nome:'', descricao:'', idadeMin:'', idadeMax:'', modalidade:'futebol', cor:'#4169E1' }

function CategoriasInner() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [turmas, setTurmas]         = useState<Turma[]>([])
  const [loading, startLoad]        = useTransition()
  const [salvando, startSave]       = useTransition()
  const [modal, setModal]           = useState<'nova' | 'editar' | 'turmas' | null>(null)
  const [editando, setEditando]     = useState<Categoria | null>(null)
  const [catTurmas, setCatTurmas]   = useState<Categoria | null>(null)
  const [form, setForm]             = useState(FORM_VAZIO)

  function carregar() {
    startLoad(async () => {
      const d = await getCategorias()
      setCategorias(d.categorias as Categoria[])
      setTurmas(d.turmas as Turma[])
    })
  }

  useEffect(() => { carregar() }, [])

  function abrirNova() { setForm(FORM_VAZIO); setEditando(null); setModal('nova') }
  function abrirEditar(c: Categoria) { setEditando(c); setForm({ nome: c.nome, descricao: c.descricao||'', idadeMin: c.idadeMin?.toString()||'', idadeMax: c.idadeMax?.toString()||'', modalidade: c.modalidade, cor: c.cor }); setModal('editar') }
  function abrirTurmas(c: Categoria) { setCatTurmas(c); setModal('turmas') }

  function salvar() {
    startSave(async () => {
      const payload = { nome: form.nome, descricao: form.descricao||undefined, idadeMin: form.idadeMin?Number(form.idadeMin):undefined, idadeMax: form.idadeMax?Number(form.idadeMax):undefined, modalidade: form.modalidade, cor: form.cor }
      if (editando) await editarCategoria(editando.id, payload)
      else await criarCategoria(payload)
      setModal(null); carregar()
    })
  }

  function excluir(id: string, nome: string) {
    if (!confirm(`Excluir a categoria "${nome}"? As turmas vinculadas serão desvinculadas.`)) return
    startSave(async () => { await excluirCategoria(id); carregar() })
  }

  function toggleTurma(turmaId: string, categoriaId: string) {
    const turma = turmas.find(t => t.id === turmaId)
    const novoId = turma?.categoriaId === categoriaId ? null : categoriaId
    startSave(async () => { await vincularTurmaCategoria(turmaId, novoId); carregar() })
  }

  const turmasDaCat = (catId: string) => turmas.filter(t => t.categoriaId === catId)
  const turmasSemCat = turmas.filter(t => !t.categoriaId)

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:INTER, paddingBottom:80 }}>

      {/* HEADER */}
      <div style={{ background:T.primary, padding:'20px 20px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:10, color:'rgba(240,244,255,0.65)', textTransform:'uppercase', letterSpacing:2, fontWeight:700, marginBottom:2 }}>Elenco</div>
            <div style={{ fontFamily:SYNE, fontWeight:900, fontSize:22, color:T.text, letterSpacing:-0.5, textTransform:'uppercase' }}>Categorias</div>
          </div>
          <button onClick={abrirNova} style={{ background:'rgba(240,244,255,0.15)', border:'1px solid rgba(240,244,255,0.2)', color:T.text, borderRadius:10, padding:'10px 14px', fontFamily:SYNE, fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'uppercase' }}>
            + Nova
          </button>
        </div>
      </div>

      <div style={{ padding:'14px 16px' }}>

        {/* Turmas sem categoria */}
        {turmasSemCat.length > 0 && (
          <div style={{ background:`${T.gold}08`, border:`1px solid ${T.gold}25`, borderRadius:12, padding:14, marginBottom:14 }}>
            <p style={{ fontFamily:SYNE, fontWeight:700, fontSize:11, color:T.gold, textTransform:'uppercase', letterSpacing:0.8, margin:'0 0 8px' }}>⚠️ Turmas sem categoria ({turmasSemCat.length})</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {turmasSemCat.map(t => (
                <span key={t.id} style={{ fontSize:11, color:T.muted, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:'3px 10px' }}>{t.nome}</span>
              ))}
            </div>
          </div>
        )}

        {loading && <p style={{ color:T.muted, textAlign:'center', padding:40 }}>Carregando...</p>}

        {/* Lista de categorias */}
        {categorias.map(c => (
          <div key={c.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderLeft:`3px solid ${c.cor}`, borderRadius:12, padding:14, marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:c.cor+'22', border:`1.5px solid ${c.cor}50`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div style={{ width:14, height:14, borderRadius:'50%', background:c.cor }} />
                </div>
                <div>
                  <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:15, color:T.text, margin:'0 0 2px' }}>{c.nome}</p>
                  <p style={{ fontSize:11, color:T.muted, margin:0 }}>
                    {c.modalidade} {c.idadeMin && c.idadeMax ? `· ${c.idadeMin} a ${c.idadeMax} anos` : ''}
                  </p>
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => abrirTurmas(c)} style={{ background:`${c.cor}15`, border:`1px solid ${c.cor}30`, color:c.cor, padding:'6px 10px', borderRadius:6, fontFamily:SYNE, fontWeight:700, fontSize:10, cursor:'pointer', textTransform:'uppercase' }}>
                  Turmas
                </button>
                <button onClick={() => abrirEditar(c)} style={{ background:T.surface2, border:`1px solid ${T.border}`, color:T.muted, padding:'6px 10px', borderRadius:6, fontSize:11, cursor:'pointer' }}>✏️</button>
                <button onClick={() => excluir(c.id, c.nome)} style={{ background:'rgba(255,68,68,0.08)', border:'1px solid rgba(255,68,68,0.2)', color:T.red, padding:'6px 10px', borderRadius:6, fontSize:11, cursor:'pointer' }}>🗑️</button>
              </div>
            </div>
            {c.descricao && <p style={{ fontSize:12, color:T.muted, margin:'0 0 8px' }}>{c.descricao}</p>}
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {turmasDaCat(c.id).length === 0
                ? <span style={{ fontSize:11, color:T.muted, fontStyle:'italic' }}>Nenhuma turma vinculada</span>
                : turmasDaCat(c.id).map(t => (
                  <span key={t.id} style={{ fontSize:11, color:c.cor, background:c.cor+'10', border:`1px solid ${c.cor}25`, borderRadius:6, padding:'3px 10px', fontWeight:600 }}>{t.nome}</span>
                ))
              }
            </div>
          </div>
        ))}

        {categorias.length === 0 && !loading && (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🏷️</div>
            <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:16, color:T.text, marginBottom:6 }}>Nenhuma categoria</p>
            <p style={{ fontSize:13, color:T.muted }}>Crie categorias para organizar suas turmas por faixa etária.</p>
          </div>
        )}
      </div>

      {/* MODAL CRIAR/EDITAR */}
      {(modal === 'nova' || modal === 'editar') && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:100, padding:'0 0' }}>
          <div style={{ background:T.surface, borderRadius:'20px 20px 0 0', padding:20, width:'100%', maxWidth:480, maxHeight:'85vh', overflowY:'auto' }}>
            <p style={{ fontFamily:SYNE, fontWeight:900, fontSize:16, color:T.text, marginBottom:16, textTransform:'uppercase' }}>
              {modal === 'nova' ? '+ Nova Categoria' : '✏️ Editar Categoria'}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div><label style={LBL}>Nome *</label><input value={form.nome} onChange={e => setForm(p=>({...p,nome:e.target.value}))} placeholder="Ex: Sub-11" style={INP} /></div>
              <div><label style={LBL}>Descrição</label><input value={form.descricao} onChange={e => setForm(p=>({...p,descricao:e.target.value}))} placeholder="Descrição opcional" style={INP} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div><label style={LBL}>Idade mínima</label><input type="number" value={form.idadeMin} onChange={e => setForm(p=>({...p,idadeMin:e.target.value}))} placeholder="Ex: 10" style={INP} /></div>
                <div><label style={LBL}>Idade máxima</label><input type="number" value={form.idadeMax} onChange={e => setForm(p=>({...p,idadeMax:e.target.value}))} placeholder="Ex: 11" style={INP} /></div>
              </div>
              <div><label style={LBL}>Modalidade</label>
                <select value={form.modalidade} onChange={e => setForm(p=>({...p,modalidade:e.target.value}))} style={INP}>
                  {MODALIDADES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Cor</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4, alignItems:'center' }}>
                  {CORES.map(cor => (
                    <button key={cor} onClick={() => setForm(p=>({...p,cor}))}
                      style={{ width:32, height:32, borderRadius:8, background:cor, border:`2px solid ${form.cor===cor?'#fff':cor+'44'}`, cursor:'pointer' }} />
                  ))}
                  <input type="color" value={form.cor} onChange={e => setForm(p=>({...p,cor:e.target.value}))}
                    style={{ width:32, height:32, borderRadius:8, border:`1px solid ${T.border}`, cursor:'pointer', padding:2, background:'transparent' }} />
                </div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button onClick={() => setModal(null)} style={{ flex:1, background:'transparent', border:`1px solid ${T.border}`, color:T.muted, padding:'13px', borderRadius:10, fontFamily:SYNE, fontWeight:600, fontSize:13, cursor:'pointer' }}>Cancelar</button>
                <button onClick={salvar} disabled={!form.nome || salvando} style={{ flex:2, background:T.primary, color:T.text, padding:'13px', borderRadius:10, fontFamily:SYNE, fontWeight:800, fontSize:13, border:'none', cursor:'pointer', textTransform:'uppercase', opacity:(!form.nome||salvando)?0.5:1 }}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TURMAS */}
      {modal === 'turmas' && catTurmas && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:T.surface, borderRadius:'20px 20px 0 0', padding:20, width:'100%', maxWidth:480, maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:14, height:14, borderRadius:'50%', background:catTurmas.cor }} />
              <p style={{ fontFamily:SYNE, fontWeight:900, fontSize:16, color:T.text, margin:0, textTransform:'uppercase' }}>Turmas — {catTurmas.nome}</p>
            </div>
            <p style={{ fontSize:12, color:T.muted, marginBottom:14 }}>Selecione as turmas que pertencem a esta categoria:</p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {turmas.map(t => {
                const vinculada = t.categoriaId === catTurmas.id
                const outraCat  = t.categoriaId && t.categoriaId !== catTurmas.id
                return (
                  <button key={t.id} onClick={() => { if (!outraCat) { toggleTurma(t.id, catTurmas.id); } }}
                    disabled={!!outraCat || salvando}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:10, border:`1px solid ${vinculada?catTurmas.cor+'44':T.border}`, background:vinculada?catTurmas.cor+'12':'transparent', cursor:outraCat?'not-allowed':'pointer', textAlign:'left', opacity:outraCat?0.5:1 }}>
                    <span style={{ fontSize:14, color:vinculada?T.text:T.muted, fontWeight:vinculada?700:400, fontFamily:vinculada?SYNE:INTER }}>{t.nome}</span>
                    <div>
                      {vinculada && <span style={{ fontSize:9, fontWeight:800, color:catTurmas.cor, background:catTurmas.cor+'20', padding:'2px 8px', borderRadius:4, textTransform:'uppercase' }}>Vinculada</span>}
                      {outraCat && <span style={{ fontSize:9, color:T.muted }}>Outra categoria</span>}
                    </div>
                  </button>
                )
              })}
            </div>
            <button onClick={() => { setModal(null); carregar() }} style={{ width:'100%', marginTop:16, background:T.primary, color:T.text, padding:'13px', borderRadius:10, fontFamily:SYNE, fontWeight:800, fontSize:13, border:'none', cursor:'pointer', textTransform:'uppercase' }}>
              Concluir
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

export default function Categorias() {
  return <AdminGuard><CategoriasInner /></AdminGuard>
}
