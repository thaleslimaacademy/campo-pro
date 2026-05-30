'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface Professor {
  id: string
  nome: string
  email: string
  cargo: string
  escolaId: string
  ativo: boolean
  contaCriada: boolean
}

export default function Convite() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const { user, isLoaded } = useUser()

  const [professor, setProfessor] = useState<Professor | null>(null)
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('Professor')
        .select('*')
        .eq('tokenConvite', token)
        .single()
      setProfessor(data)
      setLoading(false)
    }
    carregar()
  }, [token])

  async function ativarConta() {
    if (!user || !professor) return
    setProcessando(true)
    setErro('')

    const { error: perfilError } = await supabaseAdmin
      .from('PerfilUsuario')
      .upsert({
        clerkUserId: user.id,
        escolaId: professor.escolaId,
        nome: professor.nome,
        email: professor.email,
        perfil: 'professor',
        professorId: professor.id,
        ativo: true,
      }, { onConflict: 'clerkUserId' })

    if (perfilError) {
      setErro('Erro ao ativar conta: ' + perfilError.message)
      setProcessando(false)
      return
    }

    await supabaseAdmin
      .from('Professor')
      .update({ contaCriada: true, clerkUserId: user.id })
      .eq('id', professor.id)

    setSucesso(true)
    setProcessando(false)
    setTimeout(() => { router.push('/dashboard') }, 2000)
  }

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  if (!professor) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-5xl mb-4">❌</p>
        <h2 className="text-xl font-bold mb-2">Link inválido</h2>
        <p className="text-gray-400">Este link não existe ou já foi utilizado.</p>
      </div>
    )
  }

  if (professor.contaCriada) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-5xl mb-4">✅</p>
        <h2 className="text-xl font-bold mb-2">Conta já ativada</h2>
        <p className="text-gray-400 mb-4">Este convite já foi utilizado.</p>
        <a href="/dashboard" className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold">
          Acessar o app
        </a>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-5xl mb-4">🎉</p>
        <h2 className="text-xl font-bold mb-2">Conta ativada!</h2>
        <p className="text-gray-400">Redirecionando para o app...</p>
      </div>
    )
  }

  const loginUrl = '/login?redirect_url=' + encodeURIComponent('/convite/' + token)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">⚽</p>
          <h1 className="text-xl font-bold text-green-500">Thales Lima Football Academy</h1>
          <p className="text-gray-400 text-sm mt-1">Convite para Comissão Técnica</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
          <p className="text-gray-400 text-sm mb-1">Você foi convidado como</p>
          <p className="text-white font-bold text-lg">{professor.nome}</p>
          <p className="text-green-500 text-sm">{professor.cargo}</p>
        </div>

        {erro && (
          <div className="bg-red-600/20 border border-red-600/40 rounded-xl p-3 mb-4">
            <p className="text-red-400 text-sm">{erro}</p>
          </div>
        )}

        {!user ? (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm text-center">
              Para ativar seu convite, faça login ou crie sua conta
            </p>
            <a
              href={loginUrl}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold text-lg text-center block"
            >
              Fazer login / Criar conta
            </a>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Logado como</p>
            <p className="text-white font-bold mb-6">{user.emailAddresses[0]?.emailAddress}</p>
            <button
              onClick={ativarConta}
              disabled={processando}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
            >
              {processando ? 'Ativando...' : '✅ Ativar minha conta'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}