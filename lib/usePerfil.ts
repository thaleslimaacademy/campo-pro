'use client'

import { useEffect, useState } from 'react'

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

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch('/api/perfil')
        const json = await res.json()
        console.log('PERFIL API:', json)
        setPerfil(json.perfil)
      } catch (e) {
        console.error('Erro ao buscar perfil:', e)
      }
      setLoading(false)
      setCarregou(true)
    }
    carregar()
  }, [])

  const isAdmin = carregou ? perfil === null || perfil?.perfil === 'admin' : false
  const isProfessor = carregou ? perfil?.perfil === 'professor' : false

  return { perfil, loading, isAdmin, isProfessor, carregou }
}
