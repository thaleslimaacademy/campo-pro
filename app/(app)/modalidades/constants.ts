export const MODALIDADES = [
  { slug: 'futebol',        label: 'Futebol',       emoji: '⚽' },
  { slug: 'futsal',         label: 'Futsal',        emoji: '🥅' },
  { slug: 'futvolei',       label: 'Futvolei',      emoji: '🏐' },
  { slug: 'artes-marciais', label: 'Artes Marciais', emoji: '🥋' },
  { slug: 'outras',         label: 'Outras',        emoji: '🏅' },
]

export const POSICOES_POR_MODALIDADE: Record<string, string[]> = {
  futebol:          ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante', 'Centroavante', 'Ponta'],
  futsal:           ['Goleiro', 'Fixo', 'Ala', 'Pivô'],
  futvolei:         ['Atacante', 'Bloqueador', 'Levantador', 'Líbero'],
  'artes-marciais': ['Faixa Branca', 'Faixa Azul', 'Faixa Roxa', 'Faixa Marrom', 'Faixa Preta'],
  outras:           ['Atleta'],
}

export const PLANOS_GESTAOFC = [
  { slug: 'SIMPLE', label: 'Simple', maxModalidades: 1,  preco: 79  },
  { slug: 'MEDIO',  label: 'Médio',  maxModalidades: 2,  preco: 99  },
  { slug: 'MASTER', label: 'Master', maxModalidades: 99, preco: 149 },
  // Planos novos (BASICO/PRO/ELITE)
  { slug: 'BASICO', label: 'Básico', maxModalidades: 1,  preco: 79  },
  { slug: 'PRO',    label: 'Pro',    maxModalidades: 3,  preco: 129 },
  { slug: 'ELITE',  label: 'Elite',  maxModalidades: 99, preco: 199 },
]

export const MAX_MODALIDADES_POR_PLANO: Record<string, number> = {
  SIMPLE: 1, MEDIO: 2, MASTER: 99,
  BASICO: 1, PRO: 3,   ELITE: 99,
}
