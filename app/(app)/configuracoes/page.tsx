'use client'
import { usePerfil } from '@/lib/usePerfil'
import AdminGuard from '@/components/AdminGuard'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { salvarConfiguracoes, listarPlanos, salvarPlano, criarPlano, excluirPlano, carregarConfiguracoes } from './actions'

function ConfiguracoesInner() {
  const { escolaId } = usePerfil()
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [slug, setSlug] = useState('')
  const [planos, setPlanos] = useState<{id:string;nome:string;slug:string;valor:number}[]>([])
  const [novoPlanoNome, setNovoPlanoNome] = useState('')
  const [novoPlanoValor, setNovoPlanoValor] = useState('')
  const [salvandoPlano, setSalvandoPlano] = useState<string|null>(null)

  // Asaas
  const [asaasKey, setAsaasKey] = useState('')
  const [asaasKeyAtual, setAsaasKeyAtual] = useState('')
  const [asaasStatus, setAsaasStatus] = useState<'idle'|'verificando'|'ok'|'erro'>('idle')
  const [asaasMsgErro, setAsaasMsgErro] = useState('')
  const [salvandoAsaas, setSalvandoAsaas] = useState(false)

  const [form, setForm] = useState({
    nome: '', telefone: '', whatsapp: '', email: '',
    endereco: '', cidade: '', estado: '', cep: '',
    valorMensalidade: '150', diaVencimento: '10', valorMatricula: '0',
    instagramUrl: '', facebookUrl: '',
    multaAtraso: 0, jurosAoMes: 0, valorDesconto: 0,
  })

  const syne = 'Syne, sans-serif'
  const neon = '#FF6B00'
  const gold = '#FFD700'
  const muted = 'rgba(255,255,255,0.4)'
  const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }
  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: '#F0F0F0', fontFamily: 'Inter, sans-serif', fontSize: '13px', marginTop: '4px', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: '10px', color: muted, textTransform: 'uppercase' as const, letterSpacing: '0.8px' }
  const sectionTitle = { fontFamily: syne, fontWeight: 700, fontSize: '13px', color: neon, marginBottom: '14px' }

  useEffect(() => {
    const saved = localStorage.getItem('configuracoes_saved')
    if (saved === 'true') {
      setSucesso(true)
      localStorage.removeItem('configuracoes_saved')
      setTimeout(() => setSucesso(false), 4000)
    }
    async function carregar() {
      const { data } = await supabase.from('Escola').select('*').eq('id', escolaId!).single()
      if (data) {
        setSlug(data.slug || '')
        listarPlanos().then(setPlanos).catch(() => {})
        if (data.asaasApiKey) {
          setAsaasKeyAtual(data.asaasApiKey)
          setAsaasStatus('ok')
        }
        setForm({
          nome: data.nome || '', telefone: data.telefone || '',
          whatsapp: data.whatsapp || '', email: data.email || '',
          endereco: data.endereco || '', cidade: data.cidade || '',
          estado: data.estado || '', cep: data.cep || '',
          valorMensalidade: data.valorMensalidade?.toString() || '150',
          valorMatricula: data.valorMatricula?.toString() || '0',
          diaVencimento: data.diaVencimento?.toString() || '10',
          instagramUrl: data.instagramUrl || '', facebookUrl: data.facebookUrl || '',
          multaAtraso: Number(data.multaAtraso || 0),
          jurosAoMes: Number(data.jurosAoMes || 0),
          valorDesconto: Number(data.valorDesconto || 0),
        })
      }
      setLoading(false)
    }
    carregar()
  }, [escolaId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function verificarChaveAsaas(chave: string) {
    if (!chave.trim()) return
    setAsaasStatus('verificando')
    setAsaasMsgErro('')
    try {
      const res = await fetch('https://api.asaas.com/v3/customers?limit=1', {
        headers: { 'access_token': chave.trim(), 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        setAsaasStatus('ok')
      } else {
        setAsaasStatus('erro')
        setAsaasMsgErro('Chave inválida ou sem permissão. Verifique no painel Asaas.')
      }
    } catch {
      setAsaasStatus('erro')
      setAsaasMsgErro('Erro de conexão. Tente novamente.')
    }
  }

  async function salvarChaveAsaas() {
    if (!asaasKey.trim()) return
    setSalvandoAsaas(true)
    const result = await salvarConfiguracoes({
      ...form,
      valorMensalidade: parseFloat(form.valorMensalidade) || 0,
        valorMatricula: parseFloat((form as any).valorMatricula) || 0,
      diaVencimento: parseInt(form.diaVencimento) || 10,
      asaasApiKey: asaasKey.trim(),
    })
    setSalvandoAsaas(false)
    if (result.ok) {
      setAsaasKeyAtual(asaasKey.trim())
      setAsaasKey('')
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    } else {
      setErro(result.message || 'Erro ao salvar chave.')
    }
  }

  async function salvar() {
    setSalvando(true)
    setErro('')
    const result = await salvarConfiguracoes({
      nome: form.nome, telefone: form.telefone, whatsapp: form.whatsapp,
      email: form.email, endereco: form.endereco, cidade: form.cidade,
      estado: form.estado, cep: form.cep,
      valorMensalidade: parseFloat(form.valorMensalidade) || 0,
        valorMatricula: parseFloat((form as any).valorMatricula) || 0,
      diaVencimento: parseInt(form.diaVencimento) || 10,
      instagramUrl: form.instagramUrl, facebookUrl: form.facebookUrl,
      multaAtraso: form.multaAtraso, jurosAoMes: form.jurosAoMes,
      valorDesconto: form.valorDesconto,
    })
    setSalvando(false)
    if (!result.ok) { setErro(result.message || 'Erro ao salvar.'); return }
    localStorage.setItem('configuracoes_saved', 'true')
    window.location.reload()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: muted, fontFamily: 'Inter, sans-serif' }}>Carregando...</p>
    </div>
  )

  const keyMasked = asaasKeyAtual
    ? asaasKeyAtual.slice(0, 12) + '••••••••••••••••••••' + asaasKeyAtual.slice(-4)
    : ''

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', color: '#F0F0F0', fontFamily: 'Inter, sans-serif' }}>

      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <a href="/dashboard" style={{ color: muted, fontSize: '13px', textDecoration: 'none' }}>Voltar</a>
          <div>
            <div style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2px' }}>Escola</div>
            <div style={{ fontFamily: syne, fontSize: '24px', fontWeight: 800, color: '#F0F0F0' }}>Configuracoes</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>

        {sucesso && (
          <div style={{ background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center', marginBottom: '16px' }}>
            <p style={{ color: '#00C896', fontFamily: syne, fontWeight: 800, margin: 0 }}>✅ Salvo com sucesso!</p>
          </div>
        )}

        {erro && (
          <div style={{ background: 'rgba(255,70,70,0.1)', border: '1px solid rgba(255,70,70,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center', marginBottom: '16px' }}>
            <p style={{ color: '#ff5555', fontFamily: syne, fontWeight: 700, margin: 0 }}>{erro}</p>
          </div>
        )}

        {/* Dados da escola */}
        <div style={card}>
          <p style={sectionTitle}>Dados da Escola</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div><label style={labelStyle}>Nome da escola</label><input name="nome" value={form.nome} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>E-mail</label><input name="email" value={form.email} onChange={handleChange} type="email" style={inputStyle} placeholder="email@escola.com" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label style={labelStyle}>Telefone</label><input name="telefone" value={form.telefone} onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>WhatsApp</label><input name="whatsapp" value={form.whatsapp} onChange={handleChange} style={inputStyle} /></div>
            </div>
          </div>
        </div>

        {/* Endereco */}
        <div style={card}>
          <p style={sectionTitle}>Endereco</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div><label style={labelStyle}>CEP</label><input name="cep" value={form.cep} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Endereco</label><input name="endereco" value={form.endereco} onChange={handleChange} style={inputStyle} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div><label style={labelStyle}>Cidade</label><input name="cidade" value={form.cidade} onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>UF</label><input name="estado" value={form.estado} onChange={handleChange} maxLength={2} style={inputStyle} /></div>
            </div>
          </div>
        </div>

        {/* Financeiro */}
        <div style={card}>
          <p style={sectionTitle}>Financeiro</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div><label style={labelStyle}>Mensalidade (R$)</label><input name="valorMensalidade" value={form.valorMensalidade} onChange={handleChange} type="number" style={inputStyle} /></div>
              <div><label style={labelStyle}>Taxa de Matrícula (R$)</label><input name="valorMatricula" value={(form as any).valorMatricula || '0'} onChange={handleChange} type="number" style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Dia de vencimento</label>
                <select name="diaVencimento" value={form.diaVencimento} onChange={handleChange} style={inputStyle}>
                  {[1, 5, 10, 15, 20, 25, 30].map(d => <option key={d} value={d}>Dia {d}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div><label style={labelStyle}>Desconto antecip. (R$)</label><input name="valorDesconto" value={form.valorDesconto} onChange={e => setForm(p => ({...p, valorDesconto: Number(e.target.value)}))} type="number" style={inputStyle} /></div>
              <div><label style={labelStyle}>Multa atraso (R$)</label><input name="multaAtraso" value={form.multaAtraso} onChange={e => setForm(p => ({...p, multaAtraso: Number(e.target.value)}))} type="number" style={inputStyle} /></div>
              <div><label style={labelStyle}>Juros/mes (%)</label><input name="jurosAoMes" value={form.jurosAoMes} onChange={e => setForm(p => ({...p, jurosAoMes: Number(e.target.value)}))} type="number" style={inputStyle} /></div>
            </div>
          </div>
        </div>

        {/* Redes Sociais */}
        <div style={card}>
          <p style={sectionTitle}>Redes Sociais</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div><label style={labelStyle}>Instagram</label><input name="instagramUrl" value={form.instagramUrl} onChange={handleChange} style={inputStyle} placeholder="https://instagram.com/suaescola" /></div>
            <div><label style={labelStyle}>Facebook</label><input name="facebookUrl" value={form.facebookUrl} onChange={handleChange} style={inputStyle} placeholder="https://facebook.com/suaescola" /></div>
          </div>
        </div>

        {/* INTEGRACAO ASAAS */}
        <div style={{ background: 'rgba(0,168,255,0.06)', border: '1px solid rgba(0,168,255,0.2)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>🏦</span>
            <p style={{ fontFamily: syne, fontWeight: 800, fontSize: '14px', color: '#38bdf8', margin: 0 }}>Integração Asaas</p>
            {asaasStatus === 'ok' && (
              <span style={{ marginLeft: 'auto', background: 'rgba(0,200,150,0.15)', border: '1px solid rgba(0,200,150,0.4)', color: '#00C896', borderRadius: '20px', padding: '3px 10px', fontSize: '10px', fontWeight: 700 }}>✅ ATIVO</span>
            )}
            {asaasStatus === 'erro' && (
              <span style={{ marginLeft: 'auto', background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.4)', color: '#FF4444', borderRadius: '20px', padding: '3px 10px', fontSize: '10px', fontWeight: 700 }}>❌ ERRO</span>
            )}
          </div>

          <p style={{ fontSize: '12px', color: muted, marginBottom: '14px', lineHeight: '1.5' }}>
            Conecte sua conta Asaas para gerar cobranças PIX e boletos automaticamente para os responsáveis.
          </p>

          {/* Passo a passo */}
          <div style={{ background: 'rgba(0,168,255,0.06)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
            <p style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Como conectar</p>
            {[
              { n: '1', txt: 'Acesse asaas.com e faça login na sua conta' },
              { n: '2', txt: 'Vá em Configurações → Integração → Chave de API' },
              { n: '3', txt: 'Clique em "Gerar nova chave" e copie' },
              { n: '4', txt: 'Cole a chave abaixo e clique em Verificar' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '6px' }}>
                <span style={{ background: 'rgba(56,189,248,0.2)', color: '#38bdf8', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, flexShrink: 0 }}>{s.n}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>{s.txt}</span>
              </div>
            ))}
            <a href="https://asaas.com" target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', fontWeight: 700, textDecoration: 'none', fontFamily: syne }}>
              🔗 Abrir painel Asaas
            </a>
          </div>

          {/* Chave atual */}
          {asaasKeyAtual && (
            <div style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.2)', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '14px' }}>🔑</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '10px', color: muted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Chave atual</p>
                <p style={{ fontSize: '12px', color: '#00C896', fontFamily: 'monospace', margin: 0 }}>{keyMasked}</p>
              </div>
            </div>
          )}

          {/* Campo da chave */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ ...labelStyle, display: 'block', marginBottom: '6px' }}>
              {asaasKeyAtual ? 'Nova chave (para substituir)' : 'Chave de API *'}
            </label>
            <textarea
              value={asaasKey}
              onChange={e => { setAsaasKey(e.target.value); setAsaasStatus('idle'); setAsaasMsgErro('') }}
              placeholder="Cole aqui sua chave Asaas — começa com $aact_..."
              rows={3}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: asaasStatus === 'erro' ? '1px solid rgba(255,68,68,0.5)' : asaasStatus === 'ok' && asaasKey ? '1px solid rgba(0,200,150,0.5)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px', color: '#F0F0F0', fontFamily: 'monospace', fontSize: '12px', resize: 'none', boxSizing: 'border-box' as const, lineHeight: '1.5' }}
            />
            {asaasMsgErro && <p style={{ color: '#FF4444', fontSize: '11px', marginTop: '4px' }}>{asaasMsgErro}</p>}
          </div>

          {/* Botoes */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => verificarChaveAsaas(asaasKey)}
              disabled={!asaasKey.trim() || asaasStatus === 'verificando'}
              style={{ flex: 1, background: asaasStatus === 'ok' && asaasKey ? 'rgba(0,200,150,0.15)' : 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: asaasStatus === 'ok' && asaasKey ? '#00C896' : '#38bdf8', borderRadius: '10px', padding: '12px', fontSize: '13px', fontFamily: syne, fontWeight: 700, cursor: asaasKey.trim() ? 'pointer' : 'not-allowed', opacity: !asaasKey.trim() ? 0.5 : 1 }}>
              {asaasStatus === 'verificando' ? '⏳ Verificando...' : asaasStatus === 'ok' && asaasKey ? '✅ Chave válida!' : '⚡ Verificar chave'}
            </button>
            <button
              onClick={salvarChaveAsaas}
              disabled={!asaasKey.trim() || asaasStatus !== 'ok' || salvandoAsaas}
              style={{ flex: 1, background: asaasStatus === 'ok' && asaasKey ? '#FF6B00' : 'rgba(255,255,255,0.05)', border: 'none', color: asaasStatus === 'ok' && asaasKey ? '#000' : muted, borderRadius: '10px', padding: '12px', fontSize: '13px', fontFamily: syne, fontWeight: 800, cursor: asaasStatus === 'ok' && asaasKey ? 'pointer' : 'not-allowed', opacity: salvandoAsaas ? 0.6 : 1 }}>
              {salvandoAsaas ? 'Salvando...' : '💾 Salvar chave'}
            </button>
          </div>

          {asaasStatus === 'ok' && !asaasKey && (
            <p style={{ fontSize: '11px', color: '#00C896', textAlign: 'center', marginTop: '10px' }}>
              ✅ Integração ativa — cobranças PIX e boletos funcionando normalmente.
            </p>
          )}
        </div>

        {/* Planos de Mensalidade */}
        <div style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '13px', color: gold, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>💰 Planos de Mensalidade</p>
          {planos.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ flex: 1, fontSize: '13px', color: '#F0F0F0', fontWeight: 600 }}>{p.nome}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: muted }}>R$</span>
                <input
                  type="number"
                  defaultValue={p.valor}
                  onBlur={async e => {
                    const novoValor = Number(e.target.value)
                    if (novoValor === p.valor) return
                    setSalvandoPlano(p.id)
                    await salvarPlano(p.id, novoValor).catch(() => {})
                    setPlanos(prev => prev.map(x => x.id === p.id ? { ...x, valor: novoValor } : x))
                    setSalvandoPlano(null)
                  }}
                  style={{ width: '80px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px', padding: '8px', color: gold, fontFamily: syne, fontWeight: 700, fontSize: '13px', textAlign: 'center' }}
                />
                {salvandoPlano === p.id && <span style={{ fontSize: '10px', color: muted }}>...</span>}
                <button onClick={async () => { if (confirm('Excluir plano ' + p.nome + '?')) { await excluirPlano(p.id); setPlanos(prev => prev.filter(x => x.id !== p.id)) } }}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,70,70,0.6)', cursor: 'pointer', fontSize: '16px', padding: '4px' }}>×</button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <input value={novoPlanoNome} onChange={e => setNovoPlanoNome(e.target.value)} placeholder="Nome do plano" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 10px', color: '#F0F0F0', fontSize: '12px' }} />
            <input value={novoPlanoValor} onChange={e => setNovoPlanoValor(e.target.value)} type="number" placeholder="R$" style={{ width: '70px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', color: '#F0F0F0', fontSize: '12px' }} />
            <button onClick={async () => {
              if (!novoPlanoNome || !novoPlanoValor) return
              await criarPlano(novoPlanoNome, Number(novoPlanoValor))
              await listarPlanos().then(setPlanos)
              setNovoPlanoNome(''); setNovoPlanoValor('')
            }} style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)', color: gold, borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontFamily: syne, fontWeight: 700, cursor: 'pointer' }}>+ Adicionar</button>
          </div>
        </div>

        {/* Links Publicos */}
        {slug && (
          <div style={{ background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
            <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '13px', color: neon, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>🔗 Links Públicos</p>
            <p style={{ fontSize: '11px', color: muted, marginBottom: '12px' }}>Compartilhe estes links com os responsáveis e clientes.</p>
            {[
              { label: '🛍️ Loja', url: 'https://gestaofc.com.br/loja/' + slug },
              { label: '📷 Galeria', url: 'https://gestaofc.com.br/galeria/' + slug },
            ].map(({ label, url }) => (
              <div key={label} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{label}</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{url}</div>
                  <button onClick={() => { navigator.clipboard.writeText(url) }}
                    style={{ background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', color: neon, borderRadius: '10px', padding: '10px 14px', fontSize: '11px', fontFamily: syne, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                    Copiar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Botao salvar */}
        <button onClick={salvar} disabled={salvando} style={{ width: '100%', background: 'linear-gradient(135deg,#FF6B00,#FF8C00)', color: '#000', padding: '16px', borderRadius: '14px', fontFamily: syne, fontWeight: 800, fontSize: '15px', border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(255,107,0,0.3)', marginBottom: '10px', opacity: salvando ? 0.6 : 1 }}>
          {salvando ? 'Salvando...' : 'Salvar Configuracoes'}
        </button>

        <a href="/branding" style={{ display: 'block', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', padding: '14px', borderRadius: '14px', fontFamily: syne, fontWeight: 700, fontSize: '13px', textAlign: 'center', textDecoration: 'none', marginBottom: '10px' }}>
          Personalizar Visual do App
        </a>

        <a href="/mensagens-cobranca" style={{ display: 'block', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', padding: '14px', borderRadius: '14px', fontFamily: syne, fontWeight: 700, fontSize: '13px', textAlign: 'center', textDecoration: 'none', marginBottom: '10px' }}>
          Personalizar Mensagens WhatsApp
        </a>
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 0 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(10px)' }}>
        {[
          { href: '/dashboard', label: 'Inicio' },
          { href: '/atletas', label: 'Atletas' },
          { href: '/presenca', label: 'Presenca' },
          { href: '/financeiro', label: 'Financeiro' },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: muted, fontFamily: syne }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}

export default function Configuracoes(props: any) {
  return <AdminGuard><ConfiguracoesInner {...props} /></AdminGuard>
}
