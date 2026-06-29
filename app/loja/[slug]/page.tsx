'use client'

import { useEffect, useState } from 'react'
import { ShoppingCart, Check, Loader2, Copy, CreditCard, Plus, Minus, X } from 'lucide-react'
import { listarProdutosPublicos, criarPedido, getEscolaInfo } from './actions'
type EscolaInfo = { id: string; nome: string; logoUrl: string | null; corPrimaria: string | null; corSecundaria: string | null }
import { use } from 'react'

const C = { bg: '#0A0E1A', surface: '#0D1220', surface2: '#121A2E', orange: '#4169E1', gold: '#FFD700', green: '#00D67A', text: '#F0F4FF', muted: 'rgba(240,244,255,0.45)', border: 'rgba(240,244,255,0.08)' }
const SYNE = 'Syne, sans-serif'
const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

type Variacao = { id: string; tamanho?: string; cor?: string; preco: number; estoque: number }
type Produto = { id: string; nome: string; descricao?: string; categoria?: string; foto?: string; ProdutoVariacao: Variacao[] }
type ItemCarrinho = { variacaoId: string; produtoId: string; nome: string; tamanho?: string; cor?: string; preco: number; qtd: number; foto?: string }
type Etapa = 'loja' | 'carrinho' | 'form' | 'pix' | 'cartao' | 'sucesso'

export default function LojaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [etapa, setEtapa] = useState<Etapa>('loja')
  const [varSelecionada, setVarSelecionada] = useState<Record<string, string>>({})
  const [nome, setNome] = useState(''); const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState(''); const [tipoEntrega, setTipoEntrega] = useState<'RETIRADA' | 'ENTREGA'>('RETIRADA')
  const [metodo, setMetodo] = useState<'PIX' | 'CREDIT_CARD'>('PIX'); const [parcelas, setParcelas] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [pixData, setPixData] = useState<{ copiaCola: string; qrCodeImage: string } | null>(null)
  const [creditCardUrl, setCreditCardUrl] = useState<string | null>(null)
  const [valorTotal, setValorTotal] = useState(0); const [copiado, setCopiado] = useState(false)
  const [escola, setEscola] = useState<EscolaInfo | null>(null)

  const accent = escola?.corSecundaria || '#4169E1'

  useEffect(() => {
    Promise.all([listarProdutosPublicos(slug), getEscolaInfo(slug)]).then(([p, e]) => { setProdutos(p as Produto[]); setEscola(e as EscolaInfo) }).finally(() => setLoading(false))
  }, [])

  const totalCarrinho = carrinho.reduce((s, i) => s + i.preco * i.qtd, 0)
  const qtdCarrinho = carrinho.reduce((s, i) => s + i.qtd, 0)

  const adicionarAoCarrinho = (produto: Produto) => {
    const varId = varSelecionada[produto.id]
    if (!varId) { alert('Selecione uma variação'); return }
    const variacao = produto.ProdutoVariacao.find(v => v.id === varId)
    if (!variacao || variacao.estoque === 0) { alert('Sem estoque'); return }
    setCarrinho(prev => {
      const existe = prev.find(i => i.variacaoId === varId)
      if (existe) return prev.map(i => i.variacaoId === varId ? { ...i, qtd: Math.min(i.qtd + 1, variacao.estoque) } : i)
      return [...prev, { variacaoId: varId, produtoId: produto.id, nome: produto.nome, tamanho: variacao.tamanho, cor: variacao.cor, preco: variacao.preco, qtd: 1, foto: produto.foto }]
    })
  }

  const confirmarPedido = async () => {
    if (!nome || !telefone) { alert('Preencha nome e telefone'); return }
    if (tipoEntrega === 'ENTREGA' && !endereco) { alert('Preencha o endereço de entrega'); return }
    setEnviando(true)
    try {
      const r = await criarPedido(slug, {
        compradorNome: nome, compradorTelefone: telefone,
        compradorEndereco: tipoEntrega === 'ENTREGA' ? endereco : undefined,
        itens: carrinho, tipoEntrega, metodoPagamento: metodo, parcelas,
      })
      setValorTotal(r.valor)
      if (metodo === 'PIX' && r.pixData) { setPixData(r.pixData); setEtapa('pix') }
      else if (r.creditCardUrl) { setCreditCardUrl(r.creditCardUrl); setEtapa('cartao') }
    } catch (e) { alert((e as Error).message) }
    finally { setEnviando(false) }
  }

  const copiarPix = () => {
    if (!pixData) return
    navigator.clipboard.writeText(pixData.copiaCola)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  if (loading) return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: C.muted }}>Carregando...</p></div>

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #1A1A2E 60%, #0F0F1A 100%)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/gestaofc-logo.png" style={{ width: 36, height: 36, borderRadius: 10 }} alt="logo" onError={e => (e.currentTarget.style.display = 'none')} />
            <div>
              <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 16, color: '#fff' }}>🛍️ Loja TLFA</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Produtos oficiais</div>
            </div>
          </div>
          {qtdCarrinho > 0 && (
            <button onClick={() => setEtapa('carrinho')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 12, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontFamily: SYNE, fontWeight: 700 }}>
              <ShoppingCart size={18} />
              <span style={{ background: accent, borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{qtdCarrinho}</span>
              {brl(totalCarrinho)}
            </button>
          )}
        </div>
      </div>

      {/* LOJA */}
      {etapa === 'loja' && (
        <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
          {produtos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
              <p style={{ color: C.muted }}>Nenhum produto disponível ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {produtos.map(p => {
                const varId = varSelecionada[p.id]
                const varAtual = p.ProdutoVariacao.find(v => v.id === varId)
                const temEstoque = p.ProdutoVariacao.some(v => v.estoque > 0)
                return (
                  <div key={p.id} style={{ background: C.surface, borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                    <div style={{ aspectRatio: '4/3', background: `${C.orange}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {p.foto
                        ? <img src={p.foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.nome} />
                        : <span style={{ fontSize: 40 }}>📦</span>
                      }
                    </div>
                    <div style={{ padding: 14 }}>
                      <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.nome}</div>
                      {p.descricao && <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{p.descricao}</div>}

                      {/* Variações */}
                      {p.ProdutoVariacao.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {p.ProdutoVariacao.map(v => (
                            <button key={v.id} onClick={() => setVarSelecionada(prev => ({ ...prev, [p.id]: v.id }))}
                              disabled={v.estoque === 0}
                              style={{ padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${varId === v.id ? C.orange : C.border}`, background: varId === v.id ? `${C.orange}18` : 'transparent', color: v.estoque === 0 ? C.muted : varId === v.id ? C.orange : C.text, fontSize: 11, cursor: v.estoque === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: v.estoque === 0 ? 0.4 : 1 }}>
                              {v.tamanho || v.cor || 'Único'}
                            </button>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 16, color: accent }}>
                          {varAtual ? brl(varAtual.preco) : p.ProdutoVariacao.length > 0 ? `A partir de ${brl(Math.min(...p.ProdutoVariacao.map(v => v.preco)))}` : '—'}
                        </div>
                        <button onClick={() => adicionarAoCarrinho(p)} disabled={!temEstoque}
                          style={{ background: temEstoque ? C.orange : C.muted, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontFamily: SYNE, fontWeight: 700, fontSize: 12, cursor: temEstoque ? 'pointer' : 'not-allowed' }}>
                          {temEstoque ? '+ Carrinho' : 'Esgotado'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* CARRINHO */}
      {etapa === 'carrinho' && (
        <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setEtapa('loja')} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20 }}>←</button>
            <h2 style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 800, color: accent, margin: 0 }}>Carrinho</h2>
          </div>
          {carrinho.map(item => (
            <div key={item.variacaoId} style={{ background: C.surface, borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: `${C.orange}18`, overflow: 'hidden', flexShrink: 0 }}>
                {item.foto ? <img src={item.foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 20 }}>📦</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 13 }}>{item.nome}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{[item.tamanho, item.cor].filter(Boolean).join(' · ')}</div>
                <div style={{ fontSize: 13, color: accent, fontWeight: 700 }}>{brl(item.preco)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setCarrinho(prev => prev.map(i => i.variacaoId === item.variacaoId ? { ...i, qtd: Math.max(1, i.qtd - 1) } : i))}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, background: 'transparent', color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Minus size={12} />
                </button>
                <span style={{ fontFamily: SYNE, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qtd}</span>
                <button onClick={() => setCarrinho(prev => prev.map(i => i.variacaoId === item.variacaoId ? { ...i, qtd: i.qtd + 1 } : i))}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, background: 'transparent', color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={12} />
                </button>
                <button onClick={() => setCarrinho(prev => prev.filter(i => i.variacaoId !== item.variacaoId))}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'transparent', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
          <div style={{ background: C.surface, borderRadius: 12, padding: '14px 16px', marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: C.muted }}>Total</span>
            <span style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 18, color: accent }}>{brl(totalCarrinho)}</span>
          </div>
          <button onClick={() => setEtapa('form')} style={{ width: '100%', marginTop: 16, background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontFamily: SYNE, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Finalizar pedido →
          </button>
        </div>
      )}

      {/* FORM */}
      {etapa === 'form' && (
        <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button onClick={() => setEtapa('carrinho')} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20 }}>←</button>
            <h2 style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 800, color: accent, margin: 0 }}>Seus dados</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Campo label="Nome completo *"><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" style={inp} /></Campo>
            <Campo label="WhatsApp *"><input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(34) 99999-9999" style={inp} /></Campo>
            <Campo label="Tipo de entrega">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['RETIRADA', 'ENTREGA'] as const).map(t => (
                  <button key={t} onClick={() => setTipoEntrega(t)}
                    style={{ padding: '12px', borderRadius: 12, border: `2px solid ${tipoEntrega === t ? C.orange : C.border}`, background: tipoEntrega === t ? `${C.orange}18` : C.surface, color: tipoEntrega === t ? C.orange : C.muted, fontFamily: SYNE, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    {t === 'RETIRADA' ? '🏫 Retirar na escola' : '🚚 Receber em casa'}
                  </button>
                ))}
              </div>
            </Campo>
            {tipoEntrega === 'ENTREGA' && (
              <Campo label="Endereço completo *"><input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número, bairro, cidade" style={inp} /></Campo>
            )}
            <Campo label="Forma de pagamento">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['PIX', 'CREDIT_CARD'] as const).map(m => (
                  <button key={m} onClick={() => setMetodo(m)}
                    style={{ padding: '12px', borderRadius: 12, border: `2px solid ${metodo === m ? C.orange : C.border}`, background: metodo === m ? `${C.orange}18` : C.surface, color: metodo === m ? C.orange : C.muted, fontFamily: SYNE, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    {m === 'PIX' ? '⚡ Pix' : '💳 Cartão'}
                  </button>
                ))}
              </div>
            </Campo>
            {metodo === 'CREDIT_CARD' && (
              <Campo label="Parcelamento">
                <select value={parcelas} onChange={e => setParcelas(Number(e.target.value))} style={inp}>
                  <option value={1}>À vista — {brl(totalCarrinho)}</option>
                  <option value={2}>2x — {brl(totalCarrinho / 2)}/parcela</option>
                </select>
              </Campo>
            )}
          </div>
          <button onClick={confirmarPedido} disabled={enviando}
            style={{ width: '100%', marginTop: 20, background: accent, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontFamily: SYNE, fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: enviando ? 0.7 : 1 }}>
            {enviando ? <><Loader2 size={18} className="spin" /> Processando...</> : `Pagar ${brl(totalCarrinho)}`}
          </button>
        </div>
      )}

      {/* PIX */}
      {etapa === 'pix' && pixData && (
        <div style={{ padding: 20, maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
          <h2 style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 800, color: accent, marginBottom: 6 }}>Pague via Pix</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Após o pagamento você receberá a confirmação no WhatsApp.</p>
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

      {/* CARTÃO */}
      {etapa === 'cartao' && creditCardUrl && (
        <div style={{ padding: 20, maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
          <h2 style={{ fontFamily: SYNE, fontSize: 20, fontWeight: 800, color: accent, marginBottom: 6 }}>Pagamento por Cartão</h2>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>Clique abaixo para pagar. Após confirmação, você receberá no WhatsApp.</p>
          <a href={creditCardUrl} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: accent, color: '#fff', borderRadius: 14, padding: '16px 24px', fontFamily: SYNE, fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
            <CreditCard size={20} /> Pagar {brl(valorTotal)}
          </a>
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