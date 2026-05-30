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

  useEffect(() => {
    async function carregar() {
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('PerfilUsuario')
        .select('*')
        .eq('clerkUserId', user.id)
        .single()

      setPerfil(data)
      setLoading(false)
    }

    if (isLoaded) carregar()
  }, [user, isLoaded])

  const isAdmin = !perfil || perfil.perfil === 'admin'
  const isProfessor = perfil?.perfil === 'professor'

  return { perfil, loading, isAdmin, isProfessor }
}