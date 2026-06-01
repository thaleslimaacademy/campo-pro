import { useUser } from '@clerk/nextjs'

export function usePerfil() {
  const { user, isLoaded } = useUser()
  const meta = (user?.publicMetadata ?? {}) as { escolaId?: string; role?: string }
  return {
    isLoaded,
    escolaId: meta.escolaId,
    role: meta.role,
    isAdmin: meta.role === 'admin',
  }
}
