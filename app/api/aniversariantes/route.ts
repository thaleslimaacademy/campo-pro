import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
// TODO: sem template proprio, so alcanca quem escreveu pro numero nas
// ultimas 24h (janela de conversa da Meta). Migrar pra um template
// 'aniversario' quando fizer sentido priorizar.
import { enviarTextoMeta } from '@/lib/whatsapp-meta'

function aplicarVariaveis(template: string, vars: Record<string, string>): string {
  let msg = template
  for (const [key, val] of Object.entries(vars)) {
    msg = msg.replaceAll(key, val)
  }
  return msg
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron && authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const hoje = new Date()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')

  const { data: escolas } = await supabaseAdmin
    .from('Escola').select('id, nome, msgAniversario').eq('ativa', true)

  if (!escolas) return NextResponse.json({ sucesso: true, enviados: 0 })

  let totalEnviados = 0

  for (const escola of escolas) {
    const { data: atletas } = await supabaseAdmin
      .from('Atleta').select('id, nome, dataNascimento')
      .eq('escolaId', escola.id).eq('ativo', true)

    if (!atletas) continue

    const aniversariantes = atletas.filter(a => {
      if (!a.dataNascimento) return false
      const [, aMes, aDia] = a.dataNascimento.split('-')
      return aMes === mes && aDia === dia
    })

    for (const atleta of aniversariantes) {
      const { data: responsaveis } = await supabaseAdmin
        .from('Responsavel').select('nome, whatsapp').eq('atletaId', atleta.id).limit(1)

      const responsavel = responsaveis?.[0]
      if (!responsavel?.whatsapp) continue

      const template = escola.msgAniversario || 'Feliz aniversario, {nome_atleta}! Toda a equipe da *{nome_escola}* deseja um dia muito especial! _{nome_escola}_'

      const mensagem = aplicarVariaveis(template, {
        '{nome_responsavel}': responsavel.nome.split(' ')[0],
        '{nome_atleta}': atleta.nome.split(' ')[0],
        '{nome_escola}': escola.nome,
      })

      try {
        await enviarTextoMeta(responsavel.whatsapp, mensagem)
        totalEnviados++
      } catch (e) { console.error('Erro WhatsApp aniversario:', (e as Error).message) }
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return NextResponse.json({ sucesso: true, enviados: totalEnviados })
}
