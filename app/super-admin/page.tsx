'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePerfil } from '@/lib/usePerfil'

interface Escola {
  id: string
  nome: string
  slug: string
  plano: string
  ativa: boolean
  statusPlano: string
  cidade: string
  estado: string
  email: string
  whatsapp: string
  valorMensalidade: number
  createdAt: string
  clerkUserId: string | null
}

interface EscolaStats extends Escola {
  totalAtletas: number
  totalCobrancas: number
  receitaMes: number
}

const PLANO_LABELS: Record<string, string> = {
  SOCIAL: 'Social',
  STARTER: 'Básico',
  PRO: 'Pro',
  ELITE: 'Elite',
}

export default function SuperAdmin() {
  const { escolaId, role, isLoaded } = usePerfil()
  const router = useRouter()
  const [escolas, setEscolas] = useState<EscolaStats[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (!isLoaded) return
    if (role !== 'superadmin') {
      router.replace('/dashboard')
      return
    }
    carregarEscolas()
  }, [isLoaded, role])

  async function carregarEscolas() {
    const res = await fetch('/api/super-admin/escolas')
    const data = await res.json()
    setEscolas(data)
    setLoading(false)
  }

  if (!isLoaded) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Carregando...</p>
    </div>
  )

  if (role !== 'superadmin') return null

  const filtradas = escolas.filter(e =>
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.cidade.toLowerCase().includes(busca.toLowerCase()) ||
    e.email.toLowerCase().includes(busca.toLowerCase())
  )

  const totalAtletas = escolas.reduce((s, e) => s + e.totalAtletas, 0)
  const totalReceita = escolas.reduce((s, e) => s + e.receitaMes, 0)
  const totalEscolas = escolas.length

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">👑</span>
        <h1 className="text-2xl font-bold text-yellow-400">Super Admin</h1>
      </div>
      <p className="text-gray-400 text-sm mb-6">Painel de controle global — GestaoFC</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs">Escolas</p>
          <p className="text-2xl font-bold text-yellow-400">{loading ? '...' : totalEscolas}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs">Atletas</p>
          <p className="text-2xl font-bold text-green-400">{loading ? '...' : totalAtletas}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs">Receita/mês</p>
          <p className="text-lg font-bold text-green-400">{loading ? '...' : 'R$' + totalReceita.toFixed(0)}</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar escola, cidade ou email..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white mb-4 text-sm"
      />

      {loading ? (
        <p className="text-gray-400 text-center py-8">Carregando escolas...</p>
      ) : (
        <div className="space-y-3">
          {filtradas.map(escola => (
            <div key={escola.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-white">{escola.nome}</p>
                  <p className="text-gray-400 text-xs">{escola.cidade}, {escola.estado}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    escola.plano === 'ELITE' ? 'bg-purple-500/20 text-purple-400' :
                    escola.plano === 'PRO' ? 'bg-blue-500/20 text-blue-400' :
                    escola.plano === 'STARTER' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {PLANO_LABELS[escola.plano] || escola.plano}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    escola.ativa ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {escola.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-800">
                <div>
                  <p className="text-gray-500 text-xs">Atletas</p>
                  <p className="font-bold text-white">{escola.totalAtletas}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Receita/mês</p>
                  <p className="font-bold text-green-400">R${escola.receitaMes.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Mensalidade</p>
                  <p className="font-bold text-white">R${escola.valorMensalidade}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center">
                <p className="text-gray-500 text-xs">{escola.email}</p>
                <p className="text-gray-600 text-xs">
                  {new Date(escola.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
