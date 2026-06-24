import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function GET() {
  try {
    const { data: escolas } = await supabaseAdmin
      .from('Escola').select('id, nome, diasNPS').gt('diasNPS', 0)

    if (!escolas?.length) return NextResponse.json({ ok: true, msg: 'Nenhuma escola com NPS configurado' })

    let enviados = 0

    for (const escola of escolas) {
      const dias = Number(escola.diasNPS || 30)
      const dataAlvo = new Date()
      dataAlvo.setDate(dataAlvo.getDate() - dias)
      const dataStr = dataAlvo.toISOString().slice(0, 10)

      const { data: matriculas } = await supabaseAdmin
        .from('Matricula')
        .select('id, nomeAtleta, whatsappResponsavel, nomeResponsavel, dataAprovacao')
        .eq('escolaId', escola.id)
        .eq('status', 'APROVADO')
        .eq('npsEnviado', false)
        .gte('dataAprovacao', dataStr + 'T00:00:00')
        .lte('dataAprovacao', dataStr + 'T23:59:59')

      for (const mat of matriculas || []) {
        if (!mat.whatsappResponsavel) continue

        const mensagem =
          `Olá ${mat.nomeResponsavel}! 👋\n\n` +
          `Faz ${dias} dias que *${mat.nomeAtleta}* está na *${escola.nome}* e queremos saber sua opinião!\n\n` +
          `De *0 a 10*, qual nota você dá para a nossa academia?\n\n` +
          `_Responda apenas com o número (ex: 9)_`

        await enviarWhatsApp(mat.whatsappResponsavel, mensagem)

        await supabaseAdmin.from('NPS').insert({
          id: crypto.randomUUID(),
          escolaId: escola.id,
          matriculaId: mat.id,
          whatsapp: mat.whatsappResponsavel,
          nomeAtleta: mat.nomeAtleta,
          nomeResponsavel: mat.nomeResponsavel,
          status: 'AGUARDANDO',
          enviadoEm: new Date().toISOString(),
        })

        await supabaseAdmin.from('Matricula').update({ npsEnviado: true }).eq('id', mat.id)
        enviados++
      }
    }

    return NextResponse.json({ ok: true, enviados })
  } catch (err: any) {
    console.error('[nps/enviar]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
