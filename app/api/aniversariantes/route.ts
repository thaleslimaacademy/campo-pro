import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const hoje = new Date()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')

  const { data: escolas } = await supabaseAdmin.from('Escola').select('id, nome').eq('ativa', true)
  if (!escolas) return NextResponse.json({ sucesso: true, enviados: 0 })

  let totalEnviados = 0

  for (const escola of escolas) {
    const { data: atletas } = await supabaseAdmin
      .from('Atleta')
      .select('id, nome, dataNascimento')
      .eq('escolaId', escola.id)
      .eq('ativo', true)

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

      const nomeResp = responsavel.nome.split(' ')[0]
      const primeiroNome = atleta.nome.split(' ')[0]

      const mensagem = 'Feliz aniversario, ' + primeiroNome + '! 🎂⚽\n\n' +
        'Toda a equipe da *' + escola.nome + '* deseja um dia muito especial!\n\n' +
        'Que voce continue evoluindo dentro e fora do campo! 🏆\n\n' +
        '_' + escola.nome + '_'

      await enviarWhatsApp(responsavel.whatsapp, mensagem)
      totalEnviados++
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return NextResponse.json({ sucesso: true, enviados: totalEnviados })
}
