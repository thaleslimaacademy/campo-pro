'use client'
import { usePerfil } from '@/lib/usePerfil'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Professor {
  id: string
  nome: string
  email: string
  telefone: string
  whatsapp: string
  cargo: string
  fotoUrl: string
  ativo: boolean
  contaCriada: boolean
  tokenConvite: string
  createdAt: string
}

export default function ComissaoTecnica() {
  const { escolaId } = usePerfil()
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    whatsapp: '',
    cargo: 'Professor',
  })

  async function carregar() {
    const { data } = await supabase
      .from('Professor')
      .select('*')
      .eq('escolaId', escolaId!)
      .order('createdAt', { ascending: false })
    setProfessores(data || [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function salvar() {
    if (!form.nome || !form.email) return alert('Nome e e-mail são obrigatórios.')
    setSalvando(true)
    const { error } = await supabase.from('Professor').insert({
      escolaId: escolaId!,
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      whatsapp: form.whatsapp,
      cargo: form.cargo,
      ativo: true,
      contaCriada: false,
    })
    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      setSucesso(true)
      setForm({ nome: '', email: '', telefone: '', whatsapp: '', cargo: 'Professor' })
      setShowForm(false)
      carregar()
      setTimeout(() => setSucesso(false), 3000)
    }
    setSalvando(false)
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from('Professor').update({ ativo: !ativo }).eq('id', id)
    carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este membro?')) return
    await supabase.from('Professor').delete().eq('id', id)
    carregar()
  }

  function copiarLink(token: string, whatsapp: string, nome: string) {
    const link = 'https://campo-pro.vercel.app/convite/' + token
    navigator.clipboard.writeText(link)
    setCopiado(token)
    setTimeout(() => setCopiado(null), 3000)
  }

  function enviarWhatsApp(token: string, whatsapp: string, nome: string) {
    const link = 'https://campo-pro.vercel.app/convite/' + token
    const numero = whatsapp.replace(/\D/g, '')
    const numeroFormatado = numero.startsWith('55') ? numero : '55' + numero
    const mensagem = encodeURIComponent(
      'Olá ' + nome + '! 👋\n\nVocê foi convidado para fazer parte da Comissão Técnica da *Thales Lima Football Academy*.\n\nAcesse o link abaixo para criar sua conta e ter acesso ao app:\n\n' + link + '\n\n_Este link é exclusivo e intransferível._'
    )
    window.open('https://wa.me/' + numeroFormatado + '?text=' + mensagem, '_blank')
  }

  const cargos = ['Professor', 'Treinador', 'Auxiliar Técnico', 'Preparador Físico', 'Goleiro Treinador', 'Coordenador']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-gray-400">← Voltar</a>
          <h1 className="text-xl font-bold">👨‍💼 Comissão Técnica</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
        >
          {showForm ? 'Fechar' : '+ Adicionar'}
        </button>
      </div>

      {sucesso && (
        <div className="bg-green-600 rounded-xl p-3 mb-4 text-center">
          <p className="text-white font-bold">✅ Membro adicionado!</p>
        </div>
      )}

      {showForm && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
          <p className="text-green-500 font-bold text-sm mb-4">Novo Membro</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400">Nome completo *</label>
              <input name="nome" value={form.nome} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Nome do professor" />
            </div>
            <div>
              <label className="text-sm text-gray-400">E-mail *</label>
              <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="email@professor.com" />
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
            <div>
              <label className="text-sm text-gray-400">Cargo</label>
              <select name="cargo" value={form.cargo} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white">
                {cargos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={salvar} disabled={salvando} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {professores.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">👨‍💼</p>
          <p className="text-gray-400">Nenhum membro cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {professores.map(p => (
            <div key={p.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center text-xl">👤</div>
                  <div>
                    <p className="font-bold text-white">{p.nome}</p>
                    <p className="text-green-500 text-sm">{p.cargo}</p>
                    <p className="text-gray-400 text-xs">{p.email}</p>
                    {p.whatsapp && <p className="text-gray-400 text-xs">📱 {p.whatsapp}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <span className={'text-xs px-2 py-1 rounded-full font-bold ' + (p.ativo ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400')}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className={'text-xs px-2 py-1 rounded-full ' + (p.contaCriada ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-700 text-gray-400')}>
                    {p.contaCriada ? '✅ Conta criada' : '⏳ Aguardando'}
                  </span>
                </div>
              </div>

              {!p.contaCriada && p.tokenConvite && (
                <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-3 mb-3">
                  <p className="text-yellow-400 text-xs font-bold mb-2">🔗 Link de Convite</p>
                  <p className="text-gray-400 text-xs break-all mb-2">
                    {'campo-pro.vercel.app/convite/' + p.tokenConvite.slice(0, 16) + '...'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copiarLink(p.tokenConvite, p.whatsapp, p.nome)}
                      className="flex-1 bg-gray-800 text-gray-300 py-1 rounded-lg text-xs font-bold"
                    >
                      {copiado === p.tokenConvite ? '✅ Copiado!' : '📋 Copiar'}
                    </button>
                    {p.whatsapp && (
                      <button
                        onClick={() => enviarWhatsApp(p.tokenConvite, p.whatsapp, p.nome)}
                        className="flex-1 bg-green-600/20 text-green-400 py-1 rounded-lg text-xs font-bold"
                      >
                        📲 WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => toggleAtivo(p.id, p.ativo)} className="flex-1 text-xs bg-gray-800 text-gray-300 px-2 py-2 rounded-lg">
                  {p.ativo ? '🔒 Bloquear' : '🔓 Ativar'}
                </button>
                <button onClick={() => excluir(p.id)} className="text-xs bg-red-600/20 text-red-400 px-3 py-2 rounded-lg">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br />Início</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br />Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br />Presença</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br />Financeiro</a>
      </nav>
    </div>
  )
}