import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { cancelarPixDaCobranca, CAMPOS_PIX_LIMPOS } from '@/lib/cancelarPixDaCobranca'
import { msgLembreteD3, msgVencimentoHoje, msgAtraso } from '@/lib/whatsapp-templates'

/**
 * Esta rota usa supabaseAdmin (service role, ignora RLS). Sem checar a
 * sessao, qualquer pessoa com o endereco conseguia dar baixa ou excluir
 * cobranca das duas escolas mandando um cobrancaId no body.
 * Toda operacao passa por aqui primeiro e depois filtra por escolaId.
 */
async function escolaDaSessao(): Promise<string | null> {
  try {
    const escolaId = await getEscolaIdServer()
    return escolaId || null
  } catch {
    return null
  }
}

async function carregarCobranca(cobrancaId: string, escolaId: string) {
  const { data } = await supabaseAdmin
    .from('Cobranca')
    .select('id, valor, vencimento, descricao, pixCopiaCola, escolaId')
    .eq('id', cobrancaId)
    .eq('escolaId', escolaId)
    .maybeSingle()
  return data
}

// PATCH - marcar como pago manualmente
export async function PATCH(req: NextRequest) {
  const escolaId = await escolaDaSessao()
  if (!escolaId) return NextResponse.json({ error: 'nao autenticado' }, { status: 401 })

  const { cobrancaId, valorPago, formaPagamento } = await req.json()
  if (!cobrancaId) return NextResponse.json({ error: 'cobrancaId obrigatorio' }, { status: 400 })

  const cobranca = await carregarCobranca(cobrancaId, escolaId)
  if (!cobranca) return NextResponse.json({ error: 'Cobranca nao encontrada' }, { status: 404 })

  // Cancela o PIX antes: sem isso o pai continua com um codigo valido de
  // uma cobranca que o app ja considera paga.
  const pix = await cancelarPixDaCobranca(cobrancaId)

  const valorFinal = valorPago != null ? Number(valorPago) : Number(cobranca.valor)

  const { error } = await supabaseAdmin
    .from('Cobranca')
    .update({
      status: 'PAGO',
      pagoEm: new Date().toISOString(),
      valorPago: valorFinal,
      baixaManual: true,
      baixaManualEm: new Date().toISOString(),
      tipo: formaPagamento || 'MANUAL',
      ...(pix.ok ? CAMPOS_PIX_LIMPOS : {}),
    })
    .eq('id', cobrancaId)
    .eq('escolaId', escolaId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    valorPago: valorFinal,
    ...(pix.ok ? {} : { aviso: `PIX continua ativo no Asaas: ${pix.erro}` }),
  })
}

// POST - reenviar cobrança no WhatsApp
export async function POST(req: NextRequest) {
  const escolaId = await escolaDaSessao()
  if (!escolaId) return NextResponse.json({ error: 'nao autenticado' }, { status: 401 })

  const { cobrancaId, atletaId } = await req.json()
  if (!cobrancaId || !atletaId) return NextResponse.json({ error: 'campos obrigatorios' }, { status: 400 })

  const cobranca = await carregarCobranca(cobrancaId, escolaId)
  if (!cobranca) return NextResponse.json({ error: 'Cobranca nao encontrada' }, { status: 404 })

  const { data: atleta } = await supabaseAdmin
    .from('Atleta')
    .select('nome')
    .eq('id', atletaId)
    .eq('escolaId', escolaId)
    .maybeSingle()

  if (!atleta) return NextResponse.json({ error: 'Atleta nao encontrado' }, { status: 404 })

  // Busca responsável — primeiro na tabela Responsavel, fallback na Matricula
  let responsavel: { nome: string; whatsapp: string } | null = null

  const { data: responsaveis } = await supabaseAdmin
    .from('Responsavel').select('nome, whatsapp').eq('atletaId', atletaId).eq('principal', true).limit(1)

  if (responsaveis?.[0]?.whatsapp) {
    responsavel = responsaveis[0]
  } else {
    // Fallback: busca na matrícula aprovada
    const { data: matricula } = await supabaseAdmin
      .from('Matricula').select('nomeResponsavel, whatsappResponsavel')
      .eq('atletaId', atletaId).eq('status', 'APROVADO').limit(1).maybeSingle()
    if (matricula?.whatsappResponsavel) {
      responsavel = { nome: matricula.nomeResponsavel, whatsapp: matricula.whatsappResponsavel }
      // Cria o Responsavel para próximas vezes
      await supabaseAdmin.from('Responsavel').upsert({
        id: crypto.randomUUID(), atletaId, nome: matricula.nomeResponsavel,
        telefone: matricula.whatsappResponsavel, whatsapp: matricula.whatsappResponsavel, principal: true
      }, { onConflict: 'atletaId' })
    }
  }

  if (!responsavel?.whatsapp) return NextResponse.json({ error: 'Responsavel sem WhatsApp' }, { status: 400 })

  const vencISO = (cobranca.vencimento || '').slice(0, 10)
  const dataVenc = new Date(vencISO + 'T12:00:00').toLocaleDateString('pt-BR')
  const nomeResp = responsavel.nome.split(' ')[0]
  const linkPag = `https://gestaofc.com.br/pagar/${cobrancaId}`

  // Reaproveita os templates ja aprovados da regua (lembrete/vencimento/atraso)
  // em vez de texto livre — a Meta bloqueia texto livre proativo em silencio.
  const diasParaVencer = Math.round((new Date(vencISO + 'T12:00:00').getTime() - Date.now()) / 86400000)

  const params = {
    telefone: responsavel.whatsapp,
    nomeResp,
    nomeAtleta: atleta.nome,
    valor: Number(cobranca.valor),
    linkPagamento: linkPag,
    escolaId,
  }

  if (diasParaVencer > 0) {
    await msgLembreteD3({ ...params, dataVenc, dias: diasParaVencer })
  } else if (diasParaVencer === 0) {
    await msgVencimentoHoje({ ...params, dataVenc })
  } else {
    await msgAtraso({ ...params, diasAtraso: -diasParaVencer })
  }

  return NextResponse.json({ ok: true })
}

// DELETE - excluir cobrança
export async function DELETE(req: NextRequest) {
  const escolaId = await escolaDaSessao()
  if (!escolaId) return NextResponse.json({ error: 'nao autenticado' }, { status: 401 })

  const { cobrancaId } = await req.json()
  if (!cobrancaId) return NextResponse.json({ error: 'cobrancaId obrigatorio' }, { status: 400 })

  const cobranca = await carregarCobranca(cobrancaId, escolaId)
  if (!cobranca) return NextResponse.json({ error: 'Cobranca nao encontrada' }, { status: 404 })

  // Asaas primeiro. Se recusar, nao exclui — e devolve o motivo pra tela.
  const pix = await cancelarPixDaCobranca(cobrancaId)
  if (!pix.ok) {
    return NextResponse.json({ error: `Nao foi possivel excluir: ${pix.erro}` }, { status: 409 })
  }

  const { data, error } = await supabaseAdmin
    .from('Cobranca')
    .update({
      status: 'CANCELADO',
      excluidaEm: new Date().toISOString(),
      ...CAMPOS_PIX_LIMPOS,
    })
    .eq('id', cobrancaId)
    .eq('escolaId', escolaId)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) return NextResponse.json({ error: 'Nenhuma cobranca excluida' }, { status: 404 })

  return NextResponse.json({ ok: true, pixCancelado: pix.cancelado, observacao: pix.observacao })
}
