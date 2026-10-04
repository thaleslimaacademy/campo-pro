'use client'
import { useState } from 'react'
import { ativarDebitoAutomatico } from './actions'

export default function AtivarDebitoAutomatico({ token, valorMensalidade, jaAtivo }: { token: string; valorMensalidade: number | null; jaAtivo: boolean }) {
  const [aberto, setAberto] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [form, setForm] = useState({ nomeTitular: '', numeroCartao: '', validadeMes: '', validadeAno: '', cvv: '', cpfTitular: '', cep: '', numeroEndereco: '' })

  function campo(chave: keyof typeof form) {
    return { value: form[chave], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [chave]: e.target.value })) }
  }

  async function enviar() {
    setErro('')
    const faltando = Object.entries(form).some(([, v]) => !v.trim())
    if (faltando) { setErro('Preencha todos os campos.'); return }
    setEnviando(true)
    try {
      await ativarDebitoAutomatico(token, form)
      setSucesso(true)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: '#FFFFFF', border: '1px solid rgba(16,24,40,0.1)', borderRadius: 10, padding: '10px 12px', color: '#1F2937', fontSize: 13, boxSizing: 'border-box' }

  if (jaAtivo || sucesso) {
    return (
      <div className="rounded-2xl p-4 border" style={{ background: 'rgba(46,168,102,0.05)', borderColor: 'rgba(46,168,102,0.25)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#2EA866' }}>✅ Débito automático ativo</p>
        <p className="text-xs text-gray-500">A mensalidade é cobrada automaticamente no cartão cadastrado. Não é necessário fazer nada todo mês.</p>
      </div>
    )
  }

  if (!valorMensalidade) return null

  return (
    <div className="rounded-2xl p-4 border" style={{ background: '#FFFFFF', borderColor: 'rgba(212,175,55,0.2)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#B7791F' }}>💳 Débito automático</p>

      {!aberto ? (
        <>
          <p className="text-xs text-gray-500 mb-3">Cadastre o cartão uma vez e nunca mais se preocupe em pagar a mensalidade — cobramos sozinhos, todo mês, no vencimento.</p>
          <button onClick={() => setAberto(true)}
            className="w-full py-3 rounded-xl font-black text-sm"
            style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: '#B7791F', fontFamily: 'Syne, sans-serif' }}>
            Ativar débito automático
          </button>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input placeholder="Nome impresso no cartão" style={inputStyle} {...campo('nomeTitular')} />
          <input placeholder="Número do cartão" inputMode="numeric" style={inputStyle} {...campo('numeroCartao')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <input placeholder="Mês (MM)" inputMode="numeric" style={inputStyle} {...campo('validadeMes')} />
            <input placeholder="Ano (AAAA)" inputMode="numeric" style={inputStyle} {...campo('validadeAno')} />
            <input placeholder="CVV" inputMode="numeric" style={inputStyle} {...campo('cvv')} />
          </div>
          <input placeholder="CPF do titular do cartão" inputMode="numeric" style={inputStyle} {...campo('cpfTitular')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input placeholder="CEP" inputMode="numeric" style={inputStyle} {...campo('cep')} />
            <input placeholder="Número do endereço" inputMode="numeric" style={inputStyle} {...campo('numeroEndereco')} />
          </div>

          {erro && <p style={{ color: '#DC2626', fontSize: 12 }}>{erro}</p>}

          <button onClick={enviar} disabled={enviando}
            style={{ width: '100%', padding: '12px', borderRadius: 12, fontWeight: 900, fontSize: 13, marginTop: 4, background: '#2EA866', color: '#1F2937', fontFamily: 'Syne, sans-serif', border: 'none', cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.6 : 1 }}>
            {enviando ? 'Processando…' : `Confirmar — R$ ${valorMensalidade.toFixed(2)}/mês`}
          </button>
          <p style={{ fontSize: 10, color: '#6B7280', textAlign: 'center', marginTop: 2 }}>
            Pagamento processado com segurança pela Asaas. O sistema não guarda os dados do seu cartão.
          </p>
          <button onClick={() => setAberto(false)} style={{ background: 'transparent', border: 'none', color: '#6B7280', fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
