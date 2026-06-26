'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function getCarteirinhaData(atletaId: string) {
  const escolaId = await getEscolaIdServer()
  const [atletaRes, escolaRes] = await Promise.all([
    supabaseAdmin.from('Atleta').select('id, nome, posicao, dataNascimento, cpf, fotoUrl, tokenPais, turmaId').eq('id', atletaId).single(),
    supabaseAdmin.from('Escola').select('id, nome, cidade, estado, logoUrl, corPrimaria, corSecundaria, corTexto').eq('id', escolaId).single(),
  ])
  const atleta = atletaRes.data
  let turma = null
  if (atleta?.turmaId) {
    const { data } = await supabaseAdmin.from('Turma').select('id, nome').eq('id', atleta.turmaId).single()
    turma = data
  }
  return { atleta, turma, escola: escolaRes.data }
}

export async function salvarLogoEscola(logoUrl: string) {
  const escolaId = await getEscolaIdServer()
  await supabaseAdmin.from('Escola').update({ logoUrl }).eq('id', escolaId)
}

export async function salvarCoresEscola(corPrimaria: string, corSecundaria: string, corTexto: string) {
  const escolaId = await getEscolaIdServer()
  await supabaseAdmin.from('Escola').update({ corPrimaria, corSecundaria, corTexto }).eq('id', escolaId)
}
