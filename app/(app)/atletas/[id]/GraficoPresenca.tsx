'use client'

const T = { green:'#00D67A', gold:'#FFD700', red:'#FF4444', muted:'rgba(240,244,255,0.4)', faint:'rgba(240,244,255,0.25)', border:'rgba(240,244,255,0.08)' }

type Dado = { mes: string; presentes: number; total: number; percentual: number }

export default function GraficoPresenca({ dados }: { dados: Dado[] }) {
  const maxTotal = Math.max(...dados.map(d => d.total), 1)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {dados.map(d => {
        const cor = d.total === 0 ? T.border : d.percentual >= 75 ? T.green : d.percentual >= 50 ? T.gold : T.red
        return (
          <div key={d.mes}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
              <span style={{ fontSize:10, color:T.muted, width:50, flexShrink:0, textTransform:'lowercase' }}>{d.mes}</span>
              <div style={{ flex:1, background:'rgba(240,244,255,0.07)', borderRadius:4, height:18, overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:4, background:cor, width: d.total === 0 ? '0%' : `${(d.presentes / maxTotal) * 100}%`, transition:'width 0.4s ease' }} />
              </div>
              <div style={{ width:36, textAlign:'right', flexShrink:0 }}>
                {d.total === 0
                  ? <span style={{ fontSize:11, color:T.faint }}>—</span>
                  : <span style={{ fontSize:11, fontWeight:700, color:cor }}>{d.percentual}%</span>
                }
              </div>
            </div>
            {d.total > 0 && (
              <p style={{ fontSize:10, color:T.faint, paddingLeft:58, margin:0 }}>{d.presentes} de {d.total} treinos</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
