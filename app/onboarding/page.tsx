'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'

export default function Onboarding() {
  const { user } = useUser()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nomeEscola: '',
    cidade: '',
    estado: 'MG',
    telefone: '',
    whatsapp: '',
    email: '',
    responsavel: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function finalizar() {
    if (!form.nomeEscola || !form.responsavel || !form.whatsapp) {
      setErro('Preencha os campos obrigatorios.')
      return
    }
    setSalvando(true)
    setErro('')

    const slug = form.nomeEscola.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30) + '-' + Date.now().toString().slice(-4)
    const escolaId = 'escola-' + slug

    const { error: escolaError } = await supabaseAdmin.from('Escola').insert({
      escolaId,
      slug,
      nome: form.nomeEscola,
      cidade: form.cidade,
      estado: form.estado,
      telefone: form.telefone,
      whatsapp: form.whatsapp,
      email: form.email || user?.emailAddresses[0]?.emailAddress,
      clerkUserId: user?.id,
      plano: 'basico',
      statusPlano: 'TRIAL',
      ativo: true,
    })

    if (escolaError) {
      setErro('Erro ao criar escola: ' + escolaError.message)
      setSalvando(false)
      return
    }

    const { error: perfilError } = await supabaseAdmin.from('PerfilUsuario').upsert({
      clerkUserId: user?.id,
      escolaId,
      nome: form.responsavel,
      email: user?.emailAddresses[0]?.emailAddress,
      perfil: 'admin',
      ativo: true,
    }, { onConflict: 'clerkUserId' })

    if (perfilError) {
      setErro('Erro ao criar perfil: ' + perfilError.message)
      setSalvando(false)
      return
    }

    router.push('/dashboard')
  }

  const estados = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">⚽</p>
          <h1 className="text-2xl font-bold text-green-500">GestaoFC</h1>
          <p className="text-gray-400 text-sm mt-1">Configure sua escolinha</p>
        </div>

        <div className="flex gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className={"flex-1 h-2 rounded-full " + (step >= s ? 'bg-green-600' : 'bg-gray-700')} />
          ))}
        </div>

        {erro && (
          <div className="bg-red-600/20 border border-red-600/40 rounded-xl p-3 mb-4">
            <p className="text-red-400 text-sm">{erro}</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-green-500 font-bold">Dados da Escola</p>
            <div>
              <label className="text-sm text-gray-400">Nome da escola *</label>
              <input name="nomeEscola" value={form.nomeEscola} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: Academia FC" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400">Cidade</label>
                <input name="cidade" value={form.cidade} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Cidade" />
              </div>
              <div>
                <label className="text-sm text-gray-400">Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white">
                  {estados.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => { if (!form.nomeEscola) { setErro('Nome da escola obrigatorio.'); return }; setErro(''); setStep(2) }} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold">
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-green-500 font-bold">Dados do Responsavel</p>
            <div>
              <label className="text-sm text-gray-400">Seu nome completo *</label>
              <input name="responsavel" value={form.responsavel} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Nome do responsavel" />
            </div>
            <div>
              <label className="text-sm text-gray-400">WhatsApp *</label>
              <input name="whatsapp" value={form.whatsapp} onChange={handleChange} type="tel" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="(34) 99999-9999" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Telefone</label>
              <input name="telefone" value={form.telefone} onChange={handleChange} type="tel" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="(34) 9999-9999" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl font-bold">
                Voltar
              </button>
              <button onClick={finalizar} disabled={salvando} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
                {salvando ? 'Criando...' : 'Comecar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
