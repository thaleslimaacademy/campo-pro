import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-clerk-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { categoria, ideia } = await req.json()
  const contextoIdeia = ideia ? `\n\nIDEIA DO TREINADOR: ${ideia}\nAdapte o plano inteiro para refletir esta ideia, mantendo a estrutura de 5 fases.` : ''

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
- Retorne APENAS o JSON, nada mais${contextoIdeia}`

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
    // Limpar o texto antes de parsear
    let limpo = texto
      .replace(/```json/g, '').replace(/```/g, '') // remover markdown
      .replace(/[\u201C\u201D]/g, '"')            // aspas tipográficas esquerda/direita → "
      .replace(/[\u2018\u2019]/g, "'")            // aspas simples tipográficas → '
      .trim()

    // Extrair JSON se vier com texto ao redor
    const match = limpo.match(/\{[\s\S]*\}/)
    if (match) limpo = match[0]

    const json = JSON.parse(limpo)
    if (json.fases && Array.isArray(json.fases)) {
      return NextResponse.json({ plano: json, tipo: 'estruturado' })
    }
    return NextResponse.json({ plano: texto, tipo: 'texto' })
  } catch (e: any) {
    console.error('[treino-ia] JSON parse error:', e.message, '| texto:', texto.slice(0, 200))
    return NextResponse.json({ plano: texto, tipo: 'texto' })
  }
}
