'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { criarClienteAsaas, criarCobrancaGenerica, getPixQrCode } from '@/lib/asaas'

const BUCKET_ORI = 'fotos-originais'

export async function listarAlbunsPublicos() {
  const ESCOLA_ID = await getEscolaIdServer()
  const { data } = await supabaseAdmin
    .from('Album')
    .select('id, titulo, descricao, dataEvento, capa')
    .eq('escolaId', ESCOLA_ID)
    .eq('ativo', true)
    .order('createdAt', { ascending: false })
  return data ?? []
}

export async function listarFotosPublicas(albumId: string) {
  const { data } = await supabaseAdmin
    .from('Foto')
    .select('id, urlWatermark, valor')
    .eq('albumId', albumId)
    .order('createdAt')
  return data ?? []
}

export async function criarCompraPublica(p: {
  compradorNome: string
  compradorTelefone: string
  fotos: string[]
  metodoPagamento: 'PIX' | 'CREDIT_CARD'
  parcelas?: number
}) {
  const ESCOLA_ID = await getEscolaIdServer()
  const { data: fotosData } = await supabaseAdmin
    .from('Foto').select('id, valor').in('id', p.fotos)
  const valorTotal = (fotosData || []).reduce((s, f) => s + Number(f.valor), 0)
  const telefone = p.compradorTelefone.replace(/\D/g, '')
  const cliente = await criarClienteAsaas({
    name: p.compradorNome,
    cpfCnpj: '00000000191',
    phone: telefone,
    address: '', addressNumber: '', province: '', postalCode: '',
  })
  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const desc = `Fotos GestaoFC (${p.fotos.length} foto${p.fotos.length > 1 ? 's' : ''})`
  const dadosCobranca: Parameters<typeof criarCobrancaGenerica>[0] = {
    customer: cliente.id,
    billingType: p.metodoPagamento,
    dueDate,
    description: desc,
    value: valorTotal,
  }
  if (p.metodoPagamento === 'CREDIT_CARD' && p.parcelas && p.parcelas > 1) {
    delete dadosCobranca.value
    dadosCobranca.installmentCount = p.parcelas
    dadosCobranca.installmentValue = Number((valorTotal / p.parcelas).toFixed(2))
  }
  const cobranca = await criarCobrancaGenerica(dadosCobranca)
  const compraId = crypto.randomUUID()
  await supabaseAdmin.from('FotoCompra').insert({
    id: compraId,
    escolaId: ESCOLA_ID,
    compradorNome: p.compradorNome,
    compradorTelefone: telefone,
    fotos: p.fotos,
    valor: valorTotal,
    status: 'PENDENTE',
    asaasId: cobranca.id,
    metodoPagamento: p.metodoPagamento,
  })
  let pixData = null
  if (p.metodoPagamento === 'PIX' && cobranca.id) {
    try {
      const qr = await getPixQrCode(cobranca.id)
      pixData = { copiaCola: qr.payload, qrCodeImage: qr.encodedImage }
    } catch (e) {
      console.error('Erro QR Code:', e)
    }
  }
  return {
    compraId,
    valor: valorTotal,
    pixData,
    creditCardUrl: cobranca.invoiceUrl || null,
  }
}

export async function gerarLinksOriginaisPublico(compraId: string) {
  const { data: compra } = await supabaseAdmin
    .from('FotoCompra').select('fotos, status').eq('id', compraId).single()
  if (!compra || compra.status !== 'PAGO') throw new Error('Compra não paga')
  const { data: fotos } = await supabaseAdmin
    .from('Foto').select('id, urlOriginal').in('id', compra.fotos)
  return Promise.all((fotos || []).map(async (f) => {
    const { data } = await supabaseAdmin.storage
      .from(BUCKET_ORI)
      .createSignedUrl(f.urlOriginal, 60 * 60 * 24 * 7)
    return { id: f.id, url: data?.signedUrl || '' }
  }))
}
