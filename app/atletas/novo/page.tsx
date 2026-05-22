'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NovoAtleta() {
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const dados = new FormData(form)
    const atletaId = crypto.randomUUID()
    const tokenPais = crypto.randomUUID()

    const { error: erroAtleta } = await supabase.from('Atleta').insert({
      id: atletaId,
      escolaId: 'escola-demo',
      nome: dados.get('nome'),
      dataNascimento: dados.get('nascimento'),
      posicao: dados.get('posicao'),
      tokenPais,
      ativo: true,
    })

    if (erroAtleta) {
      alert('Erro: ' + erroAtleta.message)
      setLoading(false)
      return
    }

    await supabase.from('Responsavel').insert({
      id: crypto.randomUUID(),
      atletaId,
      nome: dados.get('responsavel'),
      telefone: dados.get('whatsapp'),
      whatsapp: dados.get('whatsapp'),
      principal: true,
    })

    setSucesso(true)
    setLoading(false)
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <p className="text-6xl mb-4">🎉</p>
        <h2 className="text-2xl font-bold mb-2">Atleta cadastrado!</h2>
        <a href="/atletas" className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold mt-4">Ver atletas</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <a href="/atletas" className="text-gray-400">← Voltar</a>
        <h1 className="text-xl font-bold">Novo Atleta</h1>
      </div>
      <form onSubmit={salvar} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">Nome completo *</label>
          <input name="nome" required type="text" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: João Silva"/>
        </div>
        <div>
          <label className="text-sm text-gray-400">Data de nascimento *</label>
          <input name="nascimento" required type="date" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white"/>
        </div>
        <div>
          <label className="text-sm text-gray-400">Posição</label>
          <select name="posicao" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white">
            <option>Goleiro</option>
            <option>Zagueiro</option>
            <option>Lateral</option>
            <option>Volante</option>
            <option>Meia</option>
            <option>Atacante</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-400">Nome do responsável *</label>
          <input name="responsavel" required type="text" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: Maria Silva"/>
        </div>
        <div>
          <label className="text-sm text-gray-400">WhatsApp do responsável *</label>
          <input name="whatsapp" required type="tel" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="(34) 99999-9999"/>
        </div>
        <button disabled={loading} type="submit" className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg mt-4 disabled:opacity-50">
          {loading ? 'Salvando...' : 'Salvar Atleta'}
        </button>
      </form>
    </div>
  )
}