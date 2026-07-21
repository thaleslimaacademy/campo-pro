"use server"
import { supabaseAdmin } from '@/lib/supabase'

// A rematricula era gravada do lado do cliente com a chave anon. Funcionava so
// porque a policy do Matricula e publica — o mesmo buraco que qualquer um na
// internet poderia usar. Agora e server-side, com supabaseAdmin, e o erro e
// checado (antes o insert falho ainda mostrava tela de sucesso).

type RematriculaInput = {
  escolaId: string
  atletaId: string
  nomeAtleta: string
  dataNascimento: string | null
  cpf: string | null
  rg: string | null
  posicao: string
  telefone: string | null
  nomeResponsavel: string
  whatsappResponsavel: string
  emailResponsavel: string | null
  cpfResponsavel: string
  cep: string | null
  endereco: string | null
  numero: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  nomeResponsavel2: string | null
  whatsappResponsavel2: string | null
  parentesco2: string | null
  tamanhoUniforme: string | null
  autorizacaoImagem: boolean
  nomeAssinatura: string
}

export async function enviarRematricula(input: RematriculaInput) {
  if (!input.escolaId) throw new Error('Escola nao identificada.')
  if (!input.nomeResponsavel?.trim()) throw new Error('Nome do responsavel e obrigatorio.')
  if (!input.cpfResponsavel?.trim()) throw new Error('CPF do responsavel e obrigatorio.')
  if (!input.whatsappResponsavel?.trim()) throw new Error('WhatsApp e obrigatorio.')

  const { error } = await supabaseAdmin.from('Matricula').insert({
    id: crypto.randomUUID(),
    escolaId: input.escolaId,
    nomeAtleta: input.nomeAtleta,
    dataNascimento: input.dataNascimento,   // pode ser null — nao vira Invalid Date
    cpf: input.cpf,
    rg: input.rg,
    posicao: input.posicao || null,
    telefone: input.telefone,
    cep: input.cep, endereco: input.endereco, numero: input.numero,
    bairro: input.bairro, cidade: input.cidade, estado: input.estado,
    nomeResponsavel: input.nomeResponsavel.trim(),
    whatsappResponsavel: input.whatsappResponsavel,
    emailResponsavel: input.emailResponsavel,
    cpfResponsavel: input.cpfResponsavel,
    nomeResponsavel2: input.nomeResponsavel2,
    whatsappResponsavel2: input.whatsappResponsavel2,
    parentesco2: input.parentesco2,
    tamanhoUniforme: input.tamanhoUniforme,
    autorizacaoImagem: input.autorizacaoImagem,
    contratoAceito: true,
    nomeAssinatura: input.nomeAssinatura,
    dataAssinatura: new Date().toISOString(),
    status: 'PENDENTE',
    tipo: 'rematricula',
    atletaId_rematricula: input.atletaId,
  })

  if (error) throw new Error(error.message)
  return { ok: true }
}
