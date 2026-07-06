'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

export async function getMatriculas() {
  const escolaId = await getEscolaIdServer()
  const [matriculasRes, escolaRes] = await Promise.all([
    supabaseAdmin.from('Matricula').select('*').eq('escolaId', escolaId).order('criadoEm', { ascending: false }),
    supabaseAdmin.from('Escola').select('valorMensalidade').eq('id', escolaId).single(),
  ])
  return {
    escolaId,
    matriculas: matriculasRes.data ?? [],
    valorMensalidade: Number(escolaRes.data?.valorMensalidade ?? 100),
  }
}

export async function getTurmasDaEscola(escolaId: string) {
  const { data } = await supabaseAdmin.from('Turma').select('id, nome, modalidade').eq('escolaId', escolaId).eq('ativa', true).order('nome')
  return data ?? []
}

export async function aprovarMatricula(matriculaId: string, escolaId: string, atletaData: {
  nome: string; dataNascimento: string; cpf: string | null; rg: string | null; posicao: string | null
  telefone: string | null; cep: string | null; endereco: string | null; numero: string | null
  bairro: string | null; cidade: string | null; estado: string | null
  nomeResponsavel: string; whatsappResponsavel: string
}) {
  const atletaId   = crypto.randomUUID()
  const tokenPais  = crypto.randomUUID()
  const { error } = await supabaseAdmin.from('Atleta').insert({ id: atletaId, escolaId, nome: atletaData.nome, dataNascimento: atletaData.dataNascimento, cpf: atletaData.cpf, rg: atletaData.rg, posicao: atletaData.posicao, telefone: atletaData.telefone, cep: atletaData.cep, endereco: atletaData.endereco, numero: atletaData.numero, bairro: atletaData.bairro, cidade: atletaData.cidade, estado: atletaData.estado, tokenPais, ativo: true })
  if (error) throw new Error(error.message)
  const { error: errResp } = await supabaseAdmin.from('Responsavel').upsert(
    { id: crypto.randomUUID(), atletaId, nome: atletaData.nomeResponsavel, telefone: atletaData.whatsappResponsavel, whatsapp: atletaData.whatsappResponsavel, principal: true },
    { onConflict: 'atletaId' }
  )
  if (errResp) console.error('Responsavel insert error:', errResp.message)
  await supabaseAdmin.from('Matricula').update({ status: 'APROVADO', atletaId }).eq('id', matriculaId)
  revalidatePath('/matriculas')
  return { atletaId, tokenPais }
}

export async function recusarMatricula(matriculaId: string) {
  await supabaseAdmin.from('Matricula').update({ status: 'RECUSADO' }).eq('id', matriculaId)
  revalidatePath('/matriculas')
}
