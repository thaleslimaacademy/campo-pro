import { getEscolaId } from '@/lib/auth/getEscolaId'
import { NextRequest, NextResponse } from 'next/server'
import { criarClienteAsaas, criarCobrancaPix, getPixQrCode } from '@/lib/asaas'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { atletaId, valor, vencimento, descricao } = body

    if (!atletaId || !valor || !vencimento) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: atletaId, valor, vencimento' },
        { status: 400 }
      )
    }

    // Busca configurações da escola
    const escolaId = await getEscolaId()
    const { data: escola } = await supabaseAdmin.from('Escola').select('multaAtraso, jurosAoMes').eq('id', escolaId).single()
    const multaAtraso = Number(escola?.multaAtraso || 0)
    const jurosAoMes = Number(escola?.jurosAoMes || 0)

    // Busca atleta + responsável
    const { data: atleta } = await supabase
      .from('Atleta')
      .select('*')
      .eq('id', atletaId)
      .single()

    if (!atleta) {
      return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })
    }

    const { data: responsaveis } = await supabase
      .from('Responsavel')
      .select('nome, whatsapp')
      .eq('atletaId', atletaId)
      .eq('principal', true)
      .limit(1)

    const responsavel = responsaveis?.[0] || null

    // Cria ou reutiliza cliente Asaas
    let asaasCustomerId = atleta.asaasCustomerId

    if (!asaasCustomerId) {
      const cliente = await criarClienteAsaas({
        name: atleta.nome,
        cpfCnpj: atleta.cpf || '00000000000',
        phone: atleta.telefone || '',
        address: atleta.endereco || '',
        addressNumber: atleta.numero || '',
        province: atleta.bairro || '',
        postalCode: atleta.cep || '',
      })

      if (cliente.errors) {
        return NextResponse.json(
          { error: 'Erro ao criar cliente Asaas', detalhes: cliente.errors },
          { status: 400 }
        )
      }

      asaasCustomerId = cliente.id
      await supabase.from('Atleta').update({ asaasCustomerId }).eq('id', atletaId)
    }

    // Cria cobrança Pix
    const cobranca = await criarCobrancaPix({
      customer: asaasCustomerId,
      billingType: 'PIX',
      value: valor,
      dueDate: vencimento,
      description: descricao || 'Mensalidade',
      ...(multaAtraso > 0 ? { fine: { value: multaAtraso } } : {}),
      ...(jurosAoMes > 0 ? { interest: { value: jurosAoMes } } : {}),
    })

    if (cobranca.errors || !cobranca.id) {
      return NextResponse.json(
        { error: 'Erro ao criar cobrança', detalhes: cobranca },
        { status: 400 }
      )
    }

    // Busca QR Code
    const qrCode = await getPixQrCode(cobranca.id)

    // Salva no Supabase
    const { data: cobrancaDb } = await supabase.from('Cobranca').insert({
      id: crypto.randomUUID(),
      escolaId: await getEscolaId(),
      atletaId,
      valor,
      vencimento,
      status: 'PENDENTE',
      asaasId: cobranca.id,
      pixCopiaCola: qrCode.payload || null,
      pixQrCode: qrCode.encodedImage || null,
      descricao,
    })

    // Envia WhatsApp para o responsável
    if (responsavel?.whatsapp && qrCode.payload) {
      const dataVencimento = new Date(vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
      const nomeResp = responsavel.nome.split(' ')[0]

      const cobrancaId = cobrancaDb?.id || ''
      const linkPagamento = `https://gestaofc.com.br/pagar/${cobrancaId}`
      const mensagem =
        `Olá ${nomeResp}! 👋\n\n` +
        `A cobrança de *${atleta.nome}* foi gerada.\n\n` +
        `💰 *Valor:* R$ ${Number(valor).toFixed(2)}\n` +
        `📅 *Vencimento:* ${dataVencimento}\n` +
        `📝 ${descricao || 'Mensalidade'}\n\n` +
        `Acesse o link abaixo para ver o QR Code e pagar com Pix:\n` +
        `👉 ${linkPagamento}\n\n` +
        `_Thales Lima Football Academy_ ⚽`

      await enviarWhatsApp(responsavel.whatsapp, mensagem)
    }

    return NextResponse.json({
      sucesso: true,
      pixCopiaCola: qrCode.payload,
      pixQrCode: qrCode.encodedImage,
    })

  } catch (err: any) {
    console.error('❌ Erro geral:', err.message)
    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status: 500 }
    )
  }
}