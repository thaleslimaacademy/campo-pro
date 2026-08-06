import { NextRequest, NextResponse } from 'next/server'
import { criarCobrancaPix, getPixQrCode, cancelarCobrancaAsaas } from '@/lib/asaas'
import { garantirClienteAsaas } from '@/lib/asaasCliente'
import { supabaseAdmin } from '@/lib/supabase'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { msgLembreteD3, msgVencimentoHoje } from '@/lib/whatsapp-templates'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { atletaId, valor, vencimento, descricao, desconto, forcar } = body
    if (!atletaId || !valor || !vencimento) return NextResponse.json({ error: 'Campos obrigatórios: atletaId, valor, vencimento' }, { status: 400 })
    const escolaId = await getEscolaIdServer()
    const apiKey = await getAsaasKey(escolaId)
    const { data: escola } = await supabaseAdmin.from('Escola').select('multaAtraso, jurosAoMes, nome').eq('id', escolaId).single()
    const multaAtraso = Number(escola?.multaAtraso || 0)
    const jurosAoMes = Number(escola?.jurosAoMes || 0)
    const { data: atleta } = await supabaseAdmin.from('Atleta').select('*').eq('id', atletaId).single()
    if (!atleta) return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })

    // ── TRAVA DE DUPLICATA ────────────────────────────────────────────
    // Impede duas mensalidades do mesmo mes para o mesmo atleta. Cobre o
    // duplo clique no botao e a colisao com cobranca ja pre-gerada.
    // Cobrancas avulsas (Uniforme, Taxa...) passam normalmente.
    // Com forcar=true: em vez de bloquear, cancela a pendente antiga
    // (no banco e no Asaas, se ja tinha PIX) e segue criando a nova —
    // e o fluxo de "substituir mensalidade" usado no card Nova Cobranca.
    const competencia = String(vencimento).slice(0, 7) + '-01'
    const ehMensalidade = String(descricao || 'Mensalidade').trim().toLowerCase().startsWith('mensalidade')
    if (ehMensalidade) {
      const { data: existentes } = await supabaseAdmin.from('Cobranca')
        .select('id, valor, status, descricao, asaasId')
        .eq('atletaId', atletaId)
        .eq('competencia', competencia)
        .is('excluidaEm', null)
        .in('status', ['PENDENTE', 'VENCIDO', 'PAGO'])
      const jaExiste = (existentes || []).find(c => String(c.descricao || '').trim().toLowerCase().startsWith('mensalidade'))
      if (jaExiste && !forcar) {
        return NextResponse.json({
          error: `Ja existe uma mensalidade de ${competencia.slice(0, 7)} para este atleta: R$ ${Number(jaExiste.valor).toFixed(2)} (${jaExiste.status}). Cancele a anterior antes de gerar outra.`,
          jaExiste: true, cobrancaId: jaExiste.id,
        }, { status: 409 })
      }
      if (jaExiste && forcar) {
        if (jaExiste.status === 'PAGO') {
          return NextResponse.json({
            error: `A mensalidade de ${competencia.slice(0, 7)} ja esta PAGA (R$ ${Number(jaExiste.valor).toFixed(2)}). Nao e possivel substituir uma cobranca ja paga.`,
          }, { status: 409 })
        }
        if (jaExiste.asaasId) {
          try { await cancelarCobrancaAsaas(apiKey, jaExiste.asaasId) } catch { /* ja cancelada no Asaas, segue */ }
        }
        const { error: eCanc } = await supabaseAdmin.from('Cobranca').update({
          status: 'CANCELADO', excluidaEm: new Date().toISOString(),
        }).eq('id', jaExiste.id)
        if (eCanc) return NextResponse.json({ error: 'Falhou ao cancelar a mensalidade anterior: ' + eCanc.message }, { status: 500 })
      }
    }
    const { data: responsaveis } = await supabaseAdmin.from('Responsavel')
      .select('nome, whatsapp').eq('atletaId', atletaId).eq('principal', true).limit(1)
    const responsavel = responsaveis?.[0] || null

    // ── CLIENTE ASAAS ─────────────────────────────────────────────────
    // O Asaas recusa cobranca de cliente sem cpfCnpj. Antes o cliente era
    // montado com Atleta.cpf (campo opcional na ficha) e so era criado
    // quando ainda nao existia — quem entrasse sem CPF ficava travado.
    // garantirClienteAsaas usa o CPF do responsavel principal como pagador
    // quando o atleta nao tem, e ATUALIZA o cliente que ja existe.
    const cli = await garantirClienteAsaas(apiKey, atletaId)
    if (!cli.ok) return NextResponse.json({ error: cli.erro }, { status: 400 })
    const asaasCustomerId = cli.customerId

    const cobranca = await criarCobrancaPix(apiKey, { customer: asaasCustomerId, billingType: 'PIX', value: valor, dueDate: vencimento, description: descricao || 'Mensalidade', ...(multaAtraso > 0 ? { fine: { value: multaAtraso } } : {}), ...(jurosAoMes > 0 ? { interest: { value: jurosAoMes } } : {}), ...(desconto ? { discount: desconto } : {}) })
    if (cobranca.errors || !cobranca.id) return NextResponse.json({ error: 'Erro ao criar cobrança', detalhes: cobranca }, { status: 400 })
    const qrCode = await getPixQrCode(apiKey, cobranca.id)
    const novoId = crypto.randomUUID()
    const { data: atletaData } = await supabaseAdmin.from('Atleta').select('nome').eq('id', atletaId).single()
    const { error: errInsert } = await supabaseAdmin.from('Cobranca').insert({ id: novoId, escolaId, atletaId, atletaNome: atletaData?.nome?.trim() || null, valor, vencimento, competencia, status: 'PENDENTE', asaasId: cobranca.id, pixCopiaCola: qrCode.payload || null, pixQrCode: qrCode.encodedImage || null, descricao })
    if (errInsert) return NextResponse.json({ error: 'Cobranca criada no Asaas mas falhou ao salvar no banco: ' + errInsert.message }, { status: 500 })
    if (responsavel?.whatsapp) {
      const dataVencimento = new Date(vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
      const nomeResp = responsavel.nome.split(' ')[0]
      const linkPagamento = `https://gestaofc.com.br/pagar/${novoId}`
      const hojeBR = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
      hojeBR.setHours(0, 0, 0, 0)
      const alvo = new Date(vencimento + 'T12:00:00')
      alvo.setHours(0, 0, 0, 0)
      const dias = Math.round((alvo.getTime() - hojeBR.getTime()) / 86400000)

      try {
        if (dias <= 0) {
          await msgVencimentoHoje({
            telefone: responsavel.whatsapp, nomeResp, nomeAtleta: atleta.nome?.trim() || '',
            valor: Number(valor), dataVenc: dataVencimento, linkPagamento, escolaId,
          })
        } else {
          await msgLembreteD3({
            telefone: responsavel.whatsapp, nomeResp, nomeAtleta: atleta.nome?.trim() || '',
            valor: Number(valor), dataVenc: dataVencimento, linkPagamento, dias, escolaId,
          })
        }
      } catch (e) {
        console.error('❌ Cobranca criada mas WhatsApp falhou:', (e as Error).message)
      }
    }
    return NextResponse.json({ sucesso: true, pixCopiaCola: qrCode.payload, pixQrCode: qrCode.encodedImage })
  } catch (err: any) { console.error('❌ Erro geral:', err.message); return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 }) }
}
