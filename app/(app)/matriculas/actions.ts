'use server'
import { gerarMensalidades } from '@/app/(app)/financeiro/mensalidades/actions'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { revalidatePath } from 'next/cache'

export async function getMatriculas() {
  const escolaId = await getEscolaIdServer()
  const [matriculasRes, escolaRes] = await Promise.all([
    supabaseAdmin.from('Matricula').select('*').eq('escolaId', escolaId).order('criadoEm', { ascending: false }),
    supabaseAdmin.from('Escola').select('valorMensalidade, valorMatricula').eq('id', escolaId).single(),
  ])
  return {
    escolaId,
    matriculas: matriculasRes.data ?? [],
    valorMensalidade: Number(escolaRes.data?.valorMensalidade ?? 100),
    valorMatricula: Number(escolaRes.data?.valorMatricula ?? 0),
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
  turmaId?: string; turnoEstuda?: string; valorMensalidade?: number; diaVencimento?: number
}) {
  const atletaId   = crypto.randomUUID()
  const tokenPais  = crypto.randomUUID()
  const aprovadoEm = new Date()

  // Dia de vencimento: usa o que veio do formulario; se nao veio, puxa
  // automaticamente do dia da APROVACAO. Clamp em 28 porque 29/30/31 nao
  // existem em todo mes — fevereiro quebraria a cobranca em silencio.
  const diaVencimento = atletaData.diaVencimento
    ? Math.min(Number(atletaData.diaVencimento), 28)
    : Math.min(aprovadoEm.getDate(), 28)

  const { error } = await supabaseAdmin.from('Atleta').insert({ id: atletaId, escolaId, nome: atletaData.nome, dataNascimento: atletaData.dataNascimento, cpf: atletaData.cpf, rg: atletaData.rg, posicao: atletaData.posicao, telefone: atletaData.telefone, cep: atletaData.cep, endereco: atletaData.endereco, numero: atletaData.numero, bairro: atletaData.bairro, cidade: atletaData.cidade, estado: atletaData.estado, tokenPais, ativo: true, turmaId: atletaData.turmaId || null, valorMensalidade: atletaData.valorMensalidade ? Number(atletaData.valorMensalidade) : null, diaVencimento })
  if (error) throw new Error(error.message)
  // A pre-geracao das 12 mensalidades NAO acontece mais aqui. Ela rodava antes
  // de o admin configurar o valor no modal "Configure a mensalidade", entao as
  // 12 nasciam com o valor padrao da escola e a configuracao correta depois
  // batia na trava de duplicata. Agora quem pre-gera e `preGerarRestante()`,
  // chamada pelo modal com o valor ja definido.

  // Antes era .upsert({...}, { onConflict: 'atletaId' }), mas nao existe
  // constraint unica em Responsavel.atletaId — o Postgres recusa com 42P10 e o
  // responsavel nunca era salvo. O atleta acabou de ser criado acima, entao um
  // insert simples e seguro.
  const { error: errResp } = await supabaseAdmin.from('Responsavel').insert({
    id: crypto.randomUUID(), atletaId, nome: atletaData.nomeResponsavel,
    telefone: atletaData.whatsappResponsavel, whatsapp: atletaData.whatsappResponsavel,
    principal: true,
  })
  if (errResp) throw new Error('Atleta criado, mas falhou ao salvar o responsavel: ' + errResp.message)
  await supabaseAdmin.from('Matricula').update({ status: 'APROVADO', atletaId, dataAprovacao: aprovadoEm.toISOString() }).eq('id', matriculaId)
  revalidatePath('/matriculas')
  return { atletaId, tokenPais }
}

/**
 * Pre-gera as mensalidades dos proximos meses, depois que o admin definiu o
 * valor no modal. A trava de duplicata do `gerarMensalidades` pula o mes que
 * ja tem a 1a cobranca (a que leva a taxa de matricula).
 * A regua diaria mantem essa janela de 3 meses sempre renovada.
 */
export async function preGerarRestante(atletaId: string, valor: number, diaVencimento: number) {
  try {
    const r = await gerarMensalidades({
      atletaId,
      // 3 meses. A regua diaria mantem sempre 3 meses a frente e renova
      // sozinha — nao faz sentido travar 12 competencias de uma vez.
      quantidade: 3,
      valor: Number(valor),
      diaVencimento: Math.min(Number(diaVencimento) || 10, 28),
      silencioso: true,
    })
    return { ok: true, geradas: r.geradas ?? 0 }
  } catch (err) {
    console.error('Erro ao pre-gerar mensalidades:', err)
    return { ok: false, geradas: 0, erro: (err as Error).message }
  }
}

export async function recusarMatricula(matriculaId: string) {
  await supabaseAdmin.from('Matricula').update({ status: 'RECUSADO' }).eq('id', matriculaId)
  revalidatePath('/matriculas')
}
