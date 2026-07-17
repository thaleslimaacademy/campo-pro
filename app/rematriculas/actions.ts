"use server"
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

// Antes essas escritas eram feitas do lado do cliente com a chave anon.
// O RLS do Atleta so permite SELECT, entao o update de `ativo` era barrado em
// silencio: a tela dizia que aprovou e o atleta continuava inativo.

export async function listarRematriculas() {
  const escolaId = await getEscolaIdServer()
  const { data, error } = await supabaseAdmin
    .from('Matricula')
    .select('*')
    .eq('escolaId', escolaId)
    .eq('tipo', 'rematricula')
    .order('criadoEm', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function aprovarRematricula(matriculaId: string, atletaId: string | null) {
  const escolaId = await getEscolaIdServer()

  const { error: eMat } = await supabaseAdmin
    .from('Matricula')
    .update({ status: 'APROVADO', dataAprovacao: new Date().toISOString() })
    .eq('id', matriculaId)
    .eq('escolaId', escolaId)
  if (eMat) throw new Error('Falha ao aprovar a rematricula: ' + eMat.message)

  if (atletaId) {
    const { error: eAtl } = await supabaseAdmin
      .from('Atleta')
      .update({ ativo: true })
      .eq('id', atletaId)
      .eq('escolaId', escolaId)
    if (eAtl) throw new Error('Rematricula aprovada, mas falhou ao reativar o atleta: ' + eAtl.message)
  }

  revalidatePath('/rematriculas')
  revalidatePath('/atletas')
  return { ok: true }
}

export async function rejeitarRematricula(matriculaId: string) {
  const escolaId = await getEscolaIdServer()
  const { error } = await supabaseAdmin
    .from('Matricula')
    .update({ status: 'REJEITADO' })
    .eq('id', matriculaId)
    .eq('escolaId', escolaId)
  if (error) throw new Error('Falha ao rejeitar: ' + error.message)
  revalidatePath('/rematriculas')
  return { ok: true }
}
