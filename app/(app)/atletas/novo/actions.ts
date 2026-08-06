"use server"
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'
import { clampDiaPreferido } from '@/lib/dataVencimento'

// Antes o cadastro era feito do lado do cliente com a chave anon. O RLS de
// Atleta e Responsavel so permite SELECT, entao os inserts eram barrados.
// O insert tambem usava `unidadeEscolar`, coluna que nao existe — a certa e
// `escolaEstuda`.
//
// 06/08/2026 — correcao do cadastro orfao:
// Responsavel.telefone e NOT NULL. Quando o responsavel 2 era preenchido so
// com o nome, ele entrava no array com telefone null e o insert quebrava.
// Como os dois responsaveis vao num unico .insert([...]) (tudo-ou-nada no
// Postgres), o responsavel 1 valido caia junto. O Atleta ja estava gravado e
// nada fazia rollback => atleta orfao a cada clique.
// Alem disso a action fazia throw, e em producao o Next.js troca a excecao
// pela mensagem generica de digest, escondendo o motivo real.

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

export type ResultadoCriarAtleta =
  | { ok: true; atletaId: string }
  | { ok: false; erro: string }

const soDigitos = (v?: string | null) => (v ?? '').replace(/\D/g, '')

type EntradaResponsavel = {
  nome?: string | null
  cpf?: string | null
  whatsapp?: string | null
  email?: string | null
  parentesco?: string | null
}

/**
 * Monta a linha de Responsavel. Retorna null quando o responsavel esta
 * incompleto (sem nome ou sem telefone valido) — nesse caso ele NAO entra
 * no insert, em vez de derrubar o statement inteiro.
 */
function montarResponsavel(
  atletaId: string,
  r: EntradaResponsavel,
  principal: boolean,
) {
  const nome = (r.nome ?? '').trim()
  const fone = soDigitos(r.whatsapp)

  if (!nome || fone.length < 10) return null

  return {
    id: crypto.randomUUID(),
    atletaId,
    nome,
    telefone: fone,          // coluna NOT NULL — nunca pode ir nula
    whatsapp: fone,
    cpf: soDigitos(r.cpf) || null,
    email: r.email?.trim() || null,
    parentesco: r.parentesco?.trim() || null,
    principal,
  }
}

export async function criarAtleta(form: FormNovoAtleta): Promise<ResultadoCriarAtleta> {
  try {
    const escolaId = await getEscolaIdServer()

    // ---- validacoes de entrada ------------------------------------------
    if (!form.nome?.trim()) {
      return { ok: false, erro: 'Informe o nome do atleta.' }
    }
    // dataNascimento e NOT NULL no banco: sem ela o insert quebra
    if (!form.dataNascimento) {
      return { ok: false, erro: 'Informe a data de nascimento do atleta.' }
    }
    if (!form.nomeResponsavel?.trim()) {
      return { ok: false, erro: 'Informe o nome do responsavel principal.' }
    }
    if (soDigitos(form.whatsappResponsavel).length < 10) {
      return { ok: false, erro: 'Informe o WhatsApp do responsavel principal (com DDD).' }
    }
    // responsavel 2 pela metade: avisa em vez de quebrar o cadastro
    if (form.nomeResponsavel2?.trim() && soDigitos(form.whatsappResponsavel2).length < 10) {
      return {
        ok: false,
        erro: 'Responsavel 2: preencha o WhatsApp com DDD ou apague o nome para deixa-lo em branco.',
      }
    }

    const atletaId  = crypto.randomUUID()
    const tokenPais = crypto.randomUUID()
    const dia = Number(form.diaVencimento) || 10

    // ---- 1) atleta -------------------------------------------------------
    const { error: eAtl } = await supabaseAdmin.from('Atleta').insert({
      id: atletaId, escolaId,
      nome: form.nome.trim(),
      dataNascimento: form.dataNascimento,
      cpf: soDigitos(form.cpf) || null,
      rg: form.rg || null,
      telefone: soDigitos(form.telefone) || null,
      posicao: form.posicao || null,
      turmaId: form.turmaId || null,
      diaVencimento: clampDiaPreferido(dia),
      planoMensalidade: form.planoMensalidade || null,
      valorMensalidade: form.valorMensalidade ? Number(form.valorMensalidade) : null,
      turnoEstuda: form.turnoEstuda || null,
      escolaEstuda: form.unidadeEscolar || null,
      serieEstuda: form.serieEstuda || null,
      cep: soDigitos(form.cep) || null,
      endereco: form.endereco || null,
      numero: form.numero || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      ativo: true, tokenPais,
    })

    if (eAtl) {
      console.error('[criarAtleta] insert Atleta', eAtl)
      return { ok: false, erro: 'Falha ao salvar o atleta: ' + eAtl.message }
    }

    // ---- 2) responsaveis -------------------------------------------------
    const responsaveis = [
      montarResponsavel(atletaId, {
        nome: form.nomeResponsavel,
        cpf: form.cpfResponsavel,
        whatsapp: form.whatsappResponsavel,
        email: form.emailResponsavel,
        parentesco: form.parentescoResponsavel,
      }, true),
      montarResponsavel(atletaId, {
        nome: form.nomeResponsavel2,
        cpf: form.cpfResponsavel2,
        whatsapp: form.whatsappResponsavel2,
        email: null,
        parentesco: form.parentesco2,
      }, false),
    ].filter((r): r is NonNullable<typeof r> => r !== null)

    if (responsaveis.length === 0) {
      await supabaseAdmin.from('Atleta').delete().eq('id', atletaId)
      return { ok: false, erro: 'Informe ao menos um responsavel com nome e WhatsApp.' }
    }

    const { error: eResp } = await supabaseAdmin.from('Responsavel').insert(responsaveis)

    if (eResp) {
      // rollback manual: sem isso sobra atleta orfao no banco a cada tentativa
      console.error('[criarAtleta] insert Responsavel', eResp)
      await supabaseAdmin.from('Atleta').delete().eq('id', atletaId)
      return { ok: false, erro: 'Falha ao salvar o responsavel: ' + eResp.message }
    }

    revalidatePath('/atletas')
    return { ok: true, atletaId }

  } catch (e) {
    console.error('[criarAtleta] erro inesperado', e)
    return {
      ok: false,
      erro: e instanceof Error ? e.message : 'Erro inesperado ao cadastrar o atleta.',
    }
  }
}
