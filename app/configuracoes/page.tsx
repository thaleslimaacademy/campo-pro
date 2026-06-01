'use client'
import { usePerfil } from '@/lib/usePerfil'
import AdminGuard from '@/components/AdminGuard'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { salvarConfiguracoes } from './actions'

function ConfiguracoesInner() {
  const { escolaId } = usePerfil()
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    whatsapp: '',
    email: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    valorMensalidade: '150',
    diaVencimento: '10',
    instagramUrl: '',
    facebookUrl: '',
  })

  useEffect(() => {
    // Checa se veio de um save bem-sucedido
    const saved = localStorage.getItem('configuracoes_saved')
    if (saved === 'true') {
      setSucesso(true)
      localStorage.removeItem('configuracoes_saved')
      setTimeout(() => setSucesso(false), 4000)
    }

    async function carregar() {
      const { data, error } = await supabase
        .from('Escola')
        .select('*')
        .eq('id', escolaId!)
        .single()

      if (error) console.error('[carregar escola]', error)

      if (data) {
        setForm({
          nome: data.nome || '',
          telefone: data.telefone || '',
          whatsapp: data.whatsapp || '',
          email: data.email || '',
          endereco: data.endereco || '',
          cidade: data.cidade || '',
          estado: data.estado || '',
          cep: data.cep || '',
          valorMensalidade: data.valorMensalidade?.toString() || '150',
          diaVencimento: data.diaVencimento?.toString() || '10',
          instagramUrl: data.instagramUrl || '',
          facebookUrl: data.facebookUrl || '',
        })
      }
      setLoading(false)
    }
    carregar()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function salvar() {
    setSalvando(true)
    setErro('')

    const result = await salvarConfiguracoes({
      nome: form.nome,
      telefone: form.telefone,
      whatsapp: form.whatsapp,
      email: form.email,
      endereco: form.endereco,
      cidade: form.cidade,
      estado: form.estado,
      cep: form.cep,
      valorMensalidade: parseFloat(form.valorMensalidade) || 0,
      diaVencimento: parseInt(form.diaVencimento) || 10,
      instagramUrl: form.instagramUrl,
      facebookUrl: form.facebookUrl,
    })

    setSalvando(false)

    if (!result.ok) {
      setErro(result.message || 'Erro ao salvar.')
      return
    }

    // Salva flag no localStorage e recarrega a página
    localStorage.setItem('configuracoes_saved', 'true')
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <a href="/dashboard" className="text-gray-400">← Voltar</a>
        <h1 className="text-xl font-bold">⚙️ Configurações</h1>
      </div>

      {sucesso && (
        <div className="bg-green-600 rounded-xl p-4 mb-4 text-center">
          <p className="text-white font-bold text-lg">✅ Configurações salvas com sucesso!</p>
        </div>
      )}

      {erro && (
        <div className="bg-red-600 rounded-xl p-4 mb-4 text-center">
          <p className="text-white font-bold">❌ {erro}</p>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-green-500 font-bold text-sm mb-4">🏫 Dados da Escola</p>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-400">Nome da escola</label>
            <input name="nome" value={form.nome} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-400">E-mail</label>
            <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="email@escola.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400">Telefone</label>
              <input name="telefone" value={form.telefone} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="(34) 9999-9999" />
            </div>
            <div>
              <label className="text-sm text-gray-400">WhatsApp</label>
              <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="5534999999999" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-green-500 font-bold text-sm mb-4">📍 Endereço</p>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-400">CEP</label>
            <input name="cep" value={form.cep} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="00000-000" />
          </div>
          <div>
            <label className="text-sm text-gray-400">Endereço</label>
            <input name="endereco" value={form.endereco} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Rua, número..." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-sm text-gray-400">Cidade</label>
              <input name="cidade" value={form.cidade} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Estado</label>
              <input name="estado" value={form.estado} onChange={handleChange} maxLength={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-green-500 font-bold text-sm mb-4">💰 Financeiro</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-400">Mensalidade padrão (R$)</label>
            <input name="valorMensalidade" value={form.valorMensalidade} onChange={handleChange} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-400">Dia de vencimento</label>
            <select name="diaVencimento" value={form.diaVencimento} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white">
              {[1, 5, 10, 15, 20, 25, 30].map(d => (
                <option key={d} value={d}>Dia {d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
        <p className="text-green-500 font-bold text-sm mb-4">📱 Redes Sociais</p>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-400">Instagram</label>
            <input name="instagramUrl" value={form.instagramUrl} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="https://instagram.com/suaescola" />
          </div>
          <div>
            <label className="text-sm text-gray-400">Facebook</label>
            <input name="facebookUrl" value={form.facebookUrl} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="https://facebook.com/suaescola" />
          </div>
        </div>
      </div>

      <button
        onClick={salvar}
        disabled={salvando}
        className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 transition-colors"
      >
        {salvando ? '⏳ Salvando...' : '💾 Salvar Configurações'}
      </button>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br />Início</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br />Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br />Presença</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br />Financeiro</a>
      </nav>
    </div>
  )
}
export default function Configuracoes(props: any) {
  return (
    <AdminGuard>
      <ConfiguracoesInner {...props} />
    </AdminGuard>
  )
}
