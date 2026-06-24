import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-clerk-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { categoria } = await req.json()

  const prompt = `Voce e um especialista em metodologia de futebol de base com 20+ anos de experiencia.

Crie um plano de treino completo para a categoria ${categoria} (90 minutos) e retorne SOMENTE um JSON valido, sem texto antes ou depois, sem markdown, sem backticks.

O JSON deve ter exatamente este formato:
{
  "categoria": "${categoria}",
  "contexto": "Semana livre - foco tecnico-tatico",
  "fases": [
    {
      "id": "fase_1",
      "tempo": "00:00 - 00:15",
      "nome": "AQUECIMENTO",
      "subtitulo": "Nome criativo do exercicio",
      "descricao": "Descricao clara do exercicio em 2-3 frases",
      "dica": "Dica de coaching especifica para esta faixa etaria",
      "diagrama": {
        "jogadores_azuis": [{"x": 150, "y": 200, "label": "1"}, {"x": 200, "y": 150, "label": "2"}],
        "jogadores_vermelhos": [{"x": 350, "y": 200, "label": "1"}],
        "goleiros": [],
        "cones": [{"x": 100, "y": 100}, {"x": 200, "y": 300}],
        "bolas": [{"x": 300, "y": 200}],
        "setas": [{"x1": 150, "y1": 200, "x2": 200, "y2": 150}]
      }
    }
  ],
  "objetivos": ["objetivo 1", "objetivo 2", "objetivo 3"],
  "pontos_atencao": ["ponto 1", "ponto 2"]
}

REGRAS:
- Campo tem 600x400 pixels. Posicione elementos de forma realista.
- Area esquerda (x:20-100): gol esquerdo. Area direita (x:500-580): gol direito.
- Linha do meio: x=300.
- Crie exatamente 5 fases: AQUECIMENTO (15min), PARTE TECNICA (20min), PARTE TATICA (20min), JOGO REDUZIDO (25min), VOLTA A CALMA (10min)
- Adapte numero de jogadores para a faixa etaria ${categoria}
- Posicionamentos devem ser REALISTAS e DIFERENTES em cada fase
- Retorne APENAS o JSON, nada mais`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json()
  const texto = data.content?.[0]?.text ?? ''

  try {
    const json = JSON.parse(texto.replace(/```json|```/g, '').trim())
    return NextResponse.json({ plano: json, tipo: 'estruturado' })
  } catch {
    return NextResponse.json({ plano: texto, tipo: 'texto' })
  }
}
