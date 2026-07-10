'use client'
import { useEffect, useState, useTransition, useRef } from 'react'
import BottomNav from '@/components/ui/BottomNav'
import { getConvocacoesIniciais, criarConvocacao, encerrarConvocacao, excluirConvocacao } from './actions'

const T = { bg:'#0A0E1A', surface:'#0D1220', primary:'#4169E1', text:'#F0F4FF', muted:'rgba(240,244,255,0.4)', border:'rgba(240,244,255,0.08)', green:'#00D67A', red:'#FF4444', gold:'#FFD700' }
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'
const INP: React.CSSProperties = { width:'100%', background:'#080C15', border:'1px solid rgba(240,244,255,0.1)', borderRadius:8, padding:'11px 14px', color:T.text, fontFamily:INTER, fontSize:13, marginTop:4, boxSizing:'border-box' }
const TIPO_COR: Record<string,string> = { amistoso:T.primary, 'jogo-treino':'#8B5CF6', campeonato:T.gold, treino:T.green }

type Atleta = { id:string; nome:string; fotoUrl:string|null; turmaId:string|null; dataNascimento:string|null; posicao:string|null; categoriaId:string|null; statusMensalidade:string }
type Convocacao = { id:string; titulo:string; tipo:string; data:string; horario:string; local:string; descricao:string; status:string }
type Turma = { id:string; nome:string }

const statusMens = (s: string) => {
  if (s === 'PAGO') return { label:'Em dia', cor:'#00D67A' }
  if (s === 'VENCIDO') return { label:'Atrasado', cor:'#FF4444' }
  if (s === 'PENDENTE') return { label:'Pendente', cor:'#FFD700' }
  return { label:'—', cor:'rgba(240,244,255,0.3)' }
}

const anoNasc = (d: string|null) => d ? new Date(d+'T12:00:00').getFullYear() : '—'
const iniciais = (n: string) => n.split(' ').filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase()

function FigurinhaCard({ atleta, turmaMap, selecionado, onToggle }: { atleta: Atleta; turmaMap: Map<string,string>; selecionado?: boolean; onToggle?: () => void }) {
  const ms = statusMens(atleta.statusMensalidade)
  const turma = atleta.turmaId ? turmaMap.get(atleta.turmaId) || '' : ''
  const ano = anoNasc(atleta.dataNascimento)

  return (
    <div onClick={onToggle} style={{ position:'relative', cursor: onToggle ? 'pointer' : 'default', borderRadius:14, overflow:'hidden', border: selecionado ? `2px solid ${T.primary}` : '2px solid rgba(240,244,255,0.06)', boxShadow: selecionado ? `0 0 20px rgba(65,105,225,0.3)` : '0 4px 16px rgba(0,0,0,0.4)', background:'linear-gradient(160deg, #1A2744 0%, #0D1220 100%)', width:'100%', transition:'transform 0.15s', transform: selecionado ? 'scale(1.02)' : 'scale(1)' }}>
      {/* Check badge */}
      {onToggle && selecionado && <div style={{ position:'absolute', top:6, right:6, width:22, height:22, borderRadius:'50%', background:T.primary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#fff', fontWeight:900, zIndex:2 }}>✓</div>}

      {/* Status mensalidade badge */}
      <div style={{ position:'absolute', top:6, left:6, background:'rgba(0,0,0,0.6)', borderRadius:20, padding:'2px 8px', zIndex:2 }}>
        <span style={{ fontSize:9, fontWeight:800, color:ms.cor, fontFamily:SYNE, textTransform:'uppercase', letterSpacing:0.5 }}>{ms.label}</span>
      </div>

      {/* Foto */}
      <div style={{ height:100, background:'linear-gradient(180deg, rgba(65,105,225,0.15) 0%, transparent 100%)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        {atleta.fotoUrl ? (
          <img src={atleta.fotoUrl} alt={atleta.nome} style={{ width:72, height:72, borderRadius:'50%', objectFit:'cover', border:'3px solid rgba(65,105,225,0.4)', marginTop:12 }} />
        ) : (
          <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#1A3FA8,#4169E1)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:SYNE, fontWeight:900, fontSize:22, color:'#fff', marginTop:12, border:'3px solid rgba(65,105,225,0.3)' }}>
            {iniciais(atleta.nome)}
          </div>
        )}
        {/* Número de camisa decorativo */}
        <div style={{ position:'absolute', bottom:0, right:8, fontFamily:SYNE, fontWeight:900, fontSize:28, color:'rgba(65,105,225,0.15)', lineHeight:1 }}>⚽</div>
      </div>

      {/* Info */}
      <div style={{ padding:'8px 10px 10px', textAlign:'center' }}>
        <p style={{ fontFamily:SYNE, fontWeight:900, fontSize:11, color:T.text, margin:'0 0 2px', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {atleta.nome.split(' ')[0]} {atleta.nome.split(' ').slice(-1)[0]}
        </p>
        {atleta.posicao && <p style={{ fontSize:9, color:T.muted, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:0.5 }}>{atleta.posicao}</p>}
        <div style={{ display:'flex', gap:4, justifyContent:'center', flexWrap:'wrap' }}>
          {turma && <span style={{ background:'rgba(65,105,225,0.15)', color:'#7DD3FC', fontSize:8, fontWeight:700, padding:'2px 6px', borderRadius:10, fontFamily:SYNE }}>{turma}</span>}
          {ano !== '—' && <span style={{ background:'rgba(240,244,255,0.06)', color:T.muted, fontSize:8, padding:'2px 6px', borderRadius:10 }}>{String(ano)}</span>}
        </div>
      </div>
    </div>
  )
}

export default function Convocacoes() {
  const [convocacoes, setConvocacoes] = useState<Convocacao[]>([])
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [convAtletas, setConvAtletas] = useState<{convocacaoId:string;atletaId:string}[]>([])
  const [escolaId, setEscolaId] = useState('')
  const [loading, startLoad] = useTransition()
  const [salvando, startSave] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [atletasSel, setAtletasSel] = useState<string[]>([])
  const [filtroTurma, setFiltroTurma] = useState('')
  const [filtroNome, setFiltroNome] = useState('')
  const [convAberta, setConvAberta] = useState<string|null>(null)
  const [form, setForm] = useState({ titulo:'', tipo:'amistoso', data:'', horario:'', local:'', descricao:'' })

  function carregar() {
    startLoad(async () => {
      const d = await getConvocacoesIniciais()
      setEscolaId(d.escolaId)
      setConvocacoes(d.convocacoes as Convocacao[])
      setAtletas(d.atletas as Atleta[])
      setTurmas(d.turmas as Turma[])
      setConvAtletas(d.convAtletas as {convocacaoId:string;atletaId:string}[])
    })
  }
  useEffect(() => { carregar() }, [])

  const turmaMap = new Map(turmas.map(t => [t.id, t.nome]))

  const atletasFiltrados = atletas.filter(a =>
    (!filtroTurma || a.turmaId === filtroTurma) &&
    (!filtroNome || a.nome.toLowerCase().includes(filtroNome.toLowerCase()))
  )

  function toggleAtleta(id: string) {
    setAtletasSel(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  async function salvarConvocacao() {
    if (!form.titulo || !form.data || atletasSel.length === 0) return
    startSave(async () => {
      await criarConvocacao(escolaId, form, atletasSel)
      setShowForm(false)
      setAtletasSel([])
      setForm({ titulo:'', tipo:'amistoso', data:'', horario:'', local:'', descricao:'' })
      carregar()
    })
  }

  // Gera PDF da convocação
  async function gerarPDF(conv: Convocacao) {
    const convocados = convAtletas.filter(ca => ca.convocacaoId === conv.id).map(ca => atletas.find(a => a.id === ca.atletaId)).filter(Boolean) as Atleta[]
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait' })
    const W = 210
    let y = 15

    // Header
    doc.setFillColor(10, 14, 26)
    doc.rect(0, 0, W, 40, 'F')
    doc.setFillColor(65, 105, 225)
    doc.rect(0, 38, W, 2, 'F')
    doc.setTextColor(255,255,255)
    doc.setFontSize(20)
    doc.setFont('helvetica','bold')
    doc.text('CONVOCAÇÃO', W/2, 18, { align:'center' })
    doc.setFontSize(13)
    doc.text(conv.titulo, W/2, 28, { align:'center' })
    doc.setFontSize(9)
    doc.setTextColor(150,180,255)
    doc.text(`${conv.data.split('-').reverse().join('/')} às ${conv.horario} · ${conv.local}`, W/2, 36, { align:'center' })
    y = 50

    // Grid de atletas (3 colunas)
    const cols = 3, cardW = 54, cardH = 42, gapX = 14, gapY = 6
    const startX = (W - (cols * cardW + (cols-1) * gapX)) / 2

    convocados.forEach((a, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (cardW + gapX)
      const cardY = y + row * (cardH + gapY)

      // Card fundo
      doc.setFillColor(13, 18, 32)
      doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'F')
      doc.setDrawColor(65, 105, 225)
      doc.setLineWidth(0.4)
      doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'S')

      // Status mensalidade dot
      const ms = statusMens(a.statusMensalidade)
      const cor = ms.cor === '#00D67A' ? [0,214,122] : ms.cor === '#FF4444' ? [255,68,68] : [255,215,0]
      doc.setFillColor(cor[0], cor[1], cor[2])
      doc.circle(x + 4, cardY + 4, 1.5, 'F')

      // Iniciais (placeholder para foto)
      doc.setFillColor(26, 63, 168)
      doc.circle(x + cardW/2, cardY + 16, 9, 'F')
      doc.setTextColor(255,255,255)
      doc.setFontSize(9)
      doc.setFont('helvetica','bold')
      doc.text(iniciais(a.nome), x + cardW/2, cardY + 18.5, { align:'center' })

      // Nome
      doc.setFontSize(6.5)
      doc.setFont('helvetica','bold')
      doc.setTextColor(240,244,255)
      const nomeArr = a.nome.split(' ')
      const nomeAbrev = `${nomeArr[0]} ${nomeArr.slice(-1)[0]}`
      doc.text(nomeAbrev, x + cardW/2, cardY + 29, { align:'center', maxWidth: cardW - 4 })

      // Posição e ano
      doc.setFontSize(5.5)
      doc.setFont('helvetica','normal')
      doc.setTextColor(100, 140, 200)
      const info = [a.posicao, anoNasc(a.dataNascimento) !== '—' ? String(anoNasc(a.dataNascimento)) : ''].filter(Boolean).join(' · ')
      doc.text(info, x + cardW/2, cardY + 34, { align:'center' })

      // Turma
      if (a.turmaId && turmaMap.get(a.turmaId)) {
        doc.setFontSize(5)
        doc.setTextColor(65, 105, 225)
        doc.text(turmaMap.get(a.turmaId) || '', x + cardW/2, cardY + 38.5, { align:'center' })
      }
    })

    // Legenda status
    const lastRow = Math.ceil(convocados.length / cols)
    const legendaY = y + lastRow * (cardH + gapY) + 10
    doc.setFontSize(8)
    doc.setTextColor(100,100,100)
    doc.text('Status: ', 20, legendaY)
    ;[[0,214,122,'Em dia'],[255,68,68,'Atrasado'],[255,215,0,'Pendente']].forEach(([r,g,b,label], i) => {
      doc.setFillColor(r as number, g as number, b as number)
      doc.circle(38 + i*28, legendaY - 1, 1.5, 'F')
      doc.setTextColor(150,150,150)
      doc.text(String(label), 41 + i*28, legendaY)
    })

    // Total
    doc.setFontSize(10)
    doc.setTextColor(65,105,225)
    doc.setFont('helvetica','bold')
    doc.text(`Total convocados: ${convocados.length}`, W/2, legendaY + 12, { align:'center' })

    // Footer
    doc.setFillColor(10,14,26)
    doc.rect(0, 285, W, 12, 'F')
    doc.setTextColor(65,105,225)
    doc.setFontSize(8)
    doc.setFont('helvetica','normal')
    doc.text('GestãoFC · gestaofc.com.br', W/2, 292, { align:'center' })

    doc.save(`convocacao-${conv.titulo.replace(/\s+/g,'-').toLowerCase()}.pdf`)
  }

  // Compartilha no WhatsApp
  function compartilharWhatsApp(conv: Convocacao) {
    const convocados = convAtletas.filter(ca => ca.convocacaoId === conv.id).map(ca => atletas.find(a => a.id === ca.atletaId)).filter(Boolean) as Atleta[]
    const lista = convocados.map((a,i) => `${i+1}. ${a.nome}${a.posicao ? ` (${a.posicao})` : ''}`).join('\n')
    const texto = `⚽ *CONVOCAÇÃO — ${conv.titulo.toUpperCase()}*\n\n📅 Data: ${conv.data.split('-').reverse().join('/')}\n⏰ Horário: ${conv.horario}\n📍 Local: ${conv.local}\n\n👥 *CONVOCADOS (${convocados.length}):*\n${lista}\n\n_GestãoFC · gestaofc.com.br_`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  const convAbertaObj = convocacoes.find(c => c.id === convAberta)
  const convocadosAbertos = convAberta ? convAtletas.filter(ca => ca.convocacaoId === convAberta).map(ca => atletas.find(a => a.id === ca.atletaId)).filter(Boolean) as Atleta[] : []

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:INTER, paddingBottom:88 }}>

      {/* HEADER */}
      <div style={{ background:'linear-gradient(135deg, #1A3FA8 0%, #4169E1 100%)', padding:'20px 18px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <p style={{ fontSize:10, color:'rgba(240,244,255,0.6)', textTransform:'uppercase', letterSpacing:2, margin:'0 0 4px', fontFamily:SYNE }}>Gestão</p>
            <h1 style={{ fontFamily:SYNE, fontWeight:900, fontSize:26, margin:0, letterSpacing:-0.8, textTransform:'uppercase' }}>Convocações</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'10px 16px', color:'#fff', fontFamily:SYNE, fontWeight:800, fontSize:12, cursor:'pointer', textTransform:'uppercase' }}>
            {showForm ? '✕ Fechar' : '+ Nova'}
          </button>
        </div>
      </div>

      {/* FORM NOVA CONVOCAÇÃO */}
      {showForm && (
        <div style={{ background:'#0D1220', borderBottom:`1px solid ${T.border}`, padding:'18px 18px' }}>
          <p style={{ fontFamily:SYNE, fontWeight:900, fontSize:13, color:T.primary, textTransform:'uppercase', letterSpacing:0.5, margin:'0 0 14px' }}>Nova Convocação</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div><label style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:0.8, fontFamily:SYNE }}>Título *</label>
              <input value={form.titulo} onChange={e=>setForm(p=>({...p,titulo:e.target.value}))} placeholder="Ex: Amistoso vs. Rival FC" style={INP} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:0.8, fontFamily:SYNE }}>Tipo</label>
                <select value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))} style={INP}>
                  <option value="amistoso">Amistoso</option>
                  <option value="campeonato">Campeonato</option>
                  <option value="jogo-treino">Jogo-treino</option>
                  <option value="treino">Treino</option>
                </select></div>
              <div><label style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:0.8, fontFamily:SYNE }}>Data</label>
                <input type="date" value={form.data} onChange={e=>setForm(p=>({...p,data:e.target.value}))} style={INP} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:0.8, fontFamily:SYNE }}>Horário</label>
                <input type="time" value={form.horario} onChange={e=>setForm(p=>({...p,horario:e.target.value}))} style={INP} /></div>
              <div><label style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:0.8, fontFamily:SYNE }}>Local</label>
                <input value={form.local} onChange={e=>setForm(p=>({...p,local:e.target.value}))} placeholder="Arena, campo..." style={INP} /></div>
            </div>

            {/* SELEÇÃO DE ATLETAS — MODO FIGURINHA */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <label style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:0.8, fontFamily:SYNE }}>Atletas * · {atletasSel.length} selecionado(s)</label>
                <button onClick={() => setAtletasSel(atletasSel.length === atletas.length ? [] : atletas.map(a=>a.id))}
                  style={{ fontSize:11, color:T.primary, background:'none', border:'none', cursor:'pointer', fontFamily:SYNE, fontWeight:700 }}>
                  {atletasSel.length === atletas.length ? 'Desmarcar todos' : 'Marcar todos'}
                </button>
              </div>
              {/* Filtros */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
                <input value={filtroNome} onChange={e=>setFiltroNome(e.target.value)} placeholder="🔍 Buscar por nome..." style={{ ...INP, marginTop:0 }} />
                <select value={filtroTurma} onChange={e=>setFiltroTurma(e.target.value)} style={{ ...INP, marginTop:0 }}>
                  <option value="">Todas as turmas</option>
                  {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>
              {/* Grid de figurinhas */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:8, maxHeight:360, overflowY:'auto', padding:4 }}>
                {atletasFiltrados.map(a => (
                  <FigurinhaCard key={a.id} atleta={a} turmaMap={turmaMap} selecionado={atletasSel.includes(a.id)} onToggle={() => toggleAtleta(a.id)} />
                ))}
              </div>
            </div>

            <button onClick={salvarConvocacao} disabled={salvando || !form.titulo || !form.data || atletasSel.length === 0}
              style={{ background:T.primary, color:T.text, padding:'14px', borderRadius:10, fontFamily:SYNE, fontWeight:900, fontSize:13, border:'none', cursor:'pointer', textTransform:'uppercase', opacity: (salvando || !form.titulo || !form.data || atletasSel.length === 0) ? 0.5 : 1 }}>
              {salvando ? 'Salvando...' : `⚽ Criar convocação (${atletasSel.length} atletas)`}
            </button>
          </div>
        </div>
      )}

      {/* LISTA DE CONVOCAÇÕES */}
      <div style={{ padding:'14px 14px' }}>
        {loading && <p style={{ color:T.muted, textAlign:'center', padding:32 }}>Carregando...</p>}
        {!loading && convocacoes.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 24px' }}>
            <p style={{ fontSize:36, marginBottom:8 }}>⚽</p>
            <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:16, color:T.text, marginBottom:8 }}>Nenhuma convocação</p>
            <p style={{ fontSize:13, color:T.muted }}>Crie a primeira convocação clicando em "+ Nova"</p>
          </div>
        )}

        {convocacoes.map(conv => {
          const qtd = convAtletas.filter(ca => ca.convocacaoId === conv.id).length
          const cor = TIPO_COR[conv.tipo] || T.primary
          const aberta = convAberta === conv.id
          const convocados = convAtletas.filter(ca => ca.convocacaoId === conv.id).map(ca => atletas.find(a => a.id === ca.atletaId)).filter(Boolean) as Atleta[]

          return (
            <div key={conv.id} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, marginBottom:12, overflow:'hidden' }}>
              {/* Card header */}
              <div onClick={() => setConvAberta(aberta ? null : conv.id)}
                style={{ padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:10, background:`${cor}15`, border:`1px solid ${cor}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {conv.tipo === 'campeonato' ? '🏆' : conv.tipo === 'treino' ? '🏃' : '⚽'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:14, color:T.text, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.titulo}</p>
                  <p style={{ fontSize:11, color:T.muted, margin:0 }}>{conv.data.split('-').reverse().join('/')} · {conv.horario} · {conv.local}</p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                  <span style={{ fontFamily:SYNE, fontWeight:900, fontSize:18, color:cor }}>{qtd}</span>
                  <span style={{ fontSize:9, color:T.muted, textTransform:'uppercase' }}>atletas</span>
                </div>
              </div>

              {/* Conteúdo expandido */}
              {aberta && (
                <div style={{ borderTop:`1px solid ${T.border}` }}>
                  {/* Botões de ação */}
                  <div style={{ display:'flex', gap:8, padding:'12px 14px', borderBottom:`1px solid ${T.border}` }}>
                    <button onClick={() => gerarPDF(conv)}
                      style={{ flex:1, background:'rgba(65,105,225,0.1)', border:'1px solid rgba(65,105,225,0.25)', color:T.primary, padding:'9px', borderRadius:8, fontFamily:SYNE, fontWeight:700, fontSize:11, cursor:'pointer', textTransform:'uppercase' }}>
                      📄 Baixar PDF
                    </button>
                    <button onClick={() => compartilharWhatsApp(conv)}
                      style={{ flex:1, background:'rgba(0,214,122,0.1)', border:'1px solid rgba(0,214,122,0.25)', color:T.green, padding:'9px', borderRadius:8, fontFamily:SYNE, fontWeight:700, fontSize:11, cursor:'pointer', textTransform:'uppercase' }}>
                      📲 WhatsApp
                    </button>
                    {conv.status === 'aberta' && (
                      <button onClick={() => { encerrarConvocacao(conv.id); carregar() }}
                        style={{ background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.2)', color:T.gold, padding:'9px 12px', borderRadius:8, fontFamily:SYNE, fontWeight:700, fontSize:11, cursor:'pointer' }}>
                        ✓ Encerrar
                      </button>
                    )}
                    <button onClick={() => { if(confirm('Excluir convocação?')) { excluirConvocacao(conv.id); carregar() } }}
                      style={{ background:'rgba(255,68,68,0.08)', border:'1px solid rgba(255,68,68,0.2)', color:T.red, padding:'9px 12px', borderRadius:8, fontFamily:SYNE, fontWeight:700, fontSize:11, cursor:'pointer' }}>
                      🗑
                    </button>
                  </div>

                  {/* Grid de figurinhas dos convocados */}
                  <div style={{ padding:14 }}>
                    <p style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:1, fontFamily:SYNE, marginBottom:10 }}>
                      Convocados · {convocados.length} atletas
                    </p>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:8 }}>
                      {convocados.map(a => <FigurinhaCard key={a.id} atleta={a} turmaMap={turmaMap} />)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
