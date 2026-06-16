'use client'
import { usePerfil } from './usePerfil'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type Plano = 'BASICO' | 'PRO' | 'ELITE'

export const PLANO_NIVEL: Record<Plano, number> = {
  BASICO: 1,
  PRO: 2,
  ELITE: 3,
}

// Plano mínimo exigido por feature
export const FEATURES_PLANO: Record<string, Plano> = {
  whatsapp:       'PRO',
  relatorios:     'PRO',
  avaliacaoFisica:'PRO',
  campeonatos:    'PRO',
  convocacoes:    'PRO',
  mensagens:      'PRO',
  appPais:        'ELITE',
  ia:             'ELITE',
}

export function usePlano() {
  const { escolaId, isLoaded: perfilLoaded } = usePerfil()
  const [plano, setPlano] = useState<Plano>('BASICO')
  const [planoLoaded, setPlanoLoaded] = useState(false)

  useEffect(() => {
    if (!escolaId) return
    supabase
      .from('Escola')
      .select('planoGestaoFC')
      .eq('id', escolaId)
      .single()
      .then(({ data }) => {
        if (data?.planoGestaoFC) setPlano(data.planoGestaoFC as Plano)
        setPlanoLoaded(true)
      })
  }, [escolaId])

  function temAcesso(feature: string): boolean {
    const planoMin = FEATURES_PLANO[feature]
    if (!planoMin) return true
    return PLANO_NIVEL[plano] >= PLANO_NIVEL[planoMin]
  }

  return {
    plano,
    isLoaded: perfilLoaded && planoLoaded,
    temAcesso,
    isBasico: plano === 'BASICO',
    isPro:    plano === 'PRO' || plano === 'ELITE',
    isElite:  plano === 'ELITE',
  }
}
