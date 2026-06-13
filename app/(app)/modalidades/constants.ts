export const MODALIDADES = [
  { slug: 'futebol',        label: 'Futebol',       emoji: '⚽' },
  { slug: 'futsal',         label: 'Futsal',         emoji: '🥅' },
  { slug: 'volei',          label: 'Vôlei',          emoji: '🏐' },
  { slug: 'basquete',       label: 'Basquete',       emoji: '🏀' },
  { slug: 'artes-marciais', label: 'Artes Marciais', emoji: '🥋' },
  { slug: 'beach-tennis',   label: 'Beach Tennis',   emoji: '🎾' },
  { slug: 'outras',         label: 'Outras',         emoji: '🏅' },
]

export const POSICOES_POR_MODALIDADE: Record<string, string[]> = {
  futebol:          ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante', 'Centroavante', 'Ponta'],
  futsal:           ['Goleiro', 'Fixo', 'Ala', 'Pivô'],
  volei:            ['Levantador', 'Oposto', 'Ponteiro', 'Central', 'Líbero'],
  basquete:         ['Armador', 'Ala-Armador', 'Ala', 'Ala-Pivô', 'Pivô'],
  'artes-marciais': ['Faixa Branca', 'Faixa Azul', 'Faixa Roxa', 'Faixa Marrom', 'Faixa Preta'],
  'beach-tennis':   ['Atacante', 'Defensor'],
  outras:           ['Atleta'],
}

export const PLANOS_GESTAOFC = [
  { slug: 'SIMPLE', label: 'Simple', maxModalidades: 1,  preco: 79  },
  { slug: 'MEDIO',  label: 'Médio',  maxModalidades: 2,  preco: 99  },
  { slug: 'MASTER', label: 'Master', maxModalidades: 99, preco: 149 },
]
