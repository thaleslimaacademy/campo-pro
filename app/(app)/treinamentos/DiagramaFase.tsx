
'use client'
import { useRef, useEffect } from 'react'

const W = 600, H = 400
interface Pos { x: number; y: number; label?: string }
interface Seta { x1: number; y1: number; x2: number; y2: number }
interface DiagramaData {
  jogadores_azuis?: Pos[]; jogadores_vermelhos?: Pos[]
  goleiros?: Pos[]; cones?: Pos[]; bolas?: Pos[]; setas?: Seta[]
}

function campo(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#1a5c1a'; ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5
  ctx.strokeRect(20, 15, W-40, H-30)
  ctx.beginPath(); ctx.moveTo(W/2,15); ctx.lineTo(W/2,H-15); ctx.stroke()
  ctx.beginPath(); ctx.arc(W/2,H/2,50,0,Math.PI*2); ctx.stroke()
  ctx.strokeRect(20,H/2-70,80,140); ctx.strokeRect(W-100,H/2-70,80,140)
  ctx.strokeRect(20,H/2-35,35,70); ctx.strokeRect(W-55,H/2-35,35,70)
}

function circ(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, label?: string) {
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2)
  ctx.fillStyle=fill; ctx.fill()
  ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=1.5; ctx.stroke()
  if(label){ctx.font='bold 9px Inter,sans-serif';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x,y)}
}

export default function DiagramaFase({ dados }: { dados: DiagramaData }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if(!c) return
    const ctx = c.getContext('2d'); if(!ctx) return
    ctx.clearRect(0,0,W,H); campo(ctx)
    ;(dados.setas||[]).forEach(s=>{
      const ang=Math.atan2(s.y2-s.y1,s.x2-s.x1)
      const len=Math.sqrt((s.x2-s.x1)**2+(s.y2-s.y1)**2)
      if(len<5) return
      ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2)
      ctx.strokeStyle='#FFD700';ctx.lineWidth=2;ctx.stroke()
      ctx.beginPath();ctx.moveTo(s.x2,s.y2)
      ctx.lineTo(s.x2-10*Math.cos(ang-0.4),s.y2-10*Math.sin(ang-0.4))
      ctx.lineTo(s.x2-10*Math.cos(ang+0.4),s.y2-10*Math.sin(ang+0.4))
      ctx.closePath();ctx.fillStyle='#FFD700';ctx.fill()
    })
    ;(dados.cones||[]).forEach(p=>circ(ctx,p.x,p.y,7,'#F97316'))
    ;(dados.bolas||[]).forEach(p=>circ(ctx,p.x,p.y,9,'#ffffff'))
    ;(dados.goleiros||[]).forEach(p=>circ(ctx,p.x,p.y,13,'#FBBF24',p.label))
    ;(dados.jogadores_azuis||[]).forEach(p=>circ(ctx,p.x,p.y,13,'#4169E1',p.label))
    ;(dados.jogadores_vermelhos||[]).forEach(p=>circ(ctx,p.x,p.y,13,'#EF4444',p.label))
  }, [dados])
  return <canvas ref={ref} width={W} height={H} style={{width:'100%',borderRadius:10,display:'block'}} />
}
