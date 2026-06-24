
'use client'
import { useRef, useEffect, useState, useCallback } from 'react'

const CAMPO_W = 600
const CAMPO_H = 400

type TipoEl = 'jogador_azul' | 'jogador_vermelho' | 'goleiro' | 'cone' | 'bola' | 'seta' | 'texto'
interface El { id: string; tipo: TipoEl; x: number; y: number; x2?: number; y2?: number; texto?: string; label?: string }

const TOOLS = [
  { id: 'mover',           label: 'Mover',    emoji: '✋' },
  { id: 'jogador_azul',    label: 'J.Azul',   emoji: '🔵' },
  { id: 'jogador_vermelho',label: 'J.Verm',   emoji: '🔴' },
  { id: 'goleiro',         label: 'Goleiro',  emoji: '🟡' },
  { id: 'cone',            label: 'Cone',     emoji: '🔶' },
  { id: 'bola',            label: 'Bola',     emoji: '⚽' },
  { id: 'seta',            label: 'Seta',     emoji: '➡️' },
  { id: 'texto',           label: 'Texto',    emoji: '🔤' },
  { id: 'borracha',        label: 'Apagar',   emoji: '🗑️' },
]

function desenharCampo(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#1a5c1a'; ctx.fillRect(0, 0, CAMPO_W, CAMPO_H)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5
  ctx.strokeRect(20, 15, CAMPO_W - 40, CAMPO_H - 30)
  ctx.beginPath(); ctx.moveTo(CAMPO_W/2, 15); ctx.lineTo(CAMPO_W/2, CAMPO_H-15); ctx.stroke()
  ctx.beginPath(); ctx.arc(CAMPO_W/2, CAMPO_H/2, 50, 0, Math.PI*2); ctx.stroke()
  ctx.strokeRect(20, CAMPO_H/2-70, 80, 140)
  ctx.strokeRect(CAMPO_W-100, CAMPO_H/2-70, 80, 140)
  ctx.strokeRect(20, CAMPO_H/2-35, 35, 70)
  ctx.strokeRect(CAMPO_W-55, CAMPO_H/2-35, 35, 70)
}

function desenharEl(ctx: CanvasRenderingContext2D, el: El, sel = false) {
  ctx.save()
  if (sel) { ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 14 }
  if (el.tipo === 'seta' && el.x2 !== undefined && el.y2 !== undefined) {
    const angle = Math.atan2(el.y2 - el.y, el.x2 - el.x)
    const len = Math.sqrt((el.x2-el.x)**2 + (el.y2-el.y)**2)
    if (len > 5) {
      ctx.beginPath(); ctx.moveTo(el.x, el.y); ctx.lineTo(el.x2, el.y2)
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2.5; ctx.stroke()
      ctx.beginPath(); ctx.moveTo(el.x2, el.y2)
      ctx.lineTo(el.x2-12*Math.cos(angle-0.4), el.y2-12*Math.sin(angle-0.4))
      ctx.lineTo(el.x2-12*Math.cos(angle+0.4), el.y2-12*Math.sin(angle+0.4))
      ctx.closePath(); ctx.fillStyle = '#FFD700'; ctx.fill()
    }
    ctx.restore(); return
  }
  if (el.tipo === 'texto') {
    ctx.font = 'bold 13px Inter,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText(el.texto||'Texto', el.x, el.y)
    ctx.fillStyle = '#fff'; ctx.fillText(el.texto||'Texto', el.x, el.y)
    ctx.restore(); return
  }
  const CORES: Record<string,string> = { jogador_azul:'#4169E1', jogador_vermelho:'#EF4444', goleiro:'#FBBF24', cone:'#F97316', bola:'#ffffff' }
  const r = el.tipo==='cone'?8:el.tipo==='bola'?9:13
  ctx.beginPath(); ctx.arc(el.x, el.y, r, 0, Math.PI*2)
  ctx.fillStyle = CORES[el.tipo]||'#fff'; ctx.fill()
  ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=1.5; ctx.stroke()
  if (el.label) {
    ctx.font='bold 9px Inter,sans-serif'; ctx.fillStyle='#fff'
    ctx.textAlign='center'; ctx.textBaseline='middle'
    ctx.fillText(el.label, el.x, el.y)
  }
  ctx.restore()
}

export default function EditorDiagrama({ exercicioId, onFechar }: { exercicioId: string; onFechar: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [els, setEls] = useState<El[]>([])
  const [tool, setTool] = useState<string>('mover')
  const [sel, setSel] = useState<string|null>(null)
  const [drag, setDrag] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setaIni, setSetaIni] = useState<{x:number;y:number}|null>(null)
  const [setaTmp, setSetaTmp] = useState<{x:number;y:number}|null>(null)
  const contador = useRef(1)
  const offset = useRef({x:0,y:0})

  useEffect(() => {
    fetch(`/api/diagrama?exercicioId=${exercicioId}`).then(r=>r.json()).then(d=>{ if(d.elementos) setEls(d.elementos); setLoading(false) }).catch(()=>setLoading(false))
  }, [exercicioId])

  useEffect(() => {
    const canvas = canvasRef.current; if(!canvas) return
    const ctx = canvas.getContext('2d'); if(!ctx) return
    ctx.clearRect(0,0,CAMPO_W,CAMPO_H)
    desenharCampo(ctx)
    els.forEach(el => desenharEl(ctx, el, el.id===sel))
    if (setaIni && setaTmp) {
      ctx.save(); ctx.setLineDash([5,5])
      ctx.beginPath(); ctx.moveTo(setaIni.x,setaIni.y); ctx.lineTo(setaTmp.x,setaTmp.y)
      ctx.strokeStyle='#FFD70088'; ctx.lineWidth=2; ctx.stroke(); ctx.restore()
    }
  }, [els, sel, setaIni, setaTmp])

  function getPos(e: React.MouseEvent|React.TouchEvent) {
    const canvas = canvasRef.current; if(!canvas) return {x:0,y:0}
    const rect = canvas.getBoundingClientRect()
    const s = rect.width/CAMPO_W
    let cx=0,cy=0
    if('touches' in e) { cx=e.touches[0].clientX-rect.left; cy=e.touches[0].clientY-rect.top }
    else { cx=(e as React.MouseEvent).clientX-rect.left; cy=(e as React.MouseEvent).clientY-rect.top }
    return {x:cx/s, y:cy/s}
  }

  function hit(x:number,y:number): El|null {
    for(let i=els.length-1;i>=0;i--){
      const el=els[i]
      if(el.tipo==='seta'&&el.x2!==undefined&&el.y2!==undefined){
        const dx=el.x2-el.x,dy=el.y2-el.y,len=Math.sqrt(dx*dx+dy*dy)
        if(len===0) continue
        const t=Math.max(0,Math.min(1,((x-el.x)*dx+(y-el.y)*dy)/(len*len)))
        if(Math.sqrt((x-el.x-t*dx)**2+(y-el.y-t*dy)**2)<14) return el
      } else if(el.tipo==='texto'){
        if(Math.abs(x-el.x)<70&&Math.abs(y-el.y)<18) return el
      } else {
        if(Math.sqrt((x-el.x)**2+(y-el.y)**2)<18) return el
      }
    }
    return null
  }

  function onDown(e: React.MouseEvent|React.TouchEvent) {
    e.preventDefault()
    const {x,y}=getPos(e)
    if(tool==='borracha'){const h=hit(x,y);if(h)setEls(prev=>prev.filter(el=>el.id!==h.id));return}
    if(tool==='mover'){const h=hit(x,y);if(h){setSel(h.id);setDrag(true);offset.current={x:x-h.x,y:y-h.y}}else setSel(null);return}
    if(tool==='seta'){setSetaIni({x,y});return}
    if(tool==='texto'){const t=prompt('Digite o texto:');if(!t)return;setEls(prev=>[...prev,{id:crypto.randomUUID(),tipo:'texto',x,y,texto:t}]);return}
    const label=['jogador_azul','jogador_vermelho','goleiro'].includes(tool)?String(contador.current++):undefined
    setEls(prev=>[...prev,{id:crypto.randomUUID(),tipo:tool as TipoEl,x,y,label}])
  }

  function onMove(e: React.MouseEvent|React.TouchEvent) {
    e.preventDefault()
    const {x,y}=getPos(e)
    if(tool==='seta'&&setaIni){setSetaTmp({x,y});return}
    if(!drag||!sel) return
    setEls(prev=>prev.map(el=>{
      if(el.id!==sel) return el
      if(el.tipo==='seta'&&el.x2!==undefined&&el.y2!==undefined){
        const dx=el.x2-el.x,dy=el.y2-el.y
        return{...el,x:x-offset.current.x,y:y-offset.current.y,x2:x-offset.current.x+dx,y2:y-offset.current.y+dy}
      }
      return{...el,x:x-offset.current.x,y:y-offset.current.y}
    }))
  }

  function onUp(e: React.MouseEvent|React.TouchEvent) {
    e.preventDefault()
    if(tool==='seta'&&setaIni){
      const {x,y}=getPos(e)
      if(Math.sqrt((x-setaIni.x)**2+(y-setaIni.y)**2)>10)
        setEls(prev=>[...prev,{id:crypto.randomUUID(),tipo:'seta',x:setaIni.x,y:setaIni.y,x2:x,y2:y}])
      setSetaIni(null);setSetaTmp(null);return
    }
    setDrag(false)
  }

  async function salvar(){
    setSalvando(true)
    await fetch('/api/diagrama',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({exercicioId,elementos:els})})
    setSalvando(false)
    alert('Diagrama salvo!')
  }

  const C={bg:'#0A0E1A',card:'#141418',border:'#1E1E24',blue:'#4169E1',cyan:'#00BFFF'}

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.94)',zIndex:1000,display:'flex',flexDirection:'column'}}>
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:'12px 16px',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
        <button onClick={onFechar} style={{background:'rgba(255,255,255,0.1)',border:'none',borderRadius:8,width:36,height:36,color:'#fff',cursor:'pointer',fontSize:18}}>←</button>
        <div style={{flex:1}}>
          <p style={{margin:0,fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#fff',textTransform:'uppercase'}}>Editor de Diagrama</p>
          <p style={{margin:0,fontSize:11,color:C.cyan}}>Toque para adicionar • Arraste para mover</p>
        </div>
        <button onClick={()=>{if(confirm('Limpar tudo?')){setEls([]);contador.current=1}}} style={{background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,padding:'6px 10px',color:'#EF4444',fontSize:11,cursor:'pointer',fontWeight:700}}>🗑 Limpar</button>
        <button onClick={salvar} disabled={salvando} style={{background:C.blue,border:'none',borderRadius:8,padding:'6px 14px',color:'#fff',fontSize:12,cursor:'pointer',fontWeight:700}}>
          {salvando?'Salvando...':'💾 Salvar'}
        </button>
      </div>

      <div style={{background:C.bg,borderBottom:`1px solid ${C.border}`,padding:'8px 12px',display:'flex',gap:6,overflowX:'auto',flexShrink:0,scrollbarWidth:'none'}}>
        {TOOLS.map(t=>(
          <button key={t.id} onClick={()=>setTool(t.id)}
            style={{flexShrink:0,background:tool===t.id?C.blue:'rgba(255,255,255,0.06)',border:tool===t.id?'none':`1px solid ${C.border}`,borderRadius:10,padding:'6px 10px',color:'#fff',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,minWidth:50}}>
            <span style={{fontSize:18}}>{t.emoji}</span>
            <span style={{fontSize:9,opacity:0.8}}>{t.label}</span>
          </button>
        ))}
      </div>

      <div style={{flex:1,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',padding:8,background:C.bg}}>
        {loading ? <p style={{color:'#6B7280'}}>Carregando...</p> : (
          <canvas ref={canvasRef} width={CAMPO_W} height={CAMPO_H}
            style={{width:'100%',maxWidth:700,borderRadius:12,touchAction:'none',cursor:tool==='mover'?'grab':tool==='borracha'?'cell':'crosshair'}}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          />
        )}
      </div>

      <div style={{background:C.card,borderTop:`1px solid ${C.border}`,padding:'8px 16px',flexShrink:0}}>
        <p style={{margin:0,fontSize:10,color:'#6B7280',textAlign:'center'}}>
          {tool==='mover'?'Clique para selecionar, arraste para mover':
           tool==='seta'?'Clique e arraste para desenhar seta':
           tool==='borracha'?'Clique num elemento para apagar':
           tool==='texto'?'Clique no campo para adicionar texto':
           'Clique no campo para adicionar elemento'}
        </p>
      </div>
    </div>
  )
}
