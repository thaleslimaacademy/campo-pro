// lib/cobrancaFamilia.ts
//
// Regra: tudo ou nada. Uma família confirmada gera 1 PIX com o valor
// somado dos filhos. Ou paga tudo, ou fica tudo pendente — sem rateio
// parcial. Quando o webhook confirma o pagamento da cobrança agregada,
// TODAS as cobranças-filhas (fichas individuais) recebem baixa junto.
//
// Idempotência: Cobranca.familiaId (uuid, null em toda cobrança normal)
// é setado SÓ na linha agregada, uma por família+competência, com um
// índice único parcial no banco (Cobranca_familiaId_competencia_key) —
// duas chamadas concorrentes não conseguem criar duas agregadas pra o
// mesmo mês da mesma família.

import { supabaseAdmin } from '@/lib/supabase'
import { gerarPixSeFaltar } from '@/lib/gerarPixSeFaltar'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { criarClienteAsaas, criarCobrancaPix, getPixQrCode } from '@/lib/asaas'

type Filho = { id: string; nome: string }
type Mensalidade = { id: string; atletaId: string; valor: number }

/**
 * Decide se gera PIX individual (comportamento atual) ou se agrega numa
 * cobrança de família. Chamada no lugar de gerarPixSeFaltar direto nos
 * pontos de geração de PIX (régua D-3/D0/D+1, edição de atleta, e a tela
 * de pagamento avulso do pai).
 */
export async function gerarPixOuAgregarFamilia(
  cobrancaId: string,
  escolaId: string,
  atletaId: string,
  valor: number,
  vencimento: string,
  competencia: string
): Promise<boolean> {
  try {
    const { data: atleta } = await supabaseAdmin
      .from('Atleta')
      .select('id, familiaId')
      .eq('id', atletaId)
      .single()

    if (!atleta?.familiaId) {
      return gerarPixSeFaltar(cobrancaId, escolaId, atletaId, valor, vencimento)
    }

    const { data: familia } = await supabaseAdmin
      .from('Familia')
      .select('id, status')
      .eq('id', atleta.familiaId)
      .single()

    if (!familia || familia.status !== 'CONFIRMADA') {
      // família ainda pendente/rejeitada — trata cada um individualmente
      // até ser confirmada
      return gerarPixSeFaltar(cobrancaId, escolaId, atletaId, valor, vencimento)
    }

    return gerarCobrancaAgregadaFamilia(familia.id, escolaId, competencia, vencimento)
  } catch (err) {
    console.error('Erro ao decidir PIX individual/família, caindo pro individual:', (err as Error).message)
    return gerarPixSeFaltar(cobrancaId, escolaId, atletaId, valor, vencimento)
  }
}

/**
 * Gera (ou reaproveita) a cobrança agregada de uma família pra uma
 * competência. Idempotente de verdade: se já existe uma agregada pra
 * essa família+competência (Cobranca.familiaId), reusa; se duas chamadas
 * colidirem na criação, o índice único do banco garante que só uma vinga
 * e a outra lê a que ganhou a corrida.
 */
export async function gerarCobrancaAgregadaFamilia(
  familiaId: string,
  escolaId: string,
  competencia: string,
  vencimento: string
): Promise<boolean> {
  try {
    const { data: existente } = await supabaseAdmin
      .from('Cobranca')
      .select('id, asaasId')
      .eq('familiaId', familiaId)
      .eq('competencia', competencia)
      .maybeSingle()

    if (existente?.asaasId) return true // agregada já tem PIX — nada a fazer

    const { data: filhosData } = await supabaseAdmin
      .from('Atleta')
      .select('id, nome')
      .eq('familiaId', familiaId)
      .eq('ativo', true)
      .order('nome')
    const filhos = (filhosData ?? []) as Filho[]
    if (filhos.length < 2) return false // família não faz mais sentido (só sobrou 1 filho ativo)

    const { data: mensalidadesData } = await supabaseAdmin
      .from('Cobranca')
      .select('id, atletaId, valor')
      .eq('competencia', competencia)
      .in(
        'atletaId',
        filhos.map((f: Filho) => f.id)
      )
      .in('status', ['PENDENTE', 'VENCIDO'])
      .is('excluidaEm', null)
    const mensalidades = (mensalidadesData ?? []) as Mensalidade[]

    if (mensalidades.length !== filhos.length) {
      console.error(`Família ${familiaId}: nem todo filho tem mensalidade pré-gerada pra ${competencia} ainda — tenta de novo na próxima régua`)
      return false
    }

    const valorTotal = mensalidades.reduce((soma: number, m: Mensalidade) => soma + Number(m.valor), 0)
    const nomes = filhos.map((f: Filho) => f.nome).join(' + ')

    const { data: familia } = await supabaseAdmin
      .from('Familia')
      .select('nomeResponsavel, cpfResponsavel, whatsappResponsavel, asaasCustomerId')
      .eq('id', familiaId)
      .single()
    if (!familia) return false

    const apiKey = await getAsaasKey(escolaId)
    if (!apiKey) return false

    let agregadaId = existente?.id ?? null

    if (!agregadaId) {
      agregadaId = crypto.randomUUID()
      const { error } = await supabaseAdmin.from('Cobranca').insert({
        id: agregadaId,
        escolaId,
        atletaId: filhos[0].id, // referência técnica; atletaNome já deixa claro que é agregada
        atletaNome: nomes,
        valor: valorTotal,
        competencia,
        vencimento,
        status: 'PENDENTE',
        tipo: 'FAMILIA',
        familiaId,
      })

      if (error) {
        if (error.code === '23505') {
          // corrida: outra chamada criou a agregada nesse meio-tempo — le a que ganhou
          const { data: jaExiste } = await supabaseAdmin
            .from('Cobranca')
            .select('id, asaasId')
            .eq('familiaId', familiaId)
            .eq('competencia', competencia)
            .maybeSingle()
          if (jaExiste?.asaasId) return true
          agregadaId = jaExiste?.id ?? null
          if (!agregadaId) return false
        } else {
          console.error('Erro ao criar cobrança agregada da família:', error.message)
          return false
        }
      } else {
        // pendura os filhos na agregada — eles NÃO recebem PIX próprio
        // (a própria agregada não deve apontar pra si mesma, dai o neq)
        await supabaseAdmin
          .from('Cobranca')
          .update({ familiaCobrancaId: agregadaId })
          .eq('competencia', competencia)
          .in(
            'atletaId',
            filhos.map((f: Filho) => f.id)
          )
          .neq('id', agregadaId)
      }
    }

    let asaasCustomerId = familia.asaasCustomerId
    if (!asaasCustomerId) {
      const dados: Record<string, string> = { name: familia.nomeResponsavel || nomes }
      const cpf = (familia.cpfResponsavel || '').replace(/\D/g, '')
      if (cpf.length >= 11) dados.cpfCnpj = cpf
      if (familia.whatsappResponsavel) dados.phone = familia.whatsappResponsavel.replace(/\D/g, '')
      const cliente = await criarClienteAsaas(apiKey, dados as never)
      if (cliente.errors || !cliente.id) return false
      asaasCustomerId = cliente.id
      await supabaseAdmin.from('Familia').update({ asaasCustomerId }).eq('id', familiaId)
    }

    const { data: cfg } = await supabaseAdmin
      .from('Escola')
      .select('multaAtraso, jurosAoMes')
      .eq('id', escolaId)
      .single()
    const multa = Number(cfg?.multaAtraso || 0)
    const juros = Number(cfg?.jurosAoMes || 0)

    const nova = await criarCobrancaPix(apiKey, {
      customer: asaasCustomerId,
      billingType: 'PIX',
      value: valorTotal,
      dueDate: vencimento,
      description: `Mensalidade (${nomes})`,
      ...(multa > 0 ? { fine: { value: multa } } : {}),
      ...(juros > 0 ? { interest: { value: juros } } : {}),
    })
    if (nova.errors || !nova.id) return false

    const qr = await getPixQrCode(apiKey, nova.id)
    const { error: errPix } = await supabaseAdmin
      .from('Cobranca')
      .update({
        asaasId: nova.id,
        pixCopiaCola: qr.payload || null,
        pixQrCode: qr.encodedImage || null,
      })
      .eq('id', agregadaId)
    if (errPix) {
      console.error('PIX da família criado na Asaas mas não salvo:', errPix.message)
      return false
    }
    return true
  } catch (err) {
    console.error('Erro ao gerar cobrança agregada da família:', (err as Error).message)
    return false
  }
}

/**
 * Chamada pelo webhook quando a cobrança agregada da família é paga.
 * Propaga a baixa pra todas as fichas individuais dos filhos.
 */
export async function baixarCobrancaFamilia(cobrancaAgregadaId: string): Promise<void> {
  const { data: agregada } = await supabaseAdmin
    .from('Cobranca')
    .select('pagoEm')
    .eq('id', cobrancaAgregadaId)
    .single()

  if (!agregada) return

  const pagoEm = agregada.pagoEm || new Date().toISOString()

  const { data: filhosData } = await supabaseAdmin
    .from('Cobranca')
    .select('id, valor')
    .eq('familiaCobrancaId', cobrancaAgregadaId)
  const filhos = (filhosData ?? []) as { id: string; valor: number }[]

  for (const filho of filhos) {
    await supabaseAdmin
      .from('Cobranca')
      .update({
        status: 'PAGO',
        pagoEm,
        valorPago: filho.valor, // cada filho registra o próprio valor, não o total
      })
      .eq('id', filho.id)
  }
}

type CamposPix = {
  valor: number
  pixCopiaCola: string | null
  pixQrCode: string | null
  descricao: string | null
  asaasId: string | null
  status: string
}

/**
 * Uma ficha individual de um filho de família NUNCA tem PIX próprio — foi
 * agregada. Usada pelas telas públicas de pagamento (/pagar, /pagar-atleta)
 * pra trocar os campos de pagamento da linha individual pelos da agregada,
 * senão a tela fica pra sempre sem QR Code/copia-e-cola pra esse atleta.
 */
export async function buscarPixAgregado(familiaCobrancaId: string): Promise<CamposPix | null> {
  const { data } = await supabaseAdmin
    .from('Cobranca')
    .select('valor, pixCopiaCola, pixQrCode, descricao, asaasId, status')
    .eq('id', familiaCobrancaId)
    .maybeSingle()
  return (data as CamposPix) ?? null
}
