'use client'
import { useClerk } from '@clerk/nextjs'
import { useEffect } from 'react'

export default function LogoutPage() {
  const { signOut } = useClerk()
  
  useEffect(() => {
    signOut(() => { window.location.href = '/login' })
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Saindo...</p>
    </div>
  )
}
