'use client'

import { use, useEffect, useState } from 'react'
import { ShoppingCart, Check, Loader2, Copy, CreditCard } from 'lucide-react'
import { listarFotosPublicas, criarCompraPublica } from '../actions'

const C = { bg: '#0F0F1A', surface: '#1A1A2E', orange: '#FF6B00', gold: '#FFD700', green: '#00C896', text: '#F0F0F0', muted: 'rgba(240,240,240,0.45)', border: 'rgba(255,255,255,0.08)' }
const SYNE = 'Syne, sans-serif'
const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

type Foto = { id: string; urlWatermark: string; valor: number }
type Etapa = 'galeria' | 'form' | 'pix' | 'cartao'

export default function GaleriaAlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = use(params)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [etapa, setEtapa] = useState<Etapa>('galeria')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [metodo, setMetodo] = useState<'PIX' | 'CREDIT_CARD'>('PIX')
  const [parcelas, setParcelas] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [pixData, setPixData] = useState<{ copiaCola: string; qrCodeImage: string } | null>(null)
  const [creditCardUrl, setCreditCardUrl] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [valorTotal, setValorTotal] = useState(0)

  useEffect(() => {
    if (albumId) listarFotosPublicas(albumId).then(d => setFotos(d as Foto[])).finally(() => setLoading(false))
  }, [albumId])

  const toggleFoto = (id: string) => {
    setSelecionadas(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  const totalSelecionado = fotos.filter(f => selecionadas.has(f.id)).reduce((s, f) => s + f.valor, 0)

  const confirmarCompra = async () => {
    if (!nome || !telefone) { alert('Preencha nome e telefone'); return }
    setEnviando(true)
    try {
      const r = await criarCompraPublica({ compradorNome: nome, compradorTelefone: telefone, fotos: Array.from(selecionadas), metodoPagamento: metodo, parcelas })
      setValorTotal(r.valor)
      if (metodo === 'PIX' && r.pixData) { setPixData(r.pixData); setEtapa('pix') }
      else if (r.creditCardUrl) { setCreditCardUrl(r.creditCardUrl); setEtapa('cartao') }
    } catch (e) { alert('Erro: ' + (e as Error).message) }
    finally { setEnviando(false) }
  }

  const copiarPix = () => {
    if (!pixData) return
    navigator.clipboard.writeText(pixData.copiaCola)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.muted }}>Carregando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <div style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #1A1A2E 60%, #0F0F1A 100%)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/galeria" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, textDecoration: 'none' }}>←</a>
          <img src="/gestaofc-logo.png" style={{ width: 36, height: 36, borderRadius: 10 }} alt="logo" onError={e => (e.currentTarget.style.display = 'none')} />
          <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 16, color: '#fff' }}>Galeria de Fotos</div>
        </div>
      </div>

      {etapa === 'galeria' && (
        <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
          <p style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>
            Selecione as fotos que deseja comprar. As originais sem marca d'água serão enviadas via WhatsApp após o pagamento.
          </p>
          {fotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
              <p style={{ color: C.muted }}>Nenhuma foto neste álbum ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
              {fotos.map(f => {
                const sel = selecionadas.has(f.id)
                return (
                  <div key={f.id} onClick={() => toggleFoto(f.id)}
                    style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${sel ? C.orange : 'transparent'}` }}>
                    <img src={f.urlWatermark} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} alt="" />
                    {sel && (
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={16} color="#fff" />
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '16px 8px 8px', textAlign: 'center' }}>
                      <span style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 12, color: '#fff' }}>{brl(f.valor)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {selecionadas.size > 0 && (
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 18, color: C.orange }}>{brl(totalSelecionado)}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{selecionadas.size} foto{selecionadas.size > 1 ? 's' : ''} selecionada{selecionadas.size > 1 ? 's' : ''}</div>
              </div>
              <button onClick={() => setEtapa('form')}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.orange, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontFamily: SYNE, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                <ShoppingCart size={18} /> Comprar
              </button>
            </div>
          )}
        </div>
      )}

      {etapa === 'form' && (
        <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
          <h2 style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 800, color: C.orange, margin: '0 0 6px' }}>Finalizar compra</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>{selecionadas.size} foto{selecionadas.size > 1 ? 's' : ''} · {brl(totalSelecionado)}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Campo label="Seu nome *"><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" style={inp} /></Campo>
            <Campo label="WhatsApp * (as fotos serão enviadas aqui)"><input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(34) 99999-9999" style={inp} /></Campo>
            <Campo label="Forma de pagamento">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['PIX', 'CREDIT_CARD'] as const).map(m => (
                  <button key={m} onClick={() => setMetodo(m)}
                    style={{ padding: '14px', borderRadius: 12, border: `2px solid ${metodo === m ? C.orange : C.border}`, background: metodo === m ? `${C.orange}18` : C.surface, color: metodo === m ? C.orange : C.muted, fontFamily: SYNE, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    {m === 'PIX' ? '⚡ Pix' : '💳 Cartão'}
                  </button>
                ))}
              </div>
            </Campo>
            {metodo === 'CREDIT_CARD' && (
              <Campo label="Parcelamento">
                <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} style={inp}>
                  <option value={1}>À vista — {brl(totalSelecionado)}</option>
                  <option value={2}>2x — {brl(totalSelecionado / 2)}/parcela</option>
                </select>
              </Campo>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button onClick={() => setEtapa('galeria')} style={{ flex: 1, background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px', cursor: 'pointer' }}>Voltar</button>
            <button onClick={confirmarCompra} disabled={enviando}
              style={{ flex: 2, background: C.orange, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontFamily: SYNE, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: enviando ? 0.7 : 1 }}>
              {enviando ? <><Loader2 size={18} className="spin" /> Processando...</> : `Pagar ${brl(totalSelecionado)}`}
            </button>
          </div>
        </div>
      )}

      {etapa === 'pix' && pixData && (
        <div style={{ padding: 20, maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <h2 style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 800, color: C.orange, marginBottom: 6 }}>Pague via Pix</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Após o pagamento as fotos serão enviadas no WhatsApp.</p>
          {pixData.qrCodeImage && (
            <img src={`data:image/png;base64,${pixData.qrCodeImage}`}
              style={{ width: 200, height: 200, border: `4px solid ${C.orange}`, borderRadius: 16, margin: '0 auto 20px', display: 'block' }} alt="QR Code" />
          )}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 16, wordBreak: 'break-all', fontSize: 11, color: C.muted, textAlign: 'left' }}>
            {pixData.copiaCola}
          </div>
          <button onClick={copiarPix}
            style={{ width: '100%', background: copiado ? C.green : C.orange, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontFamily: SYNE, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {copiado ? <><Check size={18} /> Copiado!</> : <><Copy size={18} /> Copiar código Pix</>}
          </button>
          <p style={{ color: C.muted, fontSize: 11, marginTop: 16 }}>Valor: <strong style={{ color: C.text }}>{brl(valorTotal)}</strong></p>
        </div>
      )}

      {etapa === 'cartao' && creditCardUrl && (
        <div style={{ padding: 20, maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
          <h2 style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 800, color: C.orange, marginBottom: 6 }}>Pagamento por Cartão</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>Clique no botão abaixo para pagar. Após a confirmação, as fotos serão enviadas no WhatsApp.</p>
          <a href={creditCardUrl} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: C.orange, color: '#fff', borderRadius: 14, padding: '16px 24px', fontFamily: SYNE, fontWeight: 800, fontSize: 15, textDecoration: 'none', marginBottom: 12 }}>
            <CreditCard size={20} /> Pagar {brl(valorTotal)}
          </a>
          <p style={{ color: C.muted, fontSize: 11 }}>Você será redirecionado para a página segura de pagamento.</p>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'rgba(240,240,240,0.45)' }}>{label}{children}</label>
}

const inp: React.CSSProperties = { background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', color: '#F0F0F0', fontSize: 14, width: '100%', boxSizing: 'border-box' }