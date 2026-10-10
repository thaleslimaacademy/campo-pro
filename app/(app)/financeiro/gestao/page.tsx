'use client'
import { useCallback, useEffect, useState } from 'react'
import BottomNav from '@/components/ui/BottomNav'
import {
  carregarGestao, lancarEntrada, lancarDespesaVariavel, criarDespesaFixa, encerrarDespesaFixa,
  marcarDespesaPaga, lancarCompraCartao, salvarCartao, receberPatrocinio, excluirLancamento, diasSemLancarDespesa,
} from './actions'

type Dados = Awaited<ReturnType<typeof carregarGestao>>
type Aba = 'geral' | 'entradas' | 'fixas' | 'variaveis' | 'cartao' | 'relatorio'
type Form = 'entrada' | 'fixa' | 'variavel' | 'cartao' | null

const C = { bg: '#F6F8F7', text: '#1F2937', muted: '#6B7280', line: '#E7ECE9', green: '#2EA866', orange: '#E8743B', blue: '#4169E1', gold: '#B7791F' }
const SYNE = 'Syne, sans-serif'
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const brl = (v: number) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const brl0 = (v: number) => 'R$ ' + Math.round(Number(v || 0)).toLocaleString('pt-BR')
const hojeISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
const dataBR = (d: string) => String(d).slice(0, 10).split('-').reverse().join('/')
function somaMes(mes: string, n: number) {
  const [a, m] = mes.split('-').map(Number); const d = new Date(a, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const card: React.CSSProperties = { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 16, padding: 16 }
const titulo: React.CSSProperties = { fontFamily: SYNE, fontWeight: 800, fontSize: 15, margin: 0, color: C.text }
const sub: React.CSSProperties = { fontSize: 12, color: C.muted, margin: '2px 0 10px' }
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: `1px solid ${C.line}`, fontSize: 13.5 }
const pill = (bg: string, cor: string): React.CSSProperties => ({ whiteSpace: 'nowrap', fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '3px 9px', background: bg, color: cor })
const amt: React.CSSProperties = { marginLeft: 'auto', fontWeight: 800, whiteSpace: 'nowrap' }
const xBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 13, padding: 2 }

// ── Graficos (SVG puro, com dica ao tocar) ──────────────────────────────
function Tip({ t }: { t: { x: number; y: number; h: string } | null }) {
  if (!t) return null
  return <div style={{ position: 'fixed', left: t.x + 12, top: t.y - 10, background: '#111827', color: '#fff', fontSize: 12, padding: '7px 9px', borderRadius: 8, pointerEvents: 'none', zIndex: 50, whiteSpace: 'pre-line' }}>{t.h}</div>
}

function GraficoBarras({ serie }: { serie: Dados['serie'] }) {
  const [tip, setTip] = useState<{ x: number; y: number; h: string } | null>(null)
  const W = 560, H = 240, L = 48, B = 28, T = 14
  const maxV = Math.max(500, ...serie.map(s => Math.max(s.entradas, s.saidas)))
  const passo = maxV <= 1000 ? 250 : maxV <= 3000 ? 500 : maxV <= 8000 ? 1000 : 2500
  const max = Math.ceil(maxV / passo) * passo
  const y = (v: number) => T + (H - T - B) * (1 - Math.max(0, v) / max)
  const step = (W - L - 10) / serie.length, bw = Math.min(24, step / 3)
  const ticks = Array.from({ length: Math.floor(max / passo) + 1 }, (_, i) => i * passo)
  const pts = serie.map((s, i) => [L + step * i + step / 2, y(s.entradas - s.saidas)] as const)
  const barra = (x: number, v: number, cor: string) => v > 0
    ? <path d={`M${x},${y(0)} V${y(v) + 4} q0,-4 4,-4 h${bw - 8} q4,0 4,4 V${y(0)} Z`} fill={cor} />
    : null
  const ult = serie[serie.length - 1]
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Entradas e saídas por mês">
        {ticks.map(v => (
          <g key={v}>
            <line x1={L} x2={W - 6} y1={y(v)} y2={y(v)} stroke="#EEF1EF" />
            <text x={L - 8} y={y(v) + 4} fontSize="10" fill="#9CA3AF" textAnchor="end">{v >= 1000 ? `${v / 1000}k` : v}</text>
          </g>
        ))}
        {serie.map((s, i) => {
          const cx = L + step * i + step / 2
          return (
            <g key={s.mes}>
              {barra(cx - bw - 1, s.entradas, C.green)}
              {barra(cx + 1, s.saidas, C.orange)}
              <text x={cx} y={H - 10} fontSize="11" fill={C.muted} textAnchor="middle">{s.rotulo}</text>
              <rect x={cx - step / 2} y={T} width={step} height={H - T - B} fill="transparent" style={{ cursor: 'pointer' }}
                onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, h: `${s.rotulo}\nEntradas: ${brl(s.entradas)}\nSaídas: ${brl(s.saidas)}\nSaldo: ${brl(s.entradas - s.saidas)}` })}
                onTouchStart={e => setTip({ x: e.touches[0].clientX, y: e.touches[0].clientY, h: `${s.rotulo}\nEntradas: ${brl(s.entradas)}\nSaídas: ${brl(s.saidas)}\nSaldo: ${brl(s.entradas - s.saidas)}` })}
                onMouseLeave={() => setTip(null)} />
            </g>
          )
        })}
        <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={C.text} strokeWidth="2" pointerEvents="none" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="4" fill={C.text} stroke="#fff" strokeWidth="2" pointerEvents="none" />)}
        {ult && <text x={pts[pts.length - 1][0]} y={pts[pts.length - 1][1] + 20} fontSize="11" fontWeight="700" fill={C.text} textAnchor="middle">{(ult.entradas - ult.saidas >= 0 ? '+' : '') + brl0(ult.entradas - ult.saidas)}</text>}
      </svg>
      <Tip t={tip} />
    </>
  )
}

function Rosca({ partes }: { partes: { nome: string; valor: number; cor: string }[] }) {
  const [tip, setTip] = useState<{ x: number; y: number; h: string } | null>(null)
  const tot = partes.reduce((s, p) => s + p.valor, 0)
  const cx = 120, cy = 100, R = 78, r = 50
  let a0 = -Math.PI / 2
  const ativos = partes.filter(p => p.valor > 0)
  return (
    <>
      <svg viewBox="0 0 240 200" width="100%" style={{ maxWidth: 260, display: 'block', margin: '0 auto' }} role="img" aria-label="Saídas por tipo">
        {tot === 0 ? <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke="#EEF1EF" strokeWidth={R - r} /> : ativos.map(p => {
          const gap = ativos.length > 1 ? 0.03 : 0
          const a1 = a0 + 2 * Math.PI * p.valor / tot - gap, lg = a1 - a0 > Math.PI ? 1 : 0
          const pt = (a: number, rr: number) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]
          const full = ativos.length === 1
          const d = full
            ? `M${cx},${cy - R} A${R},${R} 0 1 1 ${cx - 0.01},${cy - R} L${cx - 0.01},${cy - r} A${r},${r} 0 1 0 ${cx},${cy - r} Z`
            : (() => { const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R), [x2, y2] = pt(a1, r), [x3, y3] = pt(a0, r); return `M${x0},${y0} A${R},${R} 0 ${lg} 1 ${x1},${y1} L${x2},${y2} A${r},${r} 0 ${lg} 0 ${x3},${y3} Z` })()
          a0 = a1 + gap
          return <path key={p.nome} d={d} fill={p.cor} style={{ cursor: 'pointer' }}
            onMouseMove={e => setTip({ x: e.clientX, y: e.clientY, h: `${p.nome}\n${brl(p.valor)} · ${Math.round(p.valor / tot * 100)}%` })} onMouseLeave={() => setTip(null)} />
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="17" fontWeight="800" fill={C.text}>{brl0(tot)}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="10.5" fill={C.muted}>total de saídas</text>
      </svg>
      <div style={{ marginTop: 8 }}>
        {partes.map(p => (
          <div key={p.nome} style={row}>
            <i style={{ width: 10, height: 10, borderRadius: 3, background: p.cor, display: 'inline-block' }} />{p.nome}
            <span style={amt}>{brl(p.valor)} <span style={{ color: C.muted, fontWeight: 600 }}>· {tot ? Math.round(p.valor / tot * 100) : 0}%</span></span>
          </div>
        ))}
      </div>
      <Tip t={tip} />
    </>
  )
}

// ── Formulario de lancamento ─────────────────────────────────────────────
function Lancar({ tipo, onFechar, onSalvo, mes }: { tipo: Exclude<Form, null>; onFechar: () => void; onSalvo: () => void; mes: string }) {
  const hoje = hojeISO()
  const dataPadrao = hoje.slice(0, 7) === mes ? hoje : `${mes}-01`
  const [f, setF] = useState({ descricao: '', valor: '', data: dataPadrao, categoria: '', dia: '5', parcelas: '1' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const set = (k: string, v: string) => setF(x => ({ ...x, [k]: v }))
  const nomes = { entrada: '+ Entrada', fixa: '+ Despesa fixa', variavel: '+ Despesa variável', cartao: '+ Compra no cartão' }
  const dicas = {
    entrada: 'Dinheiro que entrou por fora: evento, rifa, doação… (mensalidades, loja e patrocínios já entram sozinhos)',
    fixa: 'Cadastre uma vez: ela se repete todo mês e aparece como "a pagar" até você marcar como paga.',
    variavel: 'Gasto que muda de mês para mês.',
    cartao: 'Parcelada? Cada parcela cai na fatura do seu mês.',
  }
  async function salvar() {
    setErro(''); setSalvando(true)
    const valor = Number(String(f.valor).replace(/\./g, '').replace(',', '.'))
    let r
    if (tipo === 'entrada') r = await lancarEntrada({ valor, descricao: f.descricao, categoria: f.categoria || 'OUTRA', data: f.data })
    else if (tipo === 'variavel') r = await lancarDespesaVariavel({ valor, descricao: f.descricao, categoria: f.categoria, data: f.data })
    else if (tipo === 'fixa') r = await criarDespesaFixa({ valor, descricao: f.descricao, categoria: f.categoria, diaVencimento: Number(f.dia) })
    else r = await lancarCompraCartao({ valor, descricao: f.descricao, data: f.data, parcelas: Number(f.parcelas) })
    setSalvando(false)
    if (!r.ok) { setErro(r.erro); return }
    onSalvo()
  }
  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${C.line}`, borderRadius: 10, padding: '11px 12px', fontSize: 14, marginTop: 4, fontFamily: 'Inter, sans-serif' }
  const lab: React.CSSProperties = { fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginTop: 10 }
  return (
    <div onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.45)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 480, borderRadius: '18px 18px 0 0', padding: 18, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ ...titulo, fontSize: 17 }}>{nomes[tipo]}</p>
          <button onClick={onFechar} style={xBtn}>✕</button>
        </div>
        <p style={{ ...sub, marginBottom: 0 }}>{dicas[tipo]}</p>
        <label style={lab}>Descrição</label>
        <input style={inp} value={f.descricao} onChange={e => set('descricao', e.target.value)} placeholder={tipo === 'fixa' ? 'Ex.: Aluguel do campo' : tipo === 'cartao' ? 'Ex.: Bolas de treino' : tipo === 'entrada' ? 'Ex.: Rifa do campeonato' : 'Ex.: Inscrição em campeonato'} />
        <label style={lab}>{tipo === 'cartao' ? 'Valor total da compra (R$)' : 'Valor (R$)'}</label>
        <input style={inp} inputMode="decimal" value={f.valor} onChange={e => set('valor', e.target.value)} placeholder="0,00" />
        {tipo === 'fixa' ? (
          <>
            <label style={lab}>Vence todo dia</label>
            <select style={inp} value={f.dia} onChange={e => set('dia', e.target.value)}>{Array.from({ length: 28 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select>
          </>
        ) : (
          <>
            <label style={lab}>{tipo === 'cartao' ? 'Data da compra' : 'Data'}</label>
            <input style={inp} type="date" value={f.data} onChange={e => set('data', e.target.value)} />
          </>
        )}
        {tipo === 'cartao' && (
          <>
            <label style={lab}>Parcelas</label>
            <select style={inp} value={f.parcelas} onChange={e => set('parcelas', e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}</select>
          </>
        )}
        {(tipo === 'fixa' || tipo === 'variavel') && (
          <>
            <label style={lab}>Categoria (opcional)</label>
            <select style={inp} value={f.categoria} onChange={e => set('categoria', e.target.value)}>
              <option value="">—</option>
              {['Campo / espaço', 'Professores / equipe', 'Material esportivo', 'Uniformes', 'Campeonatos', 'Transporte', 'Alimentação', 'Contas (luz, internet)', 'Impostos / contador', 'Marketing', 'Outros'].map(c => <option key={c}>{c}</option>)}
            </select>
          </>
        )}
        {erro && <p style={{ color: '#DC2626', fontSize: 13, margin: '10px 0 0' }}>{erro}</p>}
        <button onClick={salvar} disabled={salvando} style={{ marginTop: 16, width: '100%', background: tipo === 'entrada' ? C.green : C.text, color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontFamily: SYNE, fontWeight: 800, fontSize: 15, cursor: 'pointer', opacity: salvando ? 0.6 : 1 }}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────
export default function GestaoFinanceira() {
  const [mes, setMes] = useState(() => hojeISO().slice(0, 7))
  const [d, setD] = useState<Dados | null>(null)
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState<Aba>('geral')
  const [form, setForm] = useState<Form>(null)
  const [menu, setMenu] = useState(false)
  const [diasSem, setDiasSem] = useState<number | null>(null)

  const carregar = useCallback(async () => {
    setErro('')
    try { setD(await carregarGestao(mes)) } catch (e) { setErro((e as Error).message) }
  }, [mes])
  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { diasSemLancarDespesa().then(setDiasSem).catch(() => {}) }, [form])

  async function acao(p: Promise<{ ok: boolean; erro?: string }>) {
    const r = await p
    if (!r.ok) alert(r.erro); else carregar()
  }

  const [ano, mm] = mes.split('-').map(Number)
  const k = d?.kpis
  const totSaida = d ? d.porTipo.fixa + d.porTipo.variavel + d.porTipo.cartao : 0
  const totEnt = d ? d.origens.mensalidades + d.origens.patrocinios + d.origens.loja + d.origens.outras : 0
  const tabs: [Aba, string][] = [['geral', 'Visão geral'], ['entradas', 'Entradas'], ['fixas', 'Despesas fixas'], ['variaveis', 'Despesas variáveis'], ['cartao', 'Cartão de crédito'], ['relatorio', 'Relatório']]
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12, marginTop: 12 }

  const BlocoFixas = d && (
    <div style={card}>
      <p style={titulo}>Despesas fixas do mês</p><p style={sub}>Cadastradas uma vez — se repetem todo mês sozinhas. Toque no status para marcar.</p>
      {d.fixasMes.length === 0 && <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', margin: 8 }}>Nenhuma despesa fixa. Use <b>+ Despesa fixa</b>.</p>}
      {d.fixasMes.map(x => (
        <div key={x.id} style={row}>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.descricao} <span style={{ color: C.muted, fontSize: 12 }}>· vence {String(x.data).slice(8, 10)}</span></span>
          <button onClick={() => acao(marcarDespesaPaga(x.id, !x.pago))} style={{ ...pill(x.pago ? '#E7F5ED' : '#FEF3C7', x.pago ? '#15803D' : '#92400E'), border: 'none', cursor: 'pointer' }}>{x.pago ? '✓ pago' : 'a pagar'}</button>
          <span style={{ ...amt, color: '#C2410C' }}>{brl(x.valor)}</span>
        </div>
      ))}
    </div>
  )
  const BlocoCartao = d && (
    <div style={card}>
      <p style={titulo}>💳 Cartão de crédito</p>
      <p style={sub}>Fatura de {MESES[mm - 1].toLowerCase()}{d.cartao.fechamento ? ` · fecha dia ${d.cartao.fechamento}` : ''}{d.cartao.vencimento ? ` · vence dia ${d.cartao.vencimento}` : ''}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
        <span>Usado <b>{brl(d.cartao.usado)}</b></span>
        <span style={{ color: C.muted }}>{d.cartao.limite ? `Limite ${brl0(d.cartao.limite)}` : 'Limite não informado'}</span>
      </div>
      <div style={{ height: 14, borderRadius: 7, background: '#EEF1EF', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${d.cartao.limite ? Math.min(100, d.cartao.usado / d.cartao.limite * 100) : 0}%`, background: d.cartao.limite && d.cartao.usado > d.cartao.limite * 0.8 ? '#DC2626' : C.blue }} />
      </div>
      {d.cartao.compras.length === 0 && <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', margin: '12px 0 0' }}>Nenhuma compra nesta fatura.</p>}
      {d.cartao.compras.map(x => (
        <div key={x.id} style={row}>
          <span>{x.descricao}{x.parcelas && x.parcelas > 1 ? <span style={{ color: C.muted, fontSize: 12 }}> · parcela {x.parcelaAtual}/{x.parcelas}</span> : null}</span>
          <span style={{ ...amt, color: '#C2410C' }}>{brl(x.valor)}</span>
          {aba === 'cartao' && <button style={xBtn} title="Excluir a compra (todas as parcelas)" onClick={() => confirm('Excluir esta compra e todas as parcelas?') && acao(excluirLancamento('compra', x.grupoId || x.id))}>✕</button>}
        </div>
      ))}
    </div>
  )
  const BlocoVariaveis = d && (
    <div style={card}>
      <p style={titulo}>Despesas variáveis</p><p style={sub}>Gastos que mudam de mês para mês</p>
      {d.variaveis.length === 0 && <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', margin: 8 }}>Nada lançado neste mês.</p>}
      {d.variaveis.map(x => (
        <div key={x.id} style={row}>
          <span>{x.descricao}<span style={{ color: C.muted, fontSize: 12 }}> · {dataBR(x.data)}</span></span>
          <span style={{ ...amt, color: '#C2410C' }}>{brl(x.valor)}</span>
          {aba === 'variaveis' && <button style={xBtn} onClick={() => confirm('Excluir este lançamento?') && acao(excluirLancamento('despesa', x.id))}>✕</button>}
        </div>
      ))}
    </div>
  )
  const BlocoOrigens = d && (
    <div style={card}>
      <p style={titulo}>De onde veio o dinheiro</p><p style={sub}>Entradas de {MESES[mm - 1].toLowerCase()} · 🔄 = puxado automático</p>
      <div style={{ height: 14, borderRadius: 7, background: '#EEF1EF', overflow: 'hidden', display: 'flex', gap: 2, margin: '6px 0 10px' }}>
        {[[d.origens.mensalidades, C.green], [d.origens.patrocinios, C.blue], [d.origens.loja, C.gold], [d.origens.outras, '#9CA3AF']].map(([v, cor], i) =>
          Number(v) > 0 ? <span key={i} style={{ width: `${Number(v) / (totEnt || 1) * 100}%`, background: String(cor) }} /> : null)}
      </div>
      {[
        ['🔄 Mensalidades', d.origens.mensalidades, 'automático', C.green],
        ['🔄 Patrocínios', d.origens.patrocinios, 'automático', C.blue],
        ['🔄 Loja e fotos', d.origens.loja, 'automático', C.gold],
        ['✍️ Outras entradas', d.origens.outras, 'manual', '#9CA3AF'],
      ].map(([n, v, t, cor]) => (
        <div key={String(n)} style={row}>
          <i style={{ width: 10, height: 10, borderRadius: 3, background: String(cor), display: 'inline-block' }} />{n}
          <span style={pill(t === 'manual' ? '#F3F4F6' : '#EEF2FF', t === 'manual' ? C.muted : C.blue)}>{t}</span>
          <span style={amt}>{brl(Number(v))}</span>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Inter, sans-serif', paddingBottom: 150 }}>
      <div style={{ background: C.blue, padding: '18px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Financeiro</div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 22, color: '#fff', textTransform: 'uppercase' }}>Gestão Financeira</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10 }}>
              <button onClick={() => setMes(m => somaMes(m, -1))} style={{ background: 'none', border: 'none', color: '#fff', padding: '9px 10px', cursor: 'pointer', fontSize: 14 }}>◀</button>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, minWidth: 116, textAlign: 'center' }}>{MESES[mm - 1]} {ano}</span>
              <button onClick={() => setMes(m => somaMes(m, 1))} style={{ background: 'none', border: 'none', color: '#fff', padding: '9px 10px', cursor: 'pointer', fontSize: 14 }}>▶</button>
            </div>
            <button onClick={() => setMenu(v => !v)} style={{ background: '#fff', color: C.blue, border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>+ Lançar</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
        {diasSem != null && diasSem >= 7 && (
          <div style={{ marginTop: 12, background: '#FFFBEB', border: '1px solid #F3D58A', color: '#7A5A12', borderRadius: 12, padding: '10px 12px', fontSize: 13, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>📌 <b>Lembrete semanal:</b> {diasSem >= 999 ? 'nenhuma despesa lançada ainda.' : `nenhuma despesa lançada há ${diasSem} dias.`} Lance os gastos da semana para os gráficos ficarem certos.</span>
            <button onClick={() => setForm('variavel')} style={{ marginLeft: 'auto', background: '#7A5A12', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Lançar agora</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '14px 0 4px' }}>
          {tabs.map(([key, label]) => (
            <button key={key} onClick={() => setAba(key)} style={{ whiteSpace: 'nowrap', padding: '8px 14px', borderRadius: 999, border: `1px solid ${aba === key ? C.text : C.line}`, background: aba === key ? C.text : '#fff', color: aba === key ? '#fff' : C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{label}</button>
          ))}
        </div>

        {erro && <p style={{ color: '#DC2626', marginTop: 12 }}>{erro}</p>}
        {!d && !erro && <p style={{ color: C.muted, marginTop: 20 }}>Carregando…</p>}

        {d && k && (
          <>
            {(aba === 'geral' || aba === 'relatorio') && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginTop: 12 }}>
                {[
                  ['💰 Entrou no mês', brl0(k.entrou), `${k.qtdMensalidades} mensalidade${k.qtdMensalidades === 1 ? '' : 's'} + outras`, '#15803D'],
                  ['💸 Saiu no mês', brl0(k.saiu), k.aPagar > 0 ? `+ ${brl0(k.aPagar)} a pagar` : 'fixas + variáveis + cartão', '#C2410C'],
                  ['📊 Saldo do mês', brl0(k.saldo), k.entrou > 0 ? `margem de ${Math.round(k.saldo / k.entrou * 100)}%` : '—', k.saldo >= 0 ? C.text : '#DC2626'],
                  ['⏳ Ainda a receber', brl0(k.aReceber), `${k.aReceberQtd} mensalidade${k.aReceberQtd === 1 ? '' : 's'} em aberto`, C.gold],
                ].map(([l, v, s, cor]) => (
                  <div key={l} style={card}>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{l}</div>
                    <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 24, marginTop: 4, color: cor }}>{v}</div>
                    <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{s}</div>
                  </div>
                ))}
              </div>
            )}

            {aba === 'geral' && (
              <>
                <div style={grid2}>
                  <div style={card}>
                    <p style={titulo}>Entradas × Saídas</p><p style={sub}>Últimos 6 meses · toque nas barras</p>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: C.muted, flexWrap: 'wrap' }}>
                      <span><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: C.green, marginRight: 5 }} />Entradas</span>
                      <span><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: C.orange, marginRight: 5 }} />Saídas</span>
                      <span><i style={{ display: 'inline-block', width: 14, height: 3, background: C.text, marginRight: 5, verticalAlign: 3 }} />Saldo</span>
                    </div>
                    <GraficoBarras serie={d.serie} />
                  </div>
                  <div style={card}>
                    <p style={titulo}>Para onde foi o dinheiro</p><p style={sub}>Saídas de {MESES[mm - 1].toLowerCase()} por tipo</p>
                    <Rosca partes={[{ nome: 'Despesas fixas', valor: d.porTipo.fixa, cor: C.orange }, { nome: 'Cartão de crédito', valor: d.porTipo.cartao, cor: C.blue }, { nome: 'Despesas variáveis', valor: d.porTipo.variavel, cor: C.gold }]} />
                  </div>
                </div>
                <div style={grid2}>{BlocoOrigens}{BlocoFixas}</div>
                <div style={grid2}>{BlocoCartao}{BlocoVariaveis}</div>
              </>
            )}

            {aba === 'entradas' && (
              <div style={grid2}>
                {BlocoOrigens}
                <div style={card}>
                  <p style={titulo}>🤝 Patrocínios</p><p style={sub}>Toque em &quot;Recebi&quot; quando o patrocinador pagar — entra no caixa</p>
                  {d.patrocinadores.length === 0 && <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', margin: 8 }}>Nenhum patrocinador. Cadastre em <a href="/financeiro/patrocinadores">Patrocinadores</a>.</p>}
                  {d.patrocinadores.map(p => (
                    <div key={p.id} style={row}>
                      <span>{p.empresa || p.nome}</span>
                      {p.recebidoNoMes
                        ? <span style={pill('#E7F5ED', '#15803D')}>✓ recebido</span>
                        : <button onClick={() => acao(receberPatrocinio(p.id, mes))} style={{ ...pill('#EEF2FF', C.blue), border: 'none', cursor: 'pointer' }}>Recebi</button>}
                      <span style={amt}>{brl(p.valor)}</span>
                    </div>
                  ))}
                </div>
                <div style={card}>
                  <p style={titulo}>✍️ Outras entradas</p><p style={sub}>Lançadas à mão neste mês</p>
                  {d.entradasManuais.length === 0 && <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', margin: 8 }}>Nada lançado. Use <b>+ Lançar → Entrada</b>.</p>}
                  {d.entradasManuais.map(x => (
                    <div key={x.id} style={row}>
                      <span>{x.descricao}<span style={{ color: C.muted, fontSize: 12 }}> · {dataBR(x.data)}</span></span>
                      <span style={{ ...amt, color: '#15803D' }}>{brl(x.valor)}</span>
                      <button style={xBtn} onClick={() => confirm('Excluir esta entrada?') && acao(excluirLancamento('entrada', x.id))}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aba === 'fixas' && (
              <div style={grid2}>
                {BlocoFixas}
                <div style={card}>
                  <p style={titulo}>Modelos que se repetem</p><p style={sub}>Encerrar para de lançar nos próximos meses (o histórico fica)</p>
                  {d.modelosFixos.length === 0 && <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', margin: 8 }}>Nenhum modelo.</p>}
                  {d.modelosFixos.map(f => (
                    <div key={f.id} style={row}>
                      <span>{f.descricao}<span style={{ color: C.muted, fontSize: 12 }}> · dia {f.diaVencimento}</span></span>
                      <span style={amt}>{brl(f.valor)}</span>
                      <button style={{ ...xBtn, fontSize: 12, color: '#DC2626' }} onClick={() => confirm(`Encerrar "${f.descricao}"? Ela para de se repetir.`) && acao(encerrarDespesaFixa(f.id))}>Encerrar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aba === 'variaveis' && <div style={grid2}>{BlocoVariaveis}</div>}

            {aba === 'cartao' && (
              <div style={grid2}>
                {BlocoCartao}
                <ConfigCartao d={d} onSalvo={carregar} />
              </div>
            )}

            {aba === 'relatorio' && (
              <div style={{ ...card, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><p style={titulo}>Relatório de {MESES[mm - 1]} {ano}</p><p style={sub}>Todos os lançamentos do mês</p></div>
                  <button onClick={() => window.print()} style={{ background: C.text, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 12px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>🖨️ Imprimir / PDF</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ textAlign: 'left', color: C.muted, fontSize: 11, textTransform: 'uppercase' }}><th style={{ padding: 6 }}>Tipo</th><th style={{ padding: 6 }}>Descrição</th><th style={{ padding: 6, textAlign: 'right' }}>Valor</th></tr></thead>
                  <tbody>
                    {[
                      ['Entrada', 'Mensalidades (automático)', d.origens.mensalidades],
                      ['Entrada', 'Patrocínios', d.origens.patrocinios],
                      ['Entrada', 'Loja e fotos (automático)', d.origens.loja],
                      ...d.entradasManuais.filter(x => x.categoria !== 'PATROCINIO').map(x => ['Entrada', x.descricao || '—', x.valor] as const),
                      ...d.fixasMes.map(x => [x.pago ? 'Fixa (paga)' : 'Fixa (a pagar)', x.descricao || '—', -x.valor] as const),
                      ...d.variaveis.map(x => ['Variável', x.descricao || '—', -x.valor] as const),
                      ...d.cartao.compras.map(x => ['Cartão', `${x.descricao}${x.parcelas && x.parcelas > 1 ? ` (${x.parcelaAtual}/${x.parcelas})` : ''}`, -x.valor] as const),
                    ].filter(r => Number(r[2]) !== 0).map((r, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                        <td style={{ padding: 6, color: C.muted }}>{r[0]}</td><td style={{ padding: 6 }}>{r[1]}</td>
                        <td style={{ padding: 6, textAlign: 'right', fontWeight: 700, color: Number(r[2]) >= 0 ? '#15803D' : '#C2410C' }}>{brl(Number(r[2]))}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: `2px solid ${C.text}` }}><td colSpan={2} style={{ padding: 6, fontWeight: 800 }}>Saldo do mês (pago)</td><td style={{ padding: 6, textAlign: 'right', fontWeight: 900 }}>{brl(k.saldo)}</td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Atalhos de lancamento */}
      {menu && (
        <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 55 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 70, right: 16, background: '#fff', borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,0.18)', padding: 8, display: 'flex', flexDirection: 'column', minWidth: 210 }}>
            {([['entrada', '💰 Entrada'], ['fixa', '🔁 Despesa fixa'], ['variavel', '🧾 Despesa variável'], ['cartao', '💳 Compra no cartão']] as [Exclude<Form, null>, string][]).map(([t, l]) => (
              <button key={t} onClick={() => { setMenu(false); setForm(t) }} style={{ textAlign: 'left', background: 'none', border: 'none', padding: '11px 12px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', color: C.text }}>{l}</button>
            ))}
          </div>
        </div>
      )}
      {form && <Lancar tipo={form} mes={mes} onFechar={() => setForm(null)} onSalvo={() => { setForm(null); carregar() }} />}
      <BottomNav />
    </div>
  )
}

function ConfigCartao({ d, onSalvo }: { d: Dados; onSalvo: () => void }) {
  const [f, setF] = useState({ limite: d.cartao.limite?.toString() || '', fechamento: d.cartao.fechamento?.toString() || '', vencimento: d.cartao.vencimento?.toString() || '' })
  const [ok, setOk] = useState(false)
  const n = (v: string) => (v.trim() ? Number(v.replace(/\./g, '').replace(',', '.')) : null)
  async function salvar() {
    const r = await salvarCartao({ limite: n(f.limite), fechamento: n(f.fechamento), vencimento: n(f.vencimento) })
    if (!r.ok) { alert(r.erro); return }
    setOk(true); setTimeout(() => setOk(false), 2500); onSalvo()
  }
  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, marginTop: 4 }
  return (
    <div style={card}>
      <p style={titulo}>Dados do cartão</p><p style={sub}>Usados para saber em qual fatura cada compra cai</p>
      {([['limite', 'Limite (R$)'], ['fechamento', 'Dia em que a fatura fecha'], ['vencimento', 'Dia do vencimento']] as const).map(([k2, l]) => (
        <label key={k2} style={{ display: 'block', fontSize: 12, color: C.muted, fontWeight: 700, marginTop: 8 }}>{l}
          <input style={inp} inputMode="decimal" value={f[k2]} onChange={e => setF(x => ({ ...x, [k2]: e.target.value }))} />
        </label>
      ))}
      <button onClick={salvar} style={{ marginTop: 12, width: '100%', background: C.blue, color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontWeight: 800, cursor: 'pointer' }}>{ok ? 'Salvo ✅' : 'Salvar'}</button>
    </div>
  )
}
