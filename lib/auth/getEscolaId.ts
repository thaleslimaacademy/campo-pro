import { auth } from '@clerk/nextjs/server'

export async function getEscolaId(): Promise<string> {
  const { sessionClaims } = await auth()
  const escolaId = (sessionClaims?.metadata as any)?.escolaId as string | undefined
  if (!escolaId) throw new Error('escolaId ausente na sessão')
  return escolaId
}
