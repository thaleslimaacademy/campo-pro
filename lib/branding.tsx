'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePerfil } from '@/lib/usePerfil'

interface Branding {
  corPrimaria: string
  corSecundaria: string
  corTexto: string
  logoUrl: string | null
  nome: string
}

const defaultBranding: Branding = {
  corPrimaria: '#16a34a',
  corSecundaria: '#15803d',
  corTexto: '#ffffff',
  logoUrl: null,
  nome: 'Campo Pro',
}

const BrandingContext = createContext<Branding>(defaultBranding)

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { escolaId } = usePerfil()
  const [branding, setBranding] = useState<Branding>(defaultBranding)

  useEffect(() => {
    if (!escolaId) return
    supabase.from('Escola')
      .select('nome, corPrimaria, corSecundaria, corTexto, logoUrl')
      .eq('id', escolaId).single()
      .then(({ data }) => {
        if (data) setBranding({
          corPrimaria: data.corPrimaria || '#16a34a',
          corSecundaria: data.corSecundaria || '#15803d',
          corTexto: data.corTexto || '#ffffff',
          logoUrl: data.logoUrl || null,
          nome: data.nome || 'Campo Pro',
        })
      })
  }, [escolaId])

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', branding.corPrimaria)
    document.documentElement.style.setProperty('--brand-secondary', branding.corSecundaria)
    document.documentElement.style.setProperty('--brand-text', branding.corTexto)
  }, [branding])

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  return useContext(BrandingContext)
}
