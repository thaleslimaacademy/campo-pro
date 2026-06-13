'use client'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

type Perfil = {
  escolaId: string
  perfil: string
  nome: string
}

export function usePerfil() {
  const { user, isLoaded } = useUser()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [perfilLoaded, setPerfilLoaded] = useState(false)

  useEffect(() => {
    if (!isLoaded || !user) return
    fetch('/api/perfil')
      .then(r => r.json())
      .then(({ perfil }) => {
        if (perfil) setPerfil(perfil as Perfil)
      })
      .finally(() => setPerfilLoaded(true))
  }, [isLoaded, user?.id])

  return {
    isLoaded: isLoaded && perfilLoaded,
    escolaId: perfil?.escolaId,
    role: perfil?.perfil,
    isAdmin: perfil?.perfil === 'admin' || perfil?.perfil === 'superadmin',
    nome: perfil?.nome,
  }
}
