'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function NovoAtleta() {
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  async function buscarCep(cep: string) {
    if (cep.length !== 8) return
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await res.json()
    if (!data.erro) {
      const form = document.querySelector('form') as HTMLFormElement
      ;(form.querySelector('[name="endereco"]') as HTMLInputElement).value = data.logradouro
      ;(form.querySelector('[name="bairro"]') as HTMLInputElement).value = data.bairro
      ;(form.querySelector('[name="cidade"]') as HTMLInputElement).value = data.localidade
      ;(form.querySelector('[name="estado"]') as HTMLInputElement).value = data.uf
    }
  }

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const dados = new FormData(form)
    const atletaId = crypto.randomUUID()
    const tokenPais = crypto.randomUUID()

    const { error } = await supabase.from('Atleta').insert({
      id: atletaId,
      escolaId: 'escola-demo',
      nome: dados.get('nome'),
      dataNascimento: dados.get('nascimento'),
      posicao: dados.get('posicao'),
      cpf: dados.get('cpf'),
      rg: dados.get('rg'),
      telefone: dados.get('telefone'),
      cep: dados.get('cep'),
      endereco: dados.get('endereco'),
      numero: dados.get('numero'),
      bairro: dados.get('bairro'),
      cidade: dados.get('cidade'),
      estado: dados.get('estado'),
      tokenPais,
      ativo: true,
    })

    if (error) {
      alert('Erro: ' + error.message)
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

        <p className="text-green-500 font-bold text-sm uppercase">Dados Pessoais</p>
        <div>
          <label className="text-sm text-gray-400">Nome completo *</label>
          <input name="nome" required type="text" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: João Silva"/>
        </div>
        <div>
          <label className="text-sm text-gray-400">Data de nascimento *</label>
          <input name="nascimento" required type="date" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white"/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-400">CPF</label>
            <input name="cpf" type="text" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="000.000.000-00"/>
          </div>
          <div>
            <label className="text-sm text-gray-400">RG</label>
            <input name="rg" type="text" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="0000000"/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
            <label className="text-sm text-gray-400">Telefone</label>
            <input name="telefone" type="tel" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="(34) 99999-9999"/>
          </div>
        </div>

        <p className="text-green-500 font-bold text-sm uppercase pt-2">Endereço</p>
        <div>
          <label className="text-sm text-gray-400">CEP</label>
          <input name="cep" type="text" maxLength={8} onChange={e => buscarCep(e.target.value.replace(/\D/g, ''))} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="00000000"/>
          <p className="text-xs text-gray-500 mt-1">Digite o CEP para preencher automaticamente</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Endereço</label>
          <input name="endereco" type="text" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Rua, Avenida..."/>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-400">Número</label>
            <input name="numero" type="text" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="123"/>
          </div>
          <div className="col-span-2">
            <label className="text-sm text-gray-400">Bairro</label>
            <input name="bairro" type="text" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Bairro"/>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-sm text-gray-400">Cidade</label>
            <input name="cidade" type="text" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Cidade"/>
          </div>
          <div>
            <label className="text-sm text-gray-400">Estado</label>
            <input name="estado" type="text" maxLength={2} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="MG"/>
          </div>
        </div>

        <p className="text-green-500 font-bold text-sm uppercase pt-2">Responsável</p>
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