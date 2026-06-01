export type Plano = 'SOCIAL' | 'STARTER' | 'PRO' | 'ELITE'

export const PLANO_LABELS: Record<Plano, string> = {
  SOCIAL:  'Social',
  STARTER: 'Básico',
  PRO:     'Pro',
  ELITE:   'Elite',
}

export const PLANO_DEFAULT: Plano = 'STARTER'
