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
      <div className="min-h-screen bg-[#F6F8F7] text-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F6F8F7] text-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Redirecionando...</p>
      </div>
    )
  }

  return <>{children}</>
}
