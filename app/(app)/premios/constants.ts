export type Premio = { titulo: string; icone: string; descricao: string }
export type Categoria = { label: string; emoji: string; premios: Premio[] }

export const CATALOGO: Categoria[] = [
  {
    label: 'Esportivas', emoji: '⚽',
    premios: [
      { icone: '🥇', titulo: 'Primeiro Gol', descricao: 'Marcou o primeiro gol na TLFA' },
      { icone: '🎯', titulo: 'Primeira Assistência', descricao: 'Deu a primeira assistência na TLFA' },
      { icone: '🧤', titulo: 'Primeiro Clean Sheet', descricao: 'Primeiro jogo sem sofrer gol' },
      { icone: '⚽', titulo: '10 Gols', descricao: 'Marcou 10 gols na TLFA' },
      { icone: '⚽', titulo: '25 Gols', descricao: 'Marcou 25 gols na TLFA' },
      { icone: '⚽', titulo: '50 Gols', descricao: 'Marcou 50 gols na TLFA' },
      { icone: '🎯', titulo: '10 Assistências', descricao: '10 assistências na TLFA' },
      { icone: '🎯', titulo: '25 Assistências', descricao: '25 assistências na TLFA' },
      { icone: '🧤', titulo: '5 Jogos Sem Sofrer Gol', descricao: '5 clean sheets conquistados' },
      { icone: '🧤', titulo: '10 Jogos Sem Sofrer Gol', descricao: '10 clean sheets conquistados' },
      { icone: '🏅', titulo: 'Artilheiro do Campeonato', descricao: 'Maior goleador do campeonato' },
      { icone: '🎯', titulo: 'Rei das Assistências', descricao: 'Mais assistências do campeonato' },
      { icone: '🧤', titulo: 'Melhor Goleiro', descricao: 'Melhor goleiro do campeonato' },
      { icone: '⭐', titulo: 'MVP do Campeonato', descricao: 'Melhor jogador do campeonato' },
    ]
  },
  {
    label: 'Frequência', emoji: '📅',
    premios: [
      { icone: '🔥', titulo: '10 Treinos Seguidos', descricao: '10 treinos consecutivos sem falta' },
      { icone: '🔥', titulo: '20 Treinos Seguidos', descricao: '20 treinos consecutivos sem falta' },
      { icone: '🔥', titulo: '50 Treinos Seguidos', descricao: '50 treinos consecutivos sem falta' },
      { icone: '📆', titulo: '100% de Presença no Mês', descricao: 'Presença perfeita em um mês' },
      { icone: '⏰', titulo: 'Pontualidade Nota 10', descricao: 'Sempre pontual nos treinos' },
      { icone: '🏆', titulo: 'Aluno Mais Comprometido', descricao: 'Referência em comprometimento' },
      { icone: '📚', titulo: 'Equilíbrio Escola + Esporte', descricao: 'Excelente nos estudos e no esporte' },
      { icone: '🎖️', titulo: 'Guerreiro da Semana', descricao: 'Destaque de esforço na semana' },
      { icone: '🥇', titulo: 'Atleta Destaque do Mês', descricao: 'Melhor atleta do mês' },
    ]
  },
  {
    label: 'Educacional', emoji: '🎓',
    premios: [
      { icone: '📘', titulo: 'Boletim Nota 10', descricao: 'Notas escolares exemplares' },
      { icone: '📈', titulo: 'Melhorou as Notas', descricao: 'Evolução acadêmica comprovada' },
      { icone: '📚', titulo: 'Aluno Aplicado', descricao: 'Dedicação aos estudos e ao esporte' },
      { icone: '🧠', titulo: 'Evolução Acadêmica', descricao: 'Crescimento intelectual notável' },
      { icone: '🏅', titulo: 'Destaque Escolar do Mês', descricao: 'Melhor desempenho escolar do mês' },
      { icone: '❤️', titulo: 'Exemplo Dentro e Fora', descricao: 'Exemplo de atleta e estudante' },
    ]
  },
  {
    label: 'Físicas', emoji: '💪',
    premios: [
      { icone: '📊', titulo: 'Meta Física Atingida', descricao: 'Alcançou meta de avaliação física' },
      { icone: '🏃', titulo: 'Melhorou o Condicionamento', descricao: 'Evolução física comprovada' },
      { icone: '💪', titulo: 'Evolução Muscular', descricao: 'Ganho de massa muscular atingido' },
      { icone: '🚀', titulo: 'Evolução na Velocidade', descricao: 'Melhorou seu tempo de sprints' },
      { icone: '⚡', titulo: 'Evolução na Potência', descricao: 'Maior potência registrada' },
      { icone: '🔋', titulo: 'Resistência Melhorada', descricao: 'Melhor resistência aeróbica' },
      { icone: '🏋️', titulo: 'Superação Física', descricao: 'Superou seus próprios limites' },
    ]
  },
  {
    label: 'Comportamental', emoji: '🤝',
    premios: [
      { icone: '🤝', titulo: 'Fair Play', descricao: 'Referência em fair play' },
      { icone: '🗣️', titulo: 'Líder da Equipe', descricao: 'Liderança natural reconhecida' },
      { icone: '❤️', titulo: 'Espírito de Equipe', descricao: 'Sempre coloca o time em primeiro' },
      { icone: '👏', titulo: 'Companheiro do Mês', descricao: 'Melhor companheiro do mês' },
      { icone: '🦁', titulo: 'Mentalidade de Campeão', descricao: 'Mentalidade vencedora exemplar' },
      { icone: '🏅', titulo: 'Exemplo de Disciplina', descricao: 'Disciplina dentro e fora do campo' },
      { icone: '🧡', titulo: 'Atitude TLFA', descricao: 'Personifica os valores da TLFA' },
      { icone: '🙏', titulo: 'Solidariedade', descricao: 'Sempre disposto a ajudar os colegas' },
    ]
  },
  {
    label: 'Campeonatos', emoji: '🏆',
    premios: [
      { icone: '🥉', titulo: 'Bronze', descricao: '3º lugar em campeonato' },
      { icone: '🥈', titulo: 'Prata', descricao: '2º lugar em campeonato' },
      { icone: '🥇', titulo: 'Ouro', descricao: '1º lugar em campeonato' },
      { icone: '🏆', titulo: 'Campeão Municipal', descricao: 'Campeão do torneio municipal' },
      { icone: '🏆', titulo: 'Campeão Regional', descricao: 'Campeão do torneio regional' },
      { icone: '🏆', titulo: 'Campeão Interestadual', descricao: 'Campeão interestadual' },
      { icone: '🏆', titulo: 'Bicampeão', descricao: 'Dois títulos conquistados' },
      { icone: '🏆', titulo: 'Tricampeão', descricao: 'Três títulos conquistados' },
      { icone: '👑', titulo: 'Lenda TLFA', descricao: '5+ títulos — Lenda da TLFA' },
    ]
  },
  {
    label: 'Especiais', emoji: '💎',
    premios: [
      { icone: '🦁', titulo: 'DNA TLFA', descricao: '30 dias demonstrando os valores da TLFA' },
      { icone: '🌟', titulo: 'Superação do Mês', descricao: 'Maior superação do mês' },
      { icone: '🎂', titulo: 'Aniversariante do Mês', descricao: 'Parabéns pelo aniversário!' },
      { icone: '🎒', titulo: '1 Ano de TLFA', descricao: '1 ano de trajetória na TLFA' },
      { icone: '🎒', titulo: '2 Anos de TLFA', descricao: '2 anos de trajetória na TLFA' },
      { icone: '🎒', titulo: '3 Anos de TLFA', descricao: '3 anos de trajetória na TLFA' },
      { icone: '🚍', titulo: 'Primeira Viagem com a TLFA', descricao: 'Primeira viagem oficial com o time' },
      { icone: '🏟️', titulo: 'Primeira Competição Oficial', descricao: 'Estreou em competição oficial' },
      { icone: '📸', titulo: 'Embaixador da TLFA', descricao: 'Representa a TLFA com orgulho' },
      { icone: '🏅', titulo: 'Atleta 360°', descricao: 'Excelente em esporte, escola, comportamento e frequência' },
      { icone: '👨‍👩‍👧', titulo: 'Família Presente', descricao: 'Família participativa e engajada' },
      { icone: '🎯', titulo: 'Meta Pessoal Concluída', descricao: 'Alcançou uma meta pessoal definida' },
    ]
  },
]

export const NIVEL_POR_CONQUISTAS = (n: number) => {
  if (n >= 61) return { label: 'Lenda TLFA', emoji: '👑' }
  if (n >= 51) return { label: 'Referência', emoji: '🟡' }
  if (n >= 41) return { label: 'Elite', emoji: '🔴' }
  if (n >= 31) return { label: 'Destaque', emoji: '🟠' }
  if (n >= 21) return { label: 'Competidor', emoji: '🟣' }
  if (n >= 11) return { label: 'Em Desenvolvimento', emoji: '🔵' }
  if (n >= 6)  return { label: 'Aprendiz', emoji: '🟢' }
  return { label: 'Iniciante', emoji: '🔰' }
}