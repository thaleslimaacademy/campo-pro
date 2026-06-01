'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Perfil {
  id: string
  clerkUserId: string
  escolaId: string
  nome: string
  email: string
  perfil: 'admin' | 'professor' | 'pai' | 'externo'
  ativo: boolean
}

export function usePerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [carregou, setCarregou] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch('/api/perfil')
        const json = await res.json()
        setPerfil(json.perfil)
        if (!json.perfil && typeof window !== 'undefined') {
          const path = window.location.pathname
          if (path !== '/onboarding' && !path.startsWith('/api')) {
            router.push('/onboarding')
          }
        }
      } catch (e) {
        console.error('Erro ao buscar perfil:', e)
      }
      setLoading(false)
      setCarregou(true)
    }
    carregar()
  }, [])

  const isAdmin = carregou ? (perfil === null || perfil?.perfil === 'admin') : false
  const isProfessor = carregou ? perfil?.perfil === 'professor' : false
  const escolaId = perfil?.escolaId || 'escola-demo'

  return { perfil, loading, isAdmin, isProfessor, carregou, escolaId }
}
