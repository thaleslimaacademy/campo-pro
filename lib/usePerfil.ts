import { useUser, useAuth } from '@clerk/nextjs'
import { useEffect } from 'react'

export function usePerfil() {
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()

  useEffect(() => {
    if (isLoaded && user) {
      getToken({ skipCache: true })
    }
  }, [isLoaded, user?.id])

  const meta = (user?.publicMetadata ?? {}) as { escolaId?: string; role?: string }
  return {
    isLoaded,
    escolaId: meta.escolaId,
    role: meta.role,
    isAdmin: meta.role === 'admin' || meta.role === 'superadmin',
  }
}
