'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePerfil } from '@/lib/usePerfil'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoaded } = usePerfil()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.replace('/dashboard')
    }
  }, [isAdmin, isLoaded, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Redirecionando...</p>
      </div>
    )
  }

  return <>{children}</>
}
