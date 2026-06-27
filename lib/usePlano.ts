'use client'
import { usePerfil } from './usePerfil'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type Plano = 'BASICO' | 'PRO' | 'ELITE'

export const PLANO_NIVEL: Record<Plano, number> = {
  BASICO: 1,
  PRO:    2,
  ELITE:  3,
}

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
  const [plano,       setPlano]       = useState<Plano>('BASICO')
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [planoLoaded, setPlanoLoaded] = useState(false)

  useEffect(() => {
    if (!escolaId) return
    supabase
      .from('Escola')
      .select('planoGestaoFC, trialEndsAt')
      .eq('id', escolaId)
      .single()
      .then(({ data }) => {
        if (data?.planoGestaoFC) setPlano(data.planoGestaoFC as Plano)
        if (data?.trialEndsAt)   setTrialEndsAt(data.trialEndsAt)
        setPlanoLoaded(true)
      })
  }, [escolaId])

  // Trial ativo = plano ELITE enquanto não venceu
  const trialAtivo   = trialEndsAt ? new Date(trialEndsAt) > new Date() : false
  const trialVencido = trialEndsAt ? new Date(trialEndsAt) <= new Date() : false
  const diasRestantes = trialEndsAt && trialAtivo
    ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000)
    : 0

  const planoEfetivo: Plano = trialAtivo ? 'ELITE' : plano

  function temAcesso(feature: string): boolean {
    const planoMin = FEATURES_PLANO[feature]
    if (!planoMin) return true
    return PLANO_NIVEL[planoEfetivo] >= PLANO_NIVEL[planoMin]
  }

  return {
    plano,
    planoEfetivo,
    isLoaded: perfilLoaded && planoLoaded,
    temAcesso,
    trialAtivo,
    trialVencido,
    diasRestantes,
    trialEndsAt,
    isBasico: planoEfetivo === 'BASICO',
    isPro:    planoEfetivo === 'PRO' || planoEfetivo === 'ELITE',
    isElite:  planoEfetivo === 'ELITE',
  }
}
