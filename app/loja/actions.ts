'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { criarClienteAsaas, criarCobrancaGenerica, getPixQrCode } from '@/lib/asaas'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function listarProdutosPublicos() {
  const ESCOLA_ID = await getEscolaIdServer()
  const { data } = await supabaseAdmin
    .from('Produto')
    .select('*, ProdutoVariacao(*)')
    .eq('escolaId', ESCOLA_ID)
    .eq('ativo', true)
    .order('createdAt', { ascending: false })
  return data ?? []
}

export async function criarPedido(p: {
  compradorNome: string
  compradorTelefone: string
  compradorEndereco?: string
  itens: { variacaoId: string; nome: string; tamanho?: string; cor?: string; preco: number; qtd: number }[]
  tipoEntrega: 'RETIRADA' | 'ENTREGA'
  metodoPagamento: 'PIX' | 'CREDIT_CARD'
  parcelas?: number
}) {
  const ESCOLA_ID = await getEscolaIdServer()
  const valorTotal = p.itens.reduce((s, i) => s + i.preco * i.qtd, 0)
  if (valorTotal < 5) throw new Error('Valor mínimo R$ 5,00')
  const telefone = p.compradorTelefone.replace(/\D/g, '')
  const cliente = await criarClienteAsaas({
    name: p.compradorNome, cpfCnpj: '00000000191', phone: telefone,
    address: '', addressNumber: '', province: '', postalCode: '',
  })
  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const dadosCobranca: Parameters<typeof criarCobrancaGenerica>[0] = {
    customer: cliente.id,
    billingType: p.metodoPagamento,
    dueDate,
    description: `Pedido Loja GestaoFC (${p.itens.length} item${p.itens.length > 1 ? 's' : ''})`,
    value: valorTotal,
  }
  if (p.metodoPagamento === 'CREDIT_CARD' && p.parcelas && p.parcelas > 1) {
    delete dadosCobranca.value
    dadosCobranca.installmentCount = p.parcelas
    dadosCobranca.installmentValue = Number((valorTotal / p.parcelas).toFixed(2))
  }
  const cobranca = await criarCobrancaGenerica(dadosCobranca)
  const pedidoId = crypto.randomUUID()
  await supabaseAdmin.from('Pedido').insert({
    id: pedidoId,
    escolaId: ESCOLA_ID,
    compradorNome: p.compradorNome,
    compradorTelefone: telefone,
    compradorEndereco: p.compradorEndereco,
    itens: p.itens,
    valor: valorTotal,
    status: 'AGUARDANDO',
    tipoEntrega: p.tipoEntrega,
    asaasId: cobranca.id,
    metodoPagamento: p.metodoPagamento,
  })
  for (const item of p.itens) {
    const { data: v } = await supabaseAdmin
      .from('ProdutoVariacao').select('estoque').eq('id', item.variacaoId).single()
    if (v) await supabaseAdmin
      .from('ProdutoVariacao')
      .update({ estoque: Math.max(0, v.estoque - item.qtd) })
      .eq('id', item.variacaoId)
  }
  let pixData = null
  if (p.metodoPagamento === 'PIX' && cobranca.id) {
    try {
      const qr = await getPixQrCode(cobranca.id)
      pixData = { copiaCola: qr.payload, qrCodeImage: qr.encodedImage }
    } catch (e) { console.error('Erro QR:', e) }
  }
  return { pedidoId, valor: valorTotal, pixData, creditCardUrl: cobranca.invoiceUrl || null }
}
