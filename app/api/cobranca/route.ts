import { NextRequest, NextResponse } from 'next/server'
import { criarClienteAsaas, criarCobrancaPix, getPixQrCode } from '@/lib/asaas'
import { supabaseAdmin } from '@/lib/supabase'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { enviarWhatsApp } from '@/lib/whatsapp'

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
    const competencia = String(vencimento).slice(0, 7) + '-01'
    const ehMensalidade = String(descricao || 'Mensalidade').trim().toLowerCase().startsWith('mensalidade')
    if (ehMensalidade && !forcar) {
      const { data: existentes } = await supabaseAdmin.from('Cobranca')
        .select('id, valor, status, descricao')
        .eq('atletaId', atletaId)
        .eq('competencia', competencia)
        .is('excluidaEm', null)
        .in('status', ['PENDENTE', 'VENCIDO', 'PAGO'])
      const jaExiste = (existentes || []).find(c => String(c.descricao || '').trim().toLowerCase().startsWith('mensalidade'))
      if (jaExiste) {
        return NextResponse.json({
          error: `Ja existe uma mensalidade de ${competencia.slice(0, 7)} para este atleta: R$ ${Number(jaExiste.valor).toFixed(2)} (${jaExiste.status}). Cancele a anterior antes de gerar outra.`,
          jaExiste: true, cobrancaId: jaExiste.id,
        }, { status: 409 })
      }
    }
    const { data: responsaveis } = await supabaseAdmin.from('Responsavel').select('nome, whatsapp').eq('atletaId', atletaId).eq('principal', true).limit(1)
    const responsavel = responsaveis?.[0] || null
    let asaasCustomerId = atleta.asaasCustomerId
    if (!asaasCustomerId) {
      const dadosCliente: Record<string, string> = { name: atleta.nome }
      const cpfLimpo = (atleta.cpf || '').replace(/\D/g, '')
      if (cpfLimpo.length >= 11) dadosCliente.cpfCnpj = cpfLimpo
      if (atleta.telefone) dadosCliente.phone = atleta.telefone.replace(/\D/g, '')
      if (atleta.endereco) dadosCliente.address = atleta.endereco
      if (atleta.numero) dadosCliente.addressNumber = atleta.numero
      if (atleta.bairro) dadosCliente.province = atleta.bairro
      if (atleta.cep) dadosCliente.postalCode = atleta.cep.replace(/\D/g, '')
      const cliente = await criarClienteAsaas(apiKey, dadosCliente as any)
      if (cliente.errors) return NextResponse.json({ error: 'Erro ao criar cliente Asaas', detalhes: cliente.errors }, { status: 400 })
      asaasCustomerId = cliente.id
      await supabaseAdmin.from('Atleta').update({ asaasCustomerId }).eq('id', atletaId)
    }
    const cobranca = await criarCobrancaPix(apiKey, { customer: asaasCustomerId, billingType: 'PIX', value: valor, dueDate: vencimento, description: descricao || 'Mensalidade', ...(multaAtraso > 0 ? { fine: { value: multaAtraso } } : {}), ...(jurosAoMes > 0 ? { interest: { value: jurosAoMes } } : {}), ...(desconto ? { discount: desconto } : {}) })
    if (cobranca.errors || !cobranca.id) return NextResponse.json({ error: 'Erro ao criar cobrança', detalhes: cobranca }, { status: 400 })
    const qrCode = await getPixQrCode(apiKey, cobranca.id)
    const novoId = crypto.randomUUID()
    const { data: atletaData } = await supabaseAdmin.from('Atleta').select('nome').eq('id', atletaId).single()
    const { error: errInsert } = await supabaseAdmin.from('Cobranca').insert({ id: novoId, escolaId, atletaId, atletaNome: atletaData?.nome?.trim() || null, valor, vencimento, competencia, status: 'PENDENTE', asaasId: cobranca.id, pixCopiaCola: qrCode.payload || null, pixQrCode: qrCode.encodedImage || null, descricao })
    if (errInsert) return NextResponse.json({ error: 'Cobranca criada no Asaas mas falhou ao salvar no banco: ' + errInsert.message }, { status: 500 })
    if (responsavel?.whatsapp && qrCode.payload) {
      const dataVencimento = new Date(vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
      const nomeResp = responsavel.nome.split(' ')[0]
      const linkPagamento = `https://gestaofc.com.br/pagar/${novoId}`
      const mensagem = `Olá ${nomeResp}! 👋\n\nA cobrança de *${atleta.nome}* foi gerada.\n\n💰 *Valor:* R$ ${Number(valor).toFixed(2)}\n📅 *Vencimento:* ${dataVencimento}\n📝 ${descricao || 'Mensalidade'}\n\nAcesse o link abaixo para pagar com Pix:\n👉 ${linkPagamento}\n\n_Thales Lima Football Academy_ ⚽`
      await enviarWhatsApp(responsavel.whatsapp, mensagem, escolaId)
    }
    return NextResponse.json({ sucesso: true, pixCopiaCola: qrCode.payload, pixQrCode: qrCode.encodedImage })
  } catch (err: any) { console.error('❌ Erro geral:', err.message); return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 }) }
}
