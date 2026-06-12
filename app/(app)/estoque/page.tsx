'use client'

import { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, Edit3, Package, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react'
import { listarProdutos, criarProduto, excluirProduto, atualizarProduto, uploadFotoProduto, criarVariacao, excluirVariacao, atualizarVariacao, listarPedidos, atualizarStatusPedido } from './actions'

const C = { bg: '#0F0F1A', surface: '#1A1A2E', orange: '#FF6B00', gold: '#FFD700', green: '#00C896', text: '#F0F0F0', muted: 'rgba(240,240,240,0.45)', border: 'rgba(255,255,255,0.08)', red: '#FF4757' }
const SYNE = 'Syne, sans-serif'
const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

const CATEGORIAS = ['Uniforme', 'Chuteira', 'Bola', 'Material de Treino', 'Acessório', 'Personalizado', 'Outro']
const STATUS_PEDIDO = ['AGUARDANDO', 'PAGO', 'SEPARADO', 'ENTREGUE', 'CANCELADO']
const STATUS_COR: Record<string, string> = { AGUARDANDO: '#FFD700', PAGO: '#00C896', SEPARADO: '#FF6B00', ENTREGUE: '#00C896', CANCELADO: '#FF4757' }

type Variacao = { id: string; tamanho?: string; cor?: string; preco: number; estoque: number }
type Produto = { id: string; nome: string; descricao?: string; categoria?: string; foto?: string; ativo: boolean; ProdutoVariacao: Variacao[] }
type Pedido = { id: string; compradorNome: string; compradorTelefone: string; compradorEndereco?: string; itens: any[]; valor: number; status: string; tipoEntrega: string; pagoEm?: string; createdAt: string }

type Aba = 'produtos' | 'pedidos'

export default function EstoquePage() {
  const [aba, setAba] = useState<Aba>('produtos')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [produtoExpandido, setProdutoExpandido] = useState<string | null>(null)
  const [showNovoProduto, setShowNovoProduto] = useState(false)
  const [nome, setNome] = useState(''); const [descricao, setDescricao] = useState(''); const [categoria, setCategoria] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [novaVar, setNovaVar] = useState<Record<string, { tamanho: string; cor: string; preco: string; estoque: string }>>({})
  const inputFotoRef = useRef<Record<string, HTMLInputElement | null>>({})

  const carregar = async () => {
    setLoading(true)
    try {
      const [p, ped] = await Promise.all([listarProdutos(), listarPedidos()])
      setProdutos(p as Produto[])
      setPedidos(ped as Pedido[])
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  const salvarProduto = async () => {
    if (!nome) return
    setSalvando(true)
    try { await criarProduto({ nome, descricao, categoria }); setNome(''); setDescricao(''); setCategoria(''); setShowNovoProduto(false); await carregar() }
    catch (e) { alert((e as Error).message) }
    finally { setSalvando(false) }
  }

  const handleFoto = async (produtoId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target!.result as string
      await uploadFotoProduto(produtoId, base64, file.name)
      await carregar()
    }
    reader.readAsDataURL(file)
  }

  const adicionarVariacao = async (produtoId: string) => {
    const v = novaVar[produtoId]
    if (!v?.preco) return
    await criarVariacao({ produtoId, tamanho: v.tamanho, cor: v.cor, preco: Number(v.preco), estoque: Number(v.estoque || 0) })
    setNovaVar(prev => ({ ...prev, [produtoId]: { tamanho: '', cor: '', preco: '', estoque: '' } }))
    await carregar()
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: 20 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: SYNE, fontSize: 24, fontWeight: 800, color: C.orange, margin: 0 }}>🛍️ Estoque & Loja</h1>
            <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Produtos, variações e pedidos</p>
          </div>
          <a href="/loja" target="_blank" style={{ color: C.gold, fontSize: 12, border: `1px solid ${C.gold}44`, borderRadius: 8, padding: '6px 12px', textDecoration: 'none' }}>
            🔗 Ver loja pública
          </a>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['produtos', 'pedidos'] as Aba[]).map(a => (
            <button key={a} onClick={() => setAba(a)}
              style={{ padding: '8px 20px', borderRadius: 10, border: `1px solid ${aba === a ? C.orange : C.border}`, background: aba === a ? `${C.orange}18` : 'transparent', color: aba === a ? C.orange : C.muted, fontFamily: SYNE, fontWeight: 700, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
              {a === 'produtos' ? `📦 Produtos (${produtos.length})` : `🧾 Pedidos (${pedidos.length})`}
            </button>
          ))}
        </div>

        {loading ? <p style={{ color: C.muted, textAlign: 'center', padding: 40 }}>Carregando...</p> : (

          <>
            {/* ABA PRODUTOS */}
            {aba === 'produtos' && (
              <div>
                <button onClick={() => setShowNovoProduto(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.orange, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontFamily: SYNE, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
                  <Plus size={16} /> Novo produto
                </button>

                {showNovoProduto && (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
                    <h3 style={{ fontFamily: SYNE, color: C.gold, margin: '0 0 14px' }}>Novo produto</h3>
                    <div style={{ display: 'grid', gap: 10 }}>
                      <Campo label="Nome *"><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Camisa Oficial TLFA" style={inp} /></Campo>
                      <Campo label="Descrição"><input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição opcional" style={inp} /></Campo>
                      <Campo label="Categoria">
                        <select value={categoria} onChange={e => setCategoria(e.target.value)} style={inp}>
                          <option value="">Selecionar...</option>
                          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </Campo>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                      <button onClick={salvarProduto} disabled={salvando} style={{ background: C.orange, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontFamily: SYNE, fontWeight: 700, cursor: 'pointer' }}>
                        {salvando ? 'Salvando...' : 'Criar produto'}
                      </button>
                      <button onClick={() => setShowNovoProduto(false)} style={{ background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 20px', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                )}

                {produtos.length === 0 ? (
                  <div style={{ background: C.surface, borderRadius: 16, padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                    <p style={{ color: C.muted }}>Nenhum produto cadastrado ainda.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {produtos.map(p => (
                      <div key={p.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
                        {/* Cabeçalho do produto */}
                        <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                            {p.foto
                              ? <img src={p.foto} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover' }} alt="" />
                              : <div style={{ width: 56, height: 56, borderRadius: 12, background: `${C.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
                            }
                            <button onClick={() => inputFotoRef.current[p.id]?.click()}
                              style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: C.orange, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10 }}>
                              📷
                            </button>
                            <input ref={el => { inputFotoRef.current[p.id] = el }} type="file" accept="image/*" style={{ display: 'none' }}
                              onChange={e => { if (e.target.files?.[0]) handleFoto(p.id, e.target.files[0]) }} />
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 15, color: C.text }}>{p.nome}</div>
                            {p.descricao && <div style={{ fontSize: 11, color: C.muted }}>{p.descricao}</div>}
                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                              {p.categoria && <span style={{ fontSize: 10, background: `${C.orange}18`, color: C.orange, borderRadius: 6, padding: '2px 8px' }}>{p.categoria}</span>}
                              <span style={{ fontSize: 10, background: `${p.ProdutoVariacao.reduce((s, v) => s + v.estoque, 0) > 0 ? C.green : C.red}18`, color: p.ProdutoVariacao.reduce((s, v) => s + v.estoque, 0) > 0 ? C.green : C.red, borderRadius: 6, padding: '2px 8px' }}>
                                {p.ProdutoVariacao.reduce((s, v) => s + v.estoque, 0)} em estoque
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => atualizarProduto(p.id, { ativo: !p.ativo }).then(carregar)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: p.ativo ? C.green : C.muted }}>
                              {p.ativo ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                            </button>
                            <button onClick={() => setProdutoExpandido(produtoExpandido === p.id ? null : p.id)}
                              style={{ background: `${C.orange}18`, border: `1px solid ${C.orange}44`, borderRadius: 10, padding: '6px 12px', color: C.orange, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                              Variações
                            </button>
                            <button onClick={() => excluirProduto(p.id).then(carregar)}
                              style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '6px 10px', color: C.red, cursor: 'pointer' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Variações expandidas */}
                        {produtoExpandido === p.id && (
                          <div style={{ borderTop: `1px solid ${C.border}`, padding: 16 }}>
                            <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Tamanhos, cores, preços e estoque</p>

                            {p.ProdutoVariacao.length > 0 && (
                              <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
                                {p.ProdutoVariacao.map(v => (
                                  <div key={v.id} style={{ background: '#0F0F1A', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ color: C.gold, fontFamily: SYNE, fontWeight: 700, fontSize: 13, minWidth: 40 }}>{v.tamanho || '—'}</span>
                                    {v.cor && <span style={{ color: C.muted, fontSize: 12 }}>{v.cor}</span>}
                                    <span style={{ color: C.orange, fontFamily: SYNE, fontWeight: 700, fontSize: 13 }}>{brl(v.preco)}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                                      <span style={{ fontSize: 11, color: C.muted }}>Estoque:</span>
                                      <input type="number" defaultValue={v.estoque} min={0}
                                        onBlur={e => atualizarVariacao(v.id, { estoque: Number(e.target.value) }).then(carregar)}
                                        style={{ width: 50, background: '#1A1A2E', border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 8px', color: C.text, fontSize: 12, textAlign: 'center' }} />
                                      <button onClick={() => excluirVariacao(v.id).then(carregar)}
                                        style={{ background: 'transparent', border: 'none', color: C.red, cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Nova variação */}
                            <div style={{ background: '#0F0F1A', borderRadius: 10, padding: 12 }}>
                              <p style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>+ Adicionar variação</p>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                                <Campo label="Tamanho">
                                  <input value={novaVar[p.id]?.tamanho || ''} onChange={e => setNovaVar(prev => ({ ...prev, [p.id]: { ...prev[p.id], tamanho: e.target.value } }))}
                                    placeholder="P/M/G/38..." style={inpSm} />
                                </Campo>
                                <Campo label="Cor">
                                  <input value={novaVar[p.id]?.cor || ''} onChange={e => setNovaVar(prev => ({ ...prev, [p.id]: { ...prev[p.id], cor: e.target.value } }))}
                                    placeholder="Azul, Preto..." style={inpSm} />
                                </Campo>
                                <Campo label="Preço R$">
                                  <input type="number" value={novaVar[p.id]?.preco || ''} onChange={e => setNovaVar(prev => ({ ...prev, [p.id]: { ...prev[p.id], preco: e.target.value } }))}
                                    placeholder="0,00" style={inpSm} />
                                </Campo>
                                <Campo label="Estoque">
                                  <input type="number" value={novaVar[p.id]?.estoque || ''} onChange={e => setNovaVar(prev => ({ ...prev, [p.id]: { ...prev[p.id], estoque: e.target.value } }))}
                                    placeholder="0" style={inpSm} />
                                </Campo>
                                <button onClick={() => adicionarVariacao(p.id)}
                                  style={{ background: C.orange, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA PEDIDOS */}
            {aba === 'pedidos' && (
              <div>
                {pedidos.length === 0 ? (
                  <div style={{ background: C.surface, borderRadius: 16, padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
                    <p style={{ color: C.muted }}>Nenhum pedido ainda.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {pedidos.map(ped => (
                      <div key={ped.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 15 }}>{ped.compradorNome}</div>
                            <div style={{ fontSize: 12, color: C.muted }}>{ped.compradorTelefone}</div>
                            {ped.compradorEndereco && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>📍 {ped.compradorEndereco}</div>}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 16, color: C.orange }}>{brl(ped.valor)}</div>
                            <div style={{ fontSize: 10, color: C.muted }}>{ped.tipoEntrega === 'RETIRADA' ? '🏫 Retirada' : '🚚 Entrega'}</div>
                          </div>
                        </div>

                        {/* Itens */}
                        <div style={{ background: '#0F0F1A', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
                          {(ped.itens || []).map((item: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted, padding: '3px 0' }}>
                              <span>{item.nome} {item.tamanho ? `(${item.tamanho})` : ''} {item.cor ? `- ${item.cor}` : ''} × {item.qtd}</span>
                              <span style={{ color: C.text }}>{brl(item.preco * item.qtd)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Status */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, background: `${STATUS_COR[ped.status]}22`, color: STATUS_COR[ped.status], borderRadius: 8, padding: '4px 10px' }}>
                            {ped.status}
                          </span>
                          <select value={ped.status} onChange={e => atualizarStatusPedido(ped.id, e.target.value).then(carregar)}
                            style={{ background: '#0F0F1A', border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 10px', color: C.muted, fontSize: 12, cursor: 'pointer' }}>
                            {STATUS_PEDIDO.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <span style={{ fontSize: 10, color: C.muted, marginLeft: 'auto' }}>
                            {new Date(ped.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'rgba(240,240,240,0.45)' }}>{label}{children}</label>
}
const inp: React.CSSProperties = { background: '#0F0F1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', color: '#F0F0F0', fontSize: 14, width: '100%', boxSizing: 'border-box' }
const inpSm: React.CSSProperties = { background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 10px', color: '#F0F0F0', fontSize: 13, width: '100%', boxSizing: 'border-box' }