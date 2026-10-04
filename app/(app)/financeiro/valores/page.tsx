'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { L, FONT_TITLE, FONT_BODY } from '@/lib/themeLight'
import { type FaixaPreco, brl, descontoPct } from '@/lib/precos'
import {
  carregarValores, salvarFaixa, excluirFaixa, copiarParaAno, salvarRegras,
  type ResumoValores, type FaixaInput, type RegrasEscola,
} from './actions'

const ANO_PADRAO = 2027

const card: React.CSSProperties = {
  background: L.surface, border: `1px solid ${L.border}`, borderRadius: 14, padding: 16,
  boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
}
const label: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: L.muted, marginBottom: 4 }
const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10,
  border: `1px solid ${L.border}`, background: L.surface2, color: L.text, fontSize: 15, fontFamily: FONT_BODY,
}
const btn = (variant: 'primary' | 'ghost' | 'danger' = 'primary'): React.CSSProperties => ({
  padding: '10px 14px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT_BODY,
  border: variant === 'ghost' ? `1px solid ${L.border}` : 'none',
  background: variant === 'primary' ? L.primary : variant === 'danger' ? L.dangerSoft : L.surface,
  color: variant === 'primary' ? '#fff' : variant === 'danger' ? L.danger : L.text,
})

function faixaVazia(ano: number): FaixaInput {
  return {
    ano, nome: '', nascidoDe: null, nascidoAte: null, valorMensal: 0,
    valorTrimestral: null, valorSemestral: null, valorTrimestralIrmao: null, valorSemestralIrmao: null,
  }
}

function descricaoNascimento(f: Pick<FaixaPreco, 'nascidoDe' | 'nascidoAte' | 'ano'>) {
  if (f.nascidoDe != null && f.nascidoAte != null) return `Nascidos de ${f.nascidoDe} a ${f.nascidoAte}`
  if (f.nascidoDe != null) return `Nascidos em ${f.nascidoDe} ou depois (até ${f.ano - f.nascidoDe} anos em ${f.ano})`
  if (f.nascidoAte != null) return `Nascidos em ${f.nascidoAte} ou antes (${f.ano - f.nascidoAte} anos ou mais em ${f.ano})`
  return 'Todas as idades'
}

export default function ValoresPage() {
  const [ano, setAno] = useState(ANO_PADRAO)
  const [dados, setDados] = useState<ResumoValores | null>(null)
  const [editando, setEditando] = useState<FaixaInput | null>(null)
  const [regras, setRegras] = useState<RegrasEscola | null>(null)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [carregando, startLoad] = useTransition()
  const [salvando, startSave] = useTransition()

  function carregar(a = ano) {
    startLoad(async () => {
      try {
        const d = await carregarValores(a)
        setDados(d)
        setRegras(d.regras)
      } catch (e) {
        setMsg({ tipo: 'erro', texto: (e as Error).message === 'SEM_PERMISSAO' ? 'Você não tem permissão para ver esta tela.' : 'Erro ao carregar os valores.' })
      }
    })
  }
  useEffect(() => { carregar(ano) }, [ano])

  function avisar(r: { ok: boolean; erro?: string }, sucesso: string) {
    if (r.ok) { setMsg({ tipo: 'ok', texto: sucesso }); carregar() }
    else setMsg({ tipo: 'erro', texto: r.erro || 'Não foi possível salvar.' })
  }

  function onSalvarFaixa() {
    if (!editando) return
    startSave(async () => {
      const r = await salvarFaixa(editando)
      if (r.ok) setEditando(null)
      avisar(r, 'Faixa salva.')
    })
  }

  function onExcluir(f: FaixaPreco) {
    if (!confirm(`Remover a faixa "${f.nome}"? Os atletas dela ficarão sem valor definido para ${f.ano}.`)) return
    startSave(async () => avisar(await excluirFaixa(f.id), 'Faixa removida.'))
  }

  function onCopiar() {
    const destino = ano + 1
    if (!confirm(`Copiar as faixas de ${ano} para ${destino}? Os anos de nascimento avançam 1 ano (mesma idade) e os valores ficam iguais para você ajustar.`)) return
    startSave(async () => {
      const r = await copiarParaAno(ano, destino)
      if (r.ok) setAno(destino)
      avisar(r, `Faixas copiadas para ${destino}.`)
    })
  }

  function onSalvarRegras() {
    if (!regras) return
    startSave(async () => avisar(await salvarRegras(regras), 'Regras salvas.'))
  }

  const setCampo = <K extends keyof FaixaInput>(k: K, v: FaixaInput[K]) =>
    setEditando(p => (p ? { ...p, [k]: v } : p))
  const numOuNull = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))

  const totalAtletas = dados ? Object.values(dados.atletasPorFaixa).reduce((s, n) => s + n, 0) + dados.atletasSemFaixa.length : 0

  return (
    <div style={{ minHeight: '100vh', background: L.bg, color: L.text, fontFamily: FONT_BODY, paddingBottom: 96 }}>
      {/* Cabecalho */}
      <div style={{ background: L.header, padding: '16px 16px 14px' }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 13 }}>← Início</Link>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>Financeiro</div>
            <h1 style={{ fontFamily: FONT_TITLE, fontSize: 24, fontWeight: 800, color: '#fff', margin: '2px 0 0' }}>Planos e Valores</h1>
          </div>
          <select value={ano} onChange={e => setAno(Number(e.target.value))}
            style={{ ...input, width: 'auto', fontWeight: 700, padding: '8px 10px' }} aria-label="Ano">
            {[...new Set([...(dados?.anosDisponiveis ?? []), ANO_PADRAO, ano])].sort().map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {msg && (
          <div role="status" onClick={() => setMsg(null)} style={{
            ...card, padding: '12px 14px', cursor: 'pointer',
            background: msg.tipo === 'ok' ? L.primarySoft : L.dangerSoft,
            borderColor: msg.tipo === 'ok' ? '#BFE5CF' : '#F5C2C2',
            color: msg.tipo === 'ok' ? L.primaryDark : L.danger, fontWeight: 600, fontSize: 14,
          }}>{msg.texto}</div>
        )}

        {carregando && !dados && <p style={{ color: L.muted, textAlign: 'center' }}>Carregando…</p>}

        {dados && (
          <>
            {/* Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { t: 'Atletas ativos', v: String(totalAtletas) },
                { t: 'Faixas de preço', v: String(dados.faixas.filter(f => f.ativo).length) },
                { t: 'Receita mensal*', v: brl(dados.receitaMensalEstimada) },
              ].map(k => (
                <div key={k.t} style={{ ...card, padding: 12 }}>
                  <div style={{ fontSize: 11, color: L.muted, fontWeight: 600 }}>{k.t}</div>
                  <div style={{ fontFamily: FONT_TITLE, fontSize: 18, fontWeight: 800, color: L.navy, marginTop: 4, wordBreak: 'break-word' }}>{k.v}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: L.muted, margin: '-6px 2px 0' }}>* Estimativa se todos pagarem o plano mensal, sem descontos.</p>

            {/* Avisos */}
            {(dados.avisos.length > 0 || dados.atletasSemFaixa.length > 0) && (
              <div style={{ ...card, background: L.warnSoft, borderColor: '#FCD34D' }}>
                <div style={{ fontWeight: 700, color: L.warn, marginBottom: 6 }}>⚠️ Atenção</div>
                {dados.avisos.map(a => <p key={a} style={{ margin: '4px 0', fontSize: 13, color: L.text }}>{a}</p>)}
                {dados.atletasSemFaixa.length > 0 && (
                  <>
                    <p style={{ margin: '4px 0', fontSize: 13 }}>
                      {dados.atletasSemFaixa.length} atleta(s) sem faixa de preço (data de nascimento vazia, errada ou fora das faixas):
                    </p>
                    <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13 }}>
                      {dados.atletasSemFaixa.map(a => (
                        <li key={a.id}>
                          <Link href={`/atletas/${a.id}/editar`} style={{ color: L.blue }}>{a.nome}</Link>
                          {' '}— {a.dataNascimento ? new Date(a.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'sem data'}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* Faixas */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <h2 style={{ fontFamily: FONT_TITLE, fontSize: 17, fontWeight: 800, color: L.navy, margin: 0 }}>Faixas de idade</h2>
              {!editando && <button style={btn()} onClick={() => setEditando(faixaVazia(ano))}>+ Nova faixa</button>}
            </div>

            {dados.faixas.filter(f => f.ativo).length === 0 && !editando && (
              <div style={{ ...card, textAlign: 'center', color: L.muted }}>
                <p style={{ margin: '4px 0 12px' }}>Nenhuma faixa cadastrada para {ano}.</p>
                {dados.anosDisponiveis.includes(ano - 1) && (
                  <button style={btn('ghost')} onClick={() => { setAno(ano - 1) }}>Ver {ano - 1} e copiar</button>
                )}
              </div>
            )}

            {editando && (
              <FormFaixa
                f={editando} salvando={salvando}
                onCampo={setCampo} numOuNull={numOuNull}
                onSalvar={onSalvarFaixa} onCancelar={() => setEditando(null)}
              />
            )}

            {dados.faixas.filter(f => f.ativo && f.id !== editando?.id).map(f => (
              <div key={f.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: FONT_TITLE, fontWeight: 800, fontSize: 17, color: L.navy }}>{f.nome}</div>
                    <div style={{ fontSize: 12, color: L.muted, marginTop: 2 }}>{descricaoNascimento(f)}</div>
                  </div>
                  <span style={{ background: L.primarySoft, color: L.primaryDark, fontWeight: 700, fontSize: 12, padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                    {dados.atletasPorFaixa[f.id] ?? 0} atletas
                  </span>
                </div>

                <TabelaFaixa f={f} />

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button style={btn('ghost')} onClick={() => setEditando({ ...f })}>Editar</button>
                  <button style={btn('danger')} onClick={() => onExcluir(f)} disabled={salvando}>Remover</button>
                </div>
              </div>
            ))}

            {dados.faixas.some(f => f.ativo) && (
              <button style={{ ...btn('ghost'), alignSelf: 'flex-start' }} onClick={onCopiar} disabled={salvando}>
                Copiar faixas para {ano + 1}
              </button>
            )}

            {/* Regras gerais */}
            {regras && (
              <div style={{ ...card, marginTop: 6 }}>
                <h2 style={{ fontFamily: FONT_TITLE, fontSize: 17, fontWeight: 800, color: L.navy, margin: '0 0 4px' }}>Regras de pagamento</h2>
                <p style={{ fontSize: 12, color: L.muted, margin: '0 0 12px' }}>
                  Valem para todas as cobranças novas (PIX e boleto). Pacotes só valem com pagamento antecipado, até o vencimento.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={label}>Multa por atraso (%)</label>
                    <input style={input} type="number" min={0} max={2} step={0.1} value={regras.multaAtraso}
                      onChange={e => setRegras({ ...regras, multaAtraso: Number(e.target.value) })} />
                    <small style={{ color: L.muted, fontSize: 11 }}>Máximo 2% (CDC)</small>
                  </div>
                  <div>
                    <label style={label}>Juros ao mês (%)</label>
                    <input style={input} type="number" min={0} max={1} step={0.1} value={regras.jurosAoMes}
                      onChange={e => setRegras({ ...regras, jurosAoMes: Number(e.target.value) })} />
                    <small style={{ color: L.muted, fontSize: 11 }}>Proporcional aos dias</small>
                  </div>
                  <div>
                    <label style={label}>Prazo para cancelar (dias)</label>
                    <input style={input} type="number" min={7} max={90} value={regras.prazoCancelamentoDias}
                      onChange={e => setRegras({ ...regras, prazoCancelamentoDias: Number(e.target.value) })} />
                    <small style={{ color: L.muted, fontSize: 11 }}>Com devolução integral</small>
                  </div>
                  <div>
                    <label style={label}>Validade do crédito (meses)</label>
                    <input style={input} type="number" min={1} max={36} value={regras.validadeCreditoMeses}
                      onChange={e => setRegras({ ...regras, validadeCreditoMeses: Number(e.target.value) })} />
                    <small style={{ color: L.muted, fontSize: 11 }}>Para o aluno ou um irmão</small>
                  </div>
                </div>

                <div style={{ background: L.surface2, borderRadius: 10, padding: 12, marginTop: 14, fontSize: 13, lineHeight: 1.55 }}>
                  <strong>Como fica para o responsável:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    <li>Atraso: multa de {regras.multaAtraso}% + juros de {regras.jurosAoMes}% ao mês. Ex.: {brl(150)} pago 10 dias depois = {brl(150 * (1 + regras.multaAtraso / 100) + 150 * (regras.jurosAoMes / 100) * (10 / 30))}.</li>
                    <li>Cancelamento em até {regras.prazoCancelamentoDias} dias do pagamento: devolução integral.</li>
                    <li>Depois disso: sem reembolso em dinheiro. O saldo vira crédito por {regras.validadeCreditoMeses} meses, para o aluno ou um irmão.</li>
                    <li>Lesão: o aluno pode fazer atividades de recuperação nos treinos. Com atestado de afastamento, o saldo do período vira crédito.</li>
                  </ul>
                </div>

                <button style={{ ...btn(), marginTop: 14, width: '100%' }} onClick={onSalvarRegras} disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Salvar regras'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function TabelaFaixa({ f }: { f: FaixaPreco }) {
  const linhas: { plano: string; meses: number; normal: number | null; irmao: number | null }[] = [
    { plano: 'Mensal', meses: 1, normal: f.valorMensal, irmao: null },
    { plano: 'Trimestral', meses: 3, normal: f.valorTrimestral, irmao: f.valorTrimestralIrmao },
    { plano: 'Semestral', meses: 6, normal: f.valorSemestral, irmao: f.valorSemestralIrmao },
  ]
  const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, color: L.muted, fontWeight: 700, padding: '6px 4px', textTransform: 'uppercase', letterSpacing: 0.5 }
  const td: React.CSSProperties = { padding: '8px 4px', borderTop: `1px solid ${L.border}`, fontSize: 14, verticalAlign: 'top' }
  const cel = (total: number | null, meses: number) => total == null ? <span style={{ color: L.muted }}>—</span> : (
    <div>
      <div style={{ fontWeight: 700 }}>{brl(total)}</div>
      {meses > 1 && <div style={{ fontSize: 11, color: L.muted }}>{brl(total / meses)}/mês · −{descontoPct(f, total, meses)}%</div>}
    </div>
  )
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
      <thead><tr><th style={th}>Plano</th><th style={th}>Valor</th><th style={th}>Irmãos (cada)</th></tr></thead>
      <tbody>
        {linhas.map(l => (
          <tr key={l.plano}>
            <td style={{ ...td, fontWeight: 600 }}>{l.plano}</td>
            <td style={td}>{cel(l.normal, l.meses)}</td>
            <td style={td}>{l.meses === 1 ? <span style={{ fontSize: 12, color: L.muted }}>sem desconto</span> : cel(l.irmao, l.meses)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function FormFaixa({ f, salvando, onCampo, numOuNull, onSalvar, onCancelar }: {
  f: FaixaInput
  salvando: boolean
  onCampo: <K extends keyof FaixaInput>(k: K, v: FaixaInput[K]) => void
  numOuNull: (s: string) => number | null
  onSalvar: () => void
  onCancelar: () => void
}) {
  const v = (n: number | null | undefined) => (n == null ? '' : String(n))
  const campoValor = (rot: string, k: 'valorMensal' | 'valorTrimestral' | 'valorSemestral' | 'valorTrimestralIrmao' | 'valorSemestralIrmao', meses: number) => (
    <div>
      <label style={label}>{rot}</label>
      <input style={input} inputMode="decimal" placeholder={k === 'valorMensal' ? '0,00' : 'não oferecer'}
        value={v(f[k])}
        onChange={e => onCampo(k, (k === 'valorMensal' ? Number(e.target.value.replace(',', '.')) || 0 : numOuNull(e.target.value)) as never)} />
      {meses > 1 && f.valorMensal > 0 && f[k] != null && (
        <small style={{ color: L.muted, fontSize: 11 }}>
          {brl(Number(f[k]) / meses)}/mês · −{Math.round((1 - Number(f[k]) / (f.valorMensal * meses)) * 1000) / 10}%
        </small>
      )}
    </div>
  )
  return (
    <div style={{ ...card, borderColor: L.primary, borderWidth: 2 }}>
      <div style={{ fontWeight: 800, fontFamily: FONT_TITLE, color: L.navy, marginBottom: 10 }}>{f.id ? 'Editar faixa' : 'Nova faixa'} · {f.ano}</div>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <label style={label}>Nome da faixa</label>
          <input style={input} value={f.nome} placeholder="Ex.: Até 12 anos" onChange={e => onCampo('nome', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Nascidos a partir de (ano)</label>
            <input style={input} inputMode="numeric" placeholder="sem limite" value={v(f.nascidoDe)} onChange={e => onCampo('nascidoDe', numOuNull(e.target.value))} />
          </div>
          <div>
            <label style={label}>Nascidos até (ano)</label>
            <input style={input} inputMode="numeric" placeholder="sem limite" value={v(f.nascidoAte)} onChange={e => onCampo('nascidoAte', numOuNull(e.target.value))} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {campoValor('Mensal', 'valorMensal', 1)}
          {campoValor('Trimestral (total)', 'valorTrimestral', 3)}
          {campoValor('Semestral (total)', 'valorSemestral', 6)}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: L.navy, marginTop: 2 }}>Irmãos (valor de cada um, só nos pacotes)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {campoValor('Trimestral irmão', 'valorTrimestralIrmao', 3)}
          {campoValor('Semestral irmão', 'valorSemestralIrmao', 6)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button style={{ ...btn(), flex: 1 }} onClick={onSalvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar faixa'}</button>
        <button style={btn('ghost')} onClick={onCancelar} disabled={salvando}>Cancelar</button>
      </div>
    </div>
  )
}
