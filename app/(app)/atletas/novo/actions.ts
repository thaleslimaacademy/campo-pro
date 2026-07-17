"use server"
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

// Antes o cadastro era feito do lado do cliente com a chave anon. O RLS de
// Atleta e Responsavel so permite SELECT, entao os inserts eram barrados.
// O insert tambem usava `unidadeEscolar`, coluna que nao existe — a certa e
// `escolaEstuda`.

type FormNovoAtleta = {
  nome: string; dataNascimento: string; cpf?: string; rg?: string; telefone?: string
  posicao?: string; turmaId?: string; diaVencimento?: string
  planoMensalidade?: string; valorMensalidade?: string
  turnoEstuda?: string; unidadeEscolar?: string; serieEstuda?: string
  cep?: string; endereco?: string; numero?: string; bairro?: string; cidade?: string; estado?: string
  nomeResponsavel: string; cpfResponsavel?: string; whatsappResponsavel?: string
  emailResponsavel?: string; parentescoResponsavel?: string
  nomeResponsavel2?: string; cpfResponsavel2?: string; whatsappResponsavel2?: string; parentesco2?: string
}

export async function criarAtleta(form: FormNovoAtleta) {
  const escolaId = await getEscolaIdServer()

  if (!form.nome?.trim()) throw new Error('Nome do atleta e obrigatorio.')
  if (!form.nomeResponsavel?.trim()) throw new Error('Nome do responsavel e obrigatorio.')

  const atletaId  = crypto.randomUUID()
  const tokenPais = crypto.randomUUID()

  const dia = Number(form.diaVencimento) || 10

  const { error: eAtl } = await supabaseAdmin.from('Atleta').insert({
    id: atletaId, escolaId,
    nome: form.nome.trim(),
    dataNascimento: form.dataNascimento || null,
    cpf: form.cpf || null, rg: form.rg || null,
    telefone: form.telefone || null,
    posicao: form.posicao || null,
    turmaId: form.turmaId || null,
    diaVencimento: Math.min(dia, 28),
    planoMensalidade: form.planoMensalidade || null,
    valorMensalidade: form.valorMensalidade ? Number(form.valorMensalidade) : null,
    turnoEstuda: form.turnoEstuda || null,
    escolaEstuda: form.unidadeEscolar || null,
    serieEstuda: form.serieEstuda || null,
    cep: form.cep || null, endereco: form.endereco || null,
    numero: form.numero || null, bairro: form.bairro || null,
    cidade: form.cidade || null, estado: form.estado || null,
    ativo: true, tokenPais,
  })
  if (eAtl) throw new Error('Falha ao salvar o atleta: ' + eAtl.message)

  const responsaveis: Record<string, unknown>[] = [{
    id: crypto.randomUUID(), atletaId,
    nome: form.nomeResponsavel.trim(),
    cpf: form.cpfResponsavel || null,
    whatsapp: form.whatsappResponsavel || null,
    telefone: form.whatsappResponsavel || null,
    email: form.emailResponsavel || null,
    parentesco: form.parentescoResponsavel || null,
    principal: true,
  }]

  if (form.nomeResponsavel2?.trim()) {
    responsaveis.push({
      id: crypto.randomUUID(), atletaId,
      nome: form.nomeResponsavel2.trim(),
      cpf: form.cpfResponsavel2 || null,
      whatsapp: form.whatsappResponsavel2 || null,
      telefone: form.whatsappResponsavel2 || null,
      email: null,
      parentesco: form.parentesco2 || null,
      principal: false,
    })
  }

  const { error: eResp } = await supabaseAdmin.from('Responsavel').insert(responsaveis)
  if (eResp) throw new Error('Atleta criado, mas falhou ao salvar o responsavel: ' + eResp.message)

  revalidatePath('/atletas')
  return { atletaId }
}
