import { getEscolaId } from '@/lib/auth/getEscolaId'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const hoje = new Date()
  const dia = String(hoje.getDate()).padStart(2, '0')
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')

  const { data: atletas } = await supabaseAdmin
    .from('Atleta')
    .select('id, nome, dataNascimento, telefone')
    .eq('escolaId', await getEscolaId())
    .eq('ativo', true)

  if (!atletas) return NextResponse.json({ sucesso: true, enviados: 0 })

  const aniversariantes = atletas.filter(a => {
    if (!a.dataNascimento) return false
    const nasc = a.dataNascimento.slice(5, 10)
    return nasc === mes + '-' + dia
  })

  let enviados = 0
  for (const atleta of aniversariantes) {
    const nascimento = new Date(atleta.dataNascimento + 'T12:00:00')
    const idade = hoje.getFullYear() - nascimento.getFullYear()

    const { data: responsaveis } = await supabaseAdmin
      .from('Responsavel')
      .select('whatsapp')
      .eq('atletaId', atleta.id)
      .limit(1)

    const whatsapp = responsaveis?.[0]?.whatsapp || atleta.telefone
    if (!whatsapp) continue

    const mensagem = "Feliz Aniversario *" + atleta.nome + "*! " +
      "Hoje voce completa *" + idade + " anos*!\n\n" +
      "A equipe da *Thales Lima Football Academy* deseja um dia incrivel cheio de alegria e muitos gols!\n\n" +
      "Que esse novo ano seja repleto de evolucao dentro e fora do campo!\n\n" +
      "Com carinho, _Thales Lima e toda a equipe da Academy_"

    await enviarWhatsApp(whatsapp, mensagem)
    enviados++
    await new Promise(r => setTimeout(r, 1000))
  }

  return NextResponse.json({ sucesso: true, enviados, aniversariantes: aniversariantes.length })
}
