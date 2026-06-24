import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function GET() {
  const escolaId = await getEscolaIdServer()

  const { data: respostas } = await supabaseAdmin
    .from('NPS').select('nota, status, nomeAtleta, nomeResponsavel, whatsapp, respondidoEm')
    .eq('escolaId', escolaId).not('nota', 'is', null)
    .order('respondidoEm', { ascending: false })

  const todas = respostas || []
  const notas = todas.map((r: any) => r.nota)
  const media = notas.length ? notas.reduce((a: number, b: number) => a + b, 0) / notas.length : 0
  const promotores = todas.filter((r: any) => r.nota >= 9).length
  const detratores = todas.filter((r: any) => r.nota <= 6).length
  const npsScore = notas.length ? Math.round(((promotores - detratores) / notas.length) * 100) : 0

  const porMes: Record<string, { soma: number; total: number }> = {}
  todas.forEach((r: any) => {
    const mes = (r.respondidoEm || '').slice(0, 7)
    if (!mes) return
    if (!porMes[mes]) porMes[mes] = { soma: 0, total: 0 }
    porMes[mes].soma += r.nota
    porMes[mes].total++
  })
  const grafico = Object.entries(porMes)
    .sort(([a], [b]) => a.localeCompare(b)).slice(-6)
    .map(([mes, { soma, total }]) => ({ mes, media: Math.round((soma / total) * 10) / 10, total }))

  const { count: pendentes } = await supabaseAdmin
    .from('NPS').select('*', { count: 'exact', head: true })
    .eq('escolaId', escolaId).eq('status', 'AGUARDANDO')

  return NextResponse.json({
    media: Math.round(media * 10) / 10, npsScore, total: notas.length,
    promotores, detratores, neutros: notas.length - promotores - detratores,
    pendentes: pendentes || 0, grafico,
    detratoresList: todas.filter((r: any) => r.nota <= 6).slice(0, 10),
  })
}
