'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trash2, Plus, Send, FileText, RotateCcw, X } from 'lucide-react'
import { DEFAULT_TEMPLATE, type Patrocinador } from './constants'
import {
  listarPatrocinadores, criarPatrocinador, renovarPatrocinador,
  excluirPatrocinador, enviarCobrancaWhatsApp, atualizarMensagem,
} from './actions'
import { gerarRecibo } from '@/lib/gerarRecibo'

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
const dataBR = (d: string) => d?.slice(0, 10).split('-').reverse().join('/')

const computeStatus = (status: string, venc: string) => {
  if (status !== 'ATIVO') return status
  return new Date(venc + 'T00:00:00') < new Date() ? 'VENCIDO' : 'ATIVO'
}
const corStatus = (s: string) =>
  ({ ATIVO: '#FF6B00', VENCIDO: '#FF4757', CANCELADO: '#888' } as Record<string, string>)[s] ?? '#888'

export default function PatrocinadoresPage() {
  const [lista, setLista] = useState<Patrocinador[]>([])
  const [carregando, setCarregando] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [msgEdit, setMsgEdit] = useState<{ id: string; texto: string } | null>(null)
  const [renovId, setRenovId] = useState<{ id: string; data: string } | null>(null)
  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [telefone, setTelefone] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [descricao, setDescricao] = useState('')
  const [msgCobranca, setMsgCobranca] = useState(DEFAULT_TEMPLATE)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try { setLista(await listarPatrocinadores()) } finally { setCarregando(false) }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const salvar = async () => {
    if (!nome || !valor || !vencimento) { alert('Preencha nome, valor e vencimento'); return }
    setSalvando(true)
    try {
      await criarPatrocinador({ nome, empresa, telefone, valor: Number(valor), vencimento, descricao, mensagemCobranca: msgCobranca })
      setNome(''); setEmpresa(''); setTelefone(''); setValor(''); setVencimento(''); setDescricao('')
      setMsgCobranca(DEFAULT_TEMPLATE); setShowForm(false); await carregar()
    } catch (e) { alert((e as Error).message) }
    finally { setSalvando(false) }
  }

  const enviarWpp = async (id: string) => {
    try { await enviarCobrancaWhatsApp(id); alert('Mensagem enviada!') }
    catch (e) { alert('Erro: ' + (e as Error).message) }
  }

  const gerarPDF = (p: Patrocinador) =>
    gerarRecibo({ tipo: 'PATROCINIO', nome: p.nome, valor: p.valor, descricao: p.descricao ?? p.empresa ?? '', data: new Date().toISOString().slice(0, 10) })

  const salvarMsg = async () => {
    if (!msgEdit) return
    await atualizarMensagem(msgEdit.id, msgEdit.texto); setMsgEdit(null); await carregar()
  }

  const salvarRenov = async () => {
    if (!renovId?.data) return
    await renovarPatrocinador(renovId.id, renovId.data); setRenovId(null); await carregar()
  }

  const ativos = lista.filter(p => computeStatus(p.status, p.vencimento) === 'ATIVO')
  const vencidos = lista.filter(p => computeStatus(p.status, p.vencimento) === 'VENCIDO')
  const cancelados = lista.filter(p => p.status === 'CANCELADO')
  const totalAtivo = ativos.reduce((s, p) => s + p.valor, 0)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0F0F1A, #0F0F1A, #111003)', color: '#fff', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#FF6B00', margin: 0 }}>Patrocinadores</h1>
            <p style={{ color: '#9aa', fontSize: 13, marginTop: 4 }}>{ativos.length} ativos · {brl(totalAtivo)}/período</p>
          </div>
          <button onClick={() => setShowForm(v => !v)} style={btnPrimary}><Plus size={16} /> Novo patrocinador</button>
        </div>

        {showForm && (
          <div style={formCard}>
            <h2 style={cardTitle}>Cadastrar patrocinador</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
              <Campo label="Nome *"><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" style={inp} /></Campo>
              <Campo label="Empresa"><input value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Nome da empresa" style={inp} /></Campo>
              <Campo label="Telefone (WhatsApp)"><input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="34999999999" style={inp} /></Campo>
              <Campo label="Valor (R$) *"><input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" style={inp} /></Campo>
              <Campo label="Vencimento *"><input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} style={inp} /></Campo>
              <Campo label="Descrição"><input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: placa no campo" style={inp} /></Campo>
            </div>
            <Campo label="Mensagem de cobrança — variáveis: {{nome}}, {{valor}}, {{vencimento}}">
              <textarea value={msgCobranca} onChange={e => setMsgCobranca(e.target.value)} rows={6}
                style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
            </Campo>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={salvar} disabled={salvando} style={btnPrimary}>Salvar</button>
              <button onClick={() => setShowForm(false)} style={btnGhost}>Cancelar</button>
            </div>
          </div>
        )}

        {carregando && <p style={{ color: '#9aa' }}>Carregando…</p>}

        {[
          { titulo: 'Ativos', items: ativos, cor: '#FF6B00' },
          { titulo: 'Vencidos', items: vencidos, cor: '#FF4757' },
          { titulo: 'Cancelados', items: cancelados, cor: '#888' },
        ].map(grupo => grupo.items.length === 0 ? null : (
          <div key={grupo.titulo} style={{ marginBottom: 28 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, color: grupo.cor, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>
              {grupo.titulo} ({grupo.items.length})
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {grupo.items.map(p => {
                const st = computeStatus(p.status, p.vencimento)
                return (
                  <div key={p.id} style={patCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>{p.nome}</p>
                        {p.empresa && <p style={{ color: '#9aa', fontSize: 12, margin: '2px 0 0' }}>{p.empresa}</p>}
                        {p.telefone && <p style={{ color: '#9aa', fontSize: 12, margin: '2px 0 0' }}>{p.telefone}</p>}
                      </div>
                      <span style={{ color: corStatus(st), fontSize: 11, fontWeight: 700, border: `1px solid ${corStatus(st)}`, borderRadius: 999, padding: '3px 10px' }}>{st}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ color: '#FFD700', fontWeight: 800, fontSize: 18 }}>{brl(p.valor)}</span>
                      <span style={{ color: '#9aa', fontSize: 13 }}>vence {dataBR(p.vencimento)}</span>
                    </div>
                    {p.descricao && <p style={{ color: '#9aa', fontSize: 12, marginBottom: 12 }}>{p.descricao}</p>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Btn icon={<Send size={13} />} label="WhatsApp" onClick={() => enviarWpp(p.id)} cor="#25D366" />
                      <Btn icon={<FileText size={13} />} label="Recibo" onClick={() => gerarPDF(p)} cor="#FFD700" />
                      <Btn icon={<RotateCcw size={13} />} label="Renovar" onClick={() => setRenovId({ id: p.id, data: '' })} cor="#FF6B00" />
                      <Btn icon={<X size={13} />} label="Mensagem" onClick={() => setMsgEdit({ id: p.id, texto: p.mensagemCobranca || DEFAULT_TEMPLATE })} cor="#9aa" />
                      <button onClick={async () => { if (!confirm('Excluir?')) return; await excluirPatrocinador(p.id); await carregar() }}
                        style={{ background: 'transparent', border: '1px solid #2A2A4A', borderRadius: 8, padding: '6px 8px', color: '#9aa', cursor: 'pointer', display: 'inline-flex' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {lista.length === 0 && !carregando && (
          <div style={{ ...formCard, textAlign: 'center', color: '#9aa', padding: 40 }}>
            Nenhum patrocinador ainda. Clique em "Novo patrocinador" pra começar.
          </div>
        )}

        {msgEdit && (
          <Modal titulo="Editar mensagem de cobrança" onClose={() => setMsgEdit(null)}>
            <p style={{ color: '#9aa', fontSize: 12, marginBottom: 8 }}>Variáveis: {`{{nome}}, {{valor}}, {{vencimento}}`}</p>
            <textarea value={msgEdit.texto} onChange={e => setMsgEdit({ ...msgEdit, texto: e.target.value })} rows={8}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={salvarMsg} style={btnPrimary}>Salvar</button>
              <button onClick={() => setMsgEdit(null)} style={btnGhost}>Cancelar</button>
            </div>
          </Modal>
        )}

        {renovId && (
          <Modal titulo="Renovar patrocínio" onClose={() => setRenovId(null)}>
            <Campo label="Novo vencimento">
              <input type="date" value={renovId.data} onChange={e => setRenovId({ ...renovId, data: e.target.value })} style={inp} />
            </Campo>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={salvarRenov} style={btnPrimary}>Renovar</button>
              <button onClick={() => setRenovId(null)} style={btnGhost}>Cancelar</button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}

function Btn({ icon, label, onClick, cor }: { icon: React.ReactNode; label: string; onClick: () => void; cor: string }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: `1px solid ${cor}44`, borderRadius: 8, padding: '6px 10px', color: cor, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
      {icon}{label}
    </button>
  )
}

function Modal({ titulo, children, onClose }: { titulo: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
      <div style={{ background: '#0e1a0a', border: '1px solid #2A2A4A', borderRadius: 16, padding: 24, maxWidth: 520, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', color: '#FFD700', margin: 0 }}>{titulo}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#9aa', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#9aa', marginBottom: 4 }}>{label}{children}</label>
}

const formCard: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid #1A1A2E', borderRadius: 16, padding: 20, marginBottom: 24 }
const patCard: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid #1A1A2E', borderRadius: 16, padding: 20 }
const cardTitle: React.CSSProperties = { fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: '#FFD700', margin: '0 0 16px' }
const inp: React.CSSProperties = { background: '#0a0f08', border: '1px solid #2A2A4A', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, boxSizing: 'border-box', width: '100%' }
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FF6B00', color: '#04130a', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }
const btnGhost: React.CSSProperties = { background: 'transparent', border: '1px solid #2A2A4A', color: '#9aa', borderRadius: 10, padding: '11px 20px', cursor: 'pointer' }