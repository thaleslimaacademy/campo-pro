'use client'
import { useEffect, useState } from 'react'
import { carregarFluxoPeriodo, getEscolaNome, type MesData } from './actions'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0)
const MESES_LABEL = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

type Periodo = 'mensal' | 'trimestral' | 'semestral' | 'anual'

function getPeriodoRange(tipo: Periodo, ano: number, ref: number): { inicio: string; fim: string; label: string } {
  switch (tipo) {
    case 'mensal': {
      const m = String(ref).padStart(2, '0')
      return { inicio: `${ano}-${m}`, fim: `${ano}-${m}`, label: `${MESES_LABEL[ref-1]}/${ano}` }
    }
    case 'trimestral': {
      const s = (ref - 1) * 3 + 1
      return {
        inicio: `${ano}-${String(s).padStart(2,'0')}`,
        fim: `${ano}-${String(s+2).padStart(2,'0')}`,
        label: `Q${ref}/${ano}`,
      }
    }
    case 'semestral': {
      return {
        inicio: `${ano}-${ref === 1 ? '01' : '07'}`,
        fim: `${ano}-${ref === 1 ? '06' : '12'}`,
        label: `${ref}º Semestre/${ano}`,
      }
    }
    case 'anual': {
      return { inicio: `${ano}-01`, fim: `${ano}-12`, label: `Ano ${ano}` }
    }
  }
}

const C = { bg: '#0F0F1A', surface: '#1A1A2E', orange: '#FF6B00', gold: '#FFD700', green: '#00C896', red: '#FF4B4B', muted: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.08)' }
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

export default function FluxoCaixaPage() {
  const anoAtual = new Date().getFullYear()
  const mesAtual = new Date().getMonth() + 1

  const [tipo, setTipo] = useState<Periodo>('mensal')
  const [ano, setAnos] = useState(anoAtual)
  const [ref, setRef] = useState(mesAtual)
  const [dados, setDados] = useState<MesData[]>([])
  const [loading, setLoading] = useState(false)
  const [nomeEscola, setNomeEscola] = useState('')

  useEffect(() => { getEscolaNome().then(setNomeEscola) }, [])

  useEffect(() => {
    const { inicio, fim } = getPeriodoRange(tipo, ano, ref)
    setLoading(true)
    carregarFluxoPeriodo(inicio, fim).then(setDados).finally(() => setLoading(false))
  }, [tipo, ano, ref])

  const totalEntradas = dados.reduce((s, d) => s + d.mensalidades + d.receitas, 0)
  const totalSaidas = dados.reduce((s, d) => s + d.despesas, 0)
  const saldoTotal = totalEntradas - totalSaidas

  const { label } = getPeriodoRange(tipo, ano, ref)

  const exportarPDF = async () => {
    // @ts-ignore
    const { default: jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    doc.setFillColor(15, 15, 26)
    doc.rect(0, 0, 210, 297, 'F')
    doc.setTextColor(255, 107, 0)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('RELATÓRIO DE FLUXO DE CAIXA', 105, 20, { align: 'center' })
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.text(nomeEscola, 105, 30, { align: 'center' })
    doc.setTextColor(180, 180, 180)
    doc.setFontSize(10)
    doc.text(`Período: ${label}`, 105, 38, { align: 'center' })
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 44, { align: 'center' })

    // Summary
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.text(`Total Entradas: ${brl(totalEntradas)}`, 20, 58)
    doc.text(`Total Saídas: ${brl(totalSaidas)}`, 20, 66)
    doc.setTextColor(saldoTotal >= 0 ? 0 : 255, saldoTotal >= 0 ? 200 : 0, saldoTotal >= 0 ? 150 : 0)
    doc.text(`Saldo: ${brl(saldoTotal)}`, 20, 74)

    autoTable(doc, {
      startY: 84,
      head: [['Mês', 'Mensalidades', 'Outras Receitas', 'Despesas', 'Saldo']],
      body: dados.map(d => [
        MESES_LABEL[Number(d.mes.split('-')[1]) - 1] + '/' + d.mes.split('-')[0],
        brl(d.mensalidades),
        brl(d.receitas),
        brl(d.despesas),
        brl(d.saldo),
      ]),
      foot: [['TOTAL', brl(dados.reduce((s,d)=>s+d.mensalidades,0)), brl(dados.reduce((s,d)=>s+d.receitas,0)), brl(totalSaidas), brl(saldoTotal)]],
      styles: { textColor: [240, 240, 240], fillColor: [26, 26, 46], fontSize: 9 },
      headStyles: { fillColor: [255, 107, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [40, 40, 70], textColor: [255, 215, 0], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [20, 20, 35] },
    })

    doc.save(`fluxo-caixa-${label.replace('/', '-')}.pdf`)
  }

  const refOptions = () => {
    if (tipo === 'mensal') return Array.from({length:12},(_,i)=>({ value: i+1, label: MESES_LABEL[i] }))
    if (tipo === 'trimestral') return [1,2,3,4].map(q => ({ value: q, label: `Q${q}` }))
    if (tipo === 'semestral') return [1,2].map(s => ({ value: s, label: `${s}º Semestre` }))
    return []
  }

  const anos = Array.from({length:5},(_,i)=>anoAtual-i)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: '#F0F0F0', fontFamily: INTER, padding: '0 0 80px' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <p style={{ color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Financeiro</p>
        <h1 style={{ fontFamily: SYNE, fontSize: 26, fontWeight: 800, color: C.orange, margin: 0 }}>Fluxo de Caixa</h1>
      </div>

      {/* Period Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 20px', overflowX: 'auto' }}>
        {(['mensal','trimestral','semestral','anual'] as Periodo[]).map(t => (
          <button key={t} onClick={() => { setTipo(t); setRef(t==='mensal'?mesAtual:1) }}
            style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: SYNE, fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', background: tipo===t ? C.orange : C.surface, color: tipo===t ? '#fff' : C.muted }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* Pickers */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px 16px', flexWrap: 'wrap' }}>
        <select value={ano} onChange={e => setAnos(Number(e.target.value))}
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: '#fff', padding: '8px 12px', borderRadius: 10, fontFamily: INTER, fontSize: 13 }}>
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {tipo !== 'anual' && (
          <select value={ref} onChange={e => setRef(Number(e.target.value))}
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: '#fff', padding: '8px 12px', borderRadius: 10, fontFamily: INTER, fontSize: 13 }}>
            {refOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
        <button onClick={exportarPDF}
          style={{ marginLeft: 'auto', padding: '8px 20px', background: C.gold, color: '#0F0F1A', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: SYNE, fontWeight: 700, fontSize: 12 }}>
          📄 Exportar PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '0 20px 20px' }}>
        {[
          { label: 'Entradas', valor: totalEntradas, color: C.green },
          { label: 'Saídas', valor: totalSaidas, color: C.red },
          { label: 'Saldo', valor: saldoTotal, color: saldoTotal >= 0 ? C.green : C.red },
        ].map(c => (
          <div key={c.label} style={{ background: C.surface, borderRadius: 14, padding: '14px 12px', border: `1px solid ${C.border}` }}>
            <p style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, margin: '0 0 6px', fontFamily: SYNE }}>{c.label}</p>
            <p style={{ color: c.color, fontFamily: SYNE, fontWeight: 800, fontSize: 14, margin: 0 }}>{brl(c.valor)}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ textAlign: 'center', color: C.muted, padding: 40 }}>Carregando...</p>
      ) : (
        <div style={{ padding: '0 20px' }}>
          <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'rgba(255,107,0,0.15)' }}>
                  {['Mês', 'Mensalidades', 'Outras Rec.', 'Despesas', 'Saldo'].map(h => (
                    <th key={h} style={{ padding: '12px 10px', textAlign: 'right', fontFamily: SYNE, fontWeight: 700, color: C.orange, fontSize: 11 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.map((d, i) => (
                  <tr key={d.mes} style={{ borderTop: `1px solid ${C.border}`, background: i%2===0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '10px', color: '#fff', fontFamily: SYNE, fontWeight: 600 }}>
                      {MESES_LABEL[Number(d.mes.split('-')[1])-1]}/{d.mes.split('-')[0]}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: C.green }}>{brl(d.mensalidades)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: C.green }}>{brl(d.receitas)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: C.red }}>{brl(d.despesas)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: d.saldo >= 0 ? C.green : C.red, fontWeight: 700 }}>{brl(d.saldo)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${C.orange}`, background: 'rgba(255,107,0,0.08)' }}>
                  <td style={{ padding: '10px', fontFamily: SYNE, fontWeight: 800, color: C.orange }}>TOTAL</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: C.green, fontWeight: 700 }}>{brl(dados.reduce((s,d)=>s+d.mensalidades,0))}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: C.green, fontWeight: 700 }}>{brl(dados.reduce((s,d)=>s+d.receitas,0))}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: C.red, fontWeight: 700 }}>{brl(totalSaidas)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: saldoTotal>=0?C.green:C.red, fontWeight: 800, fontFamily: SYNE }}>{brl(saldoTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}