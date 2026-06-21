import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-clerk-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { categoria } = await req.json()

  const prompt = `Voce e um especialista em metodologia de futebol de base com mais de 20 anos de experiencia.

Crie um plano de treino completo para a categoria ${categoria} com as seguintes especificacoes:

- Duracao total: 90 minutos
- Formato: Lista estruturada com horarios
- Incluir: aquecimento, parte tecnica, parte tatica, jogo reduzido, volta a calma
- Adaptar complexidade para a faixa etaria da categoria ${categoria}
- Linguagem simples e direta para o treinador aplicar
- Incluir dicas especificas de coaching para cada etapa

Formato da resposta:
PLANO DE TREINO - ${categoria}
Data/Contexto: [sugerir tipo de semana: pre-jogo, pos-jogo, semana livre]

00:00 - 00:15 | AQUECIMENTO
[descricao]
Dica: [orientacao de coaching]

Continue no mesmo formato para cada parte do treino.
Finalize com OBJETIVOS DO TREINO e PONTOS DE ATENCAO para o treinador.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()
  const plano = data.content?.[0]?.text ?? 'Erro ao gerar plano.'
  return NextResponse.json({ plano })
}
