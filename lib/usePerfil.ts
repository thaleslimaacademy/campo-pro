'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

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
  const { user, isLoaded } = useUser()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [carregou, setCarregou] = useState(false)

  useEffect(() => {
    async function carregar() {
      if (!user) {
        setLoading(false)
        setCarregou(true)
        return
      }

      const { data, error } = await supabase
        .from('PerfilUsuario')
        .select('*')
        .eq('clerkUserId', user.id)
        .single()

      if (data) setPerfil(data)
      setLoading(false)
      setCarregou(true)
    }

    if (isLoaded) carregar()
  }, [user, isLoaded])

  const isAdmin = carregou && perfil === null
    ? true
    : perfil?.perfil === 'admin'

  const isProfessor = perfil?.perfil === 'professor'

  return { perfil, loading, isAdmin, isProfessor, carregou }
}