import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-clerk-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { categoria, ideia } = await req.json()
  const contextoIdeia = ideia
    ? `\n\nIDEIA DO TREINADOR: ${ideia}\nAdapte o plano inteiro para refletir esta ideia.`
    : ''

  const prompt = `Voce e um especialista em metodologia de futebol de base com 20+ anos de experiencia.

Crie um plano de treino completo para a categoria ${categoria} (90 minutos).
Retorne SOMENTE JSON valido. Sem texto antes ou depois. Sem markdown. Sem backticks.

Formato exato:
{"categoria":"${categoria}","contexto":"descreva o contexto","fases":[{"id":"fase_1","tempo":"00:00 - 00:15","nome":"AQUECIMENTO","subtitulo":"nome criativo","descricao":"descricao em 2-3 frases","dica":"dica de coaching","diagrama":{"jogadores_azuis":[{"x":150,"y":200,"label":"1"}],"jogadores_vermelhos":[{"x":400,"y":200,"label":"1"}],"goleiros":[],"cones":[{"x":100,"y":100}],"bolas":[{"x":300,"y":200}],"setas":[{"x1":150,"y1":200,"x2":200,"y2":150}]}}],"objetivos":["obj1","obj2"],"pontos_atencao":["ponto1"]}

REGRAS:
- Campo 600x400px. Area esquerda (x:20-100): gol esquerdo. Area direita (x:500-580): gol direito.
- Crie exatamente 5 fases: AQUECIMENTO 15min, PARTE TECNICA 20min, PARTE TATICA 20min, JOGO REDUZIDO 25min, VOLTA A CALMA 10min
- Adapte numero de jogadores para ${categoria}
- Posicionamentos REALISTAS e DIFERENTES em cada fase
- Retorne APENAS o JSON${contextoIdeia}`

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
  const texto = (data.content?.[0]?.text ?? '').trim()

  try {
    // Limpar e extrair JSON
    let limpo = texto
      .replace(/```json/gi, '').replace(/```/g, '')
      .replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'")
      .trim()

    // Extrair apenas o objeto JSON se vier com texto ao redor
    const match = limpo.match(/\{[\s\S]*\}/)
    if (match) limpo = match[0]

    const json = JSON.parse(limpo)

    if (json && Array.isArray(json.fases) && json.fases.length > 0) {
      return NextResponse.json({ plano: json, tipo: 'estruturado' })
    }
    return NextResponse.json({ plano: texto, tipo: 'texto' })
  } catch (e: any) {
    console.error('[treino-ia] parse error:', e.message)
    console.error('[treino-ia] texto recebido:', texto.slice(0, 300))
    return NextResponse.json({ plano: texto, tipo: 'texto' })
  }
}
