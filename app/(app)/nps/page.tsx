
'use client'
import { useEffect, useState } from 'react'

const C = { bg:'#0A0E1A', card:'#141418', border:'#1E1E24', blue:'#4169E1',
  cyan:'#00BFFF', sky:'#7DD3FC', green:'#4ADE80', red:'#FF6B6B', yellow:'#FBBF24', muted:'#6B7280' }

export default function NPSPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/nps/stats').then(r => r.json()).then(setData)
  }, [])

  const mesLabel = (mes: string) => {
    const [ano, m] = mes.split('-')
    return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(m)-1]+'/'+ano.slice(2)
  }

  if (!data) return (
    <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:C.muted }}>Carregando...</p>
    </div>
  )

  const maxMedia = data.grafico?.length ? Math.max(...data.grafico.map((g: any) => g.media), 1) : 10

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:'#fff', paddingBottom:80 }}>
      <div style={{ background:`linear-gradient(135deg,${C.blue},#2D4FC8)`, padding:'20px 16px 24px' }}>
        <p style={{ fontSize:10, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:2, marginBottom:4 }}>Satisfação</p>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:900, margin:0, letterSpacing:-1 }}>NPS da Academia</h1>
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          {[
            { label:'NPS Score', value:(data.npsScore>=0?'+':'')+data.npsScore, color:data.npsScore>=50?C.green:data.npsScore>=0?C.yellow:C.red },
            { label:'Nota Média', value:data.media, color:C.cyan },
            { label:'Respostas', value:data.total, color:C.sky },
            { label:'Pendentes', value:data.pendentes, color:C.yellow },
          ].map((s,i) => (
            <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontSize:9, color:C.sky, textTransform:'uppercase', letterSpacing:1, marginBottom:6, opacity:0.7 }}>{s.label}</div>
              <div style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:900, color:s.color, letterSpacing:-1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
          <p style={{ fontSize:10, color:C.sky, textTransform:'uppercase', letterSpacing:1, marginBottom:12, opacity:0.7 }}>Distribuição</p>
          <div style={{ display:'flex', gap:8 }}>
            {[
              { label:'Promotores', value:data.promotores, color:C.green },
              { label:'Neutros', value:data.neutros, color:C.yellow },
              { label:'Detratores', value:data.detratores, color:C.red },
            ].map((item,i) => (
              <div key={i} style={{ flex:1, background:item.color+'11', border:`1px solid ${item.color}33`, borderRadius:10, padding:'10px 8px', textAlign:'center' }}>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:900, color:item.color }}>{item.value}</div>
                <div style={{ fontSize:10, color:item.color, opacity:0.8, marginTop:2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {data.grafico?.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
            <p style={{ fontSize:10, color:C.sky, textTransform:'uppercase', letterSpacing:1, marginBottom:16, opacity:0.7 }}>Evolução Mensal</p>
            <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:100 }}>
              {data.grafico.map((g: any, i: number) => {
                const h = Math.max((g.media/maxMedia)*80, 4)
                const cor = g.media>=9?C.green:g.media>=7?C.yellow:C.red
                return (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <span style={{ fontSize:9, color:cor, fontWeight:700 }}>{g.media}</span>
                    <div style={{ width:'100%', height:h, background:cor, borderRadius:'4px 4px 0 0', opacity:0.85 }} />
                    <span style={{ fontSize:8, color:C.muted, textAlign:'center' }}>{mesLabel(g.mes)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {data.detratoresList?.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${C.red}`, borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
            <p style={{ fontSize:10, color:C.red, textTransform:'uppercase', letterSpacing:1, marginBottom:12, fontWeight:700 }}>⚠️ Detratores — Ação necessária</p>
            {data.detratoresList.map((d: any, i: number) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:i<data.detratoresList.length-1?`1px solid ${C.border}`:'none' }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, margin:0 }}>{d.nomeAtleta}</p>
                  <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{d.nomeResponsavel}</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:900, color:C.red }}>{d.nota}</span>
                  <a href={`https://wa.me/55${(d.whatsapp||'').replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                    style={{ background:'#25D366', borderRadius:8, padding:'6px 10px', fontSize:11, color:'#fff', fontWeight:700, textDecoration:'none' }}>
                    💬
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.total === 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, textAlign:'center' }}>
            <p style={{ fontSize:32, marginBottom:8 }}>📊</p>
            <p style={{ color:C.muted, fontSize:14 }}>Nenhuma resposta ainda. Configure o prazo em Configurações.</p>
          </div>
        )}
      </div>
    </div>
  )
}
