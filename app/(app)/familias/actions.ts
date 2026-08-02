'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

type AtletaDaFamilia = {
  id: string
  nome: string
  familiaId: string | null
  valorMensalidade: number | null
  diaVencimento: number | null
}

export async function listarFamiliasPendentes() {
  const escolaId = await getEscolaIdServer()

  const { data: familiasData } = await supabaseAdmin
    .from('Familia')
    .select('id, nomeResponsavel, cpfResponsavel, whatsappResponsavel, status, createdAt')
    .eq('escolaId', escolaId)
    .eq('status', 'PENDENTE')
    .order('createdAt', { ascending: false })

  const familias = familiasData ?? []
  if (familias.length === 0) return []

  const familiaIds = familias.map((f: { id: string }) => f.id)
  const { data: atletasData } = await supabaseAdmin
    .from('Atleta')
    .select('id, nome, familiaId, valorMensalidade, diaVencimento')
    .in('familiaId', familiaIds)
  const atletas = (atletasData ?? []) as AtletaDaFamilia[]

  return familias.map((f: { id: string; [key: string]: unknown }) => ({
    ...f,
    atletas: atletas.filter((a: AtletaDaFamilia) => a.familiaId === f.id),
  }))
}

export async function confirmarFamilia(familiaId: string) {
  // trava de segurança: só confirma se todos os atletas da família
  // tiverem o MESMO dia de vencimento — senão a cobrança conjunta não
  // fecha (um PIX só, um vencimento só).
  const { data: atletasData } = await supabaseAdmin
    .from('Atleta')
    .select('diaVencimento')
    .eq('familiaId', familiaId)
  const atletas = (atletasData ?? []) as { diaVencimento: number | null }[]

  const diasVencimento = new Set(atletas.map((a) => a.diaVencimento))
  if (diasVencimento.size > 1) {
    return {
      ok: false,
      erro:
        'Os atletas dessa família têm dias de vencimento diferentes. Alinhe o dia de vencimento de todos antes de confirmar.',
    }
  }

  await supabaseAdmin
    .from('Familia')
    .update({ status: 'CONFIRMADA', confirmadoEm: new Date().toISOString() })
    .eq('id', familiaId)

  revalidatePath('/familias')
  return { ok: true }
}

export async function rejeitarFamilia(familiaId: string) {
  await supabaseAdmin.from('Atleta').update({ familiaId: null }).eq('familiaId', familiaId)
  await supabaseAdmin.from('Familia').update({ status: 'REJEITADA' }).eq('id', familiaId)

  revalidatePath('/familias')
  return { ok: true }
}

export async function desvincularAtleta(atletaId: string, familiaId: string) {
  await supabaseAdmin.from('Atleta').update({ familiaId: null }).eq('id', atletaId)

  // se sobrou só 1 atleta (ou 0) na família, ela deixa de fazer sentido
  const { data: restantes } = await supabaseAdmin.from('Atleta').select('id').eq('familiaId', familiaId)

  if (!restantes || restantes.length <= 1) {
    if (restantes && restantes.length === 1) {
      await supabaseAdmin.from('Atleta').update({ familiaId: null }).eq('id', restantes[0].id)
    }
    await supabaseAdmin.from('Familia').delete().eq('id', familiaId)
  }

  revalidatePath('/familias')
  return { ok: true }
}
