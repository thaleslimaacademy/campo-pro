import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { msgLembreteD3, msgVencimentoHoje } from '@/lib/whatsapp-templates'
import { dataVencimentoNoMes } from '@/lib/dataVencimento'

/**
 * Antecedencia maxima para avisar o responsavel no ato da geracao.
 * Fora dessa janela a cobranca e criada em silencio e quem avisa e a regua
 * diaria (8h BRT), que dispara no D-3 — mesmo criterio, um dono so.
 *
 * 20/08/2026 — sem esse teto, gerar a mensalidade do mes seguinte logo apos
 * o cadastro manual disparava o template de lembrete D-3 no mesmo dia,
 * dizendo "faltam 32 dias". Cadastro manual quase sempre e aluno que ja
 * pagou o primeiro mes em dinheiro, entao a familia recebia cobranca de
 * uma mensalidade que nem comecou.
 */
const DIAS_ANTECEDENCIA_ENVIO = 3

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { atletaId, escolaId, valor, diaVencimento, periodo, forcar } = await req.json()

  // Atleta.whatsappResponsavel e Atleta.nomeResponsavel NAO existem no schema.
  // O select antigo pedia essas colunas, dava erro, atleta virava null — e por
  // isso o WhatsApp nunca era enviado e a cobranca nascia sem atletaNome.
  // O responsavel mora na tabela Responsavel.
  const [atletaRes, escolaRes, respRes] = await Promise.all([
    supabaseAdmin.from('Atleta').select('nome').eq('id', atletaId).single(),
    supabaseAdmin.from('Escola').select('nome').eq('id', escolaId).single(),
    supabaseAdmin.from('Responsavel').select('nome, whatsapp, telefone').eq('atletaId', atletaId).eq('principal', true).limit(1),
  ])
  const atleta     = atletaRes.data
  const resp       = respRes.data?.[0] || null
  const respWhats  = resp?.whatsapp || resp?.telefone || null

  const qtd     = periodo === 'semestral' ? 6 : periodo === 'anual' ? 12 : 1
  const grupoId = qtd > 1 ? crypto.randomUUID() : null
  const agora   = new Date()

  // ── TRAVA DE DUPLICATA: pula meses que ja tem mensalidade ativa ──
  const { data: jaAtivas } = await supabaseAdmin.from('Cobranca')
    .select('competencia, descricao')
    .eq('atletaId', atletaId)
    .is('excluidaEm', null)
    .in('status', ['PENDENTE', 'VENCIDO', 'PAGO'])
  const jaTem = new Set(
    (jaAtivas || [])
      .filter(c => c.competencia && String(c.descricao || '').trim().toLowerCase().startsWith('mensalidade'))
      .map(c => String(c.competencia).slice(0, 10))
  )

  const insertions = []
  const pulados: string[] = []
  for (let i = 0; i < qtd; i++) {
    // dataVencimentoNoMes faz o clamp do dia (31 em mes de 30 dias vira 30).
    // Com `new Date(ano, mes, 31)` cru o mes rolava e o vencimento caia no
    // dia 1 do mes seguinte, fora da competencia.
    const venc = dataVencimentoNoMes(agora.getFullYear(), agora.getMonth() + i, Number(diaVencimento) || 10)
    const competencia = venc.slice(0, 7) + '-01'
    if (!forcar && jaTem.has(competencia)) { pulados.push(competencia.slice(0, 7)); continue }
    insertions.push({
      id: crypto.randomUUID(), escolaId, atletaId,
      atletaNome: atleta?.nome?.trim() || null,
      valor: Number(valor),
      vencimento: venc, competencia,
      status: 'PENDENTE',
      descricao: `Mensalidade${qtd > 1 ? ` (${i + 1}/${qtd})` : ''}`,
      periodo, qtdParcelas: qtd, parcelaAtual: i + 1,
      grupoCobrancaId: grupoId, tipo: 'MANUAL',
    })
  }

  if (!insertions.length) {
    return NextResponse.json({
      error: `Este atleta ja tem mensalidade ativa em ${pulados.join(', ')}. Nada foi gerado.`,
      jaExiste: true,
    }, { status: 409 })
  }

  const { error } = await supabaseAdmin.from('Cobranca').insert(insertions)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // WhatsApp: usa os templates (a Meta so aceita template em mensagem proativa).
  // Avisa sobre a PRIMEIRA parcela gerada — as demais entram na regua normal.
  let whatsappEnviado = false
  let motivoNaoEnvio: string | null = null

  if (!respWhats) {
    motivoNaoEnvio = 'responsavel sem WhatsApp cadastrado'
  } else {
    const primeira      = insertions[0]
    const dataFormatada = new Date(primeira.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
    const nomeResp      = resp?.nome?.split(' ')[0] || ''
    const nomeAtleta    = atleta?.nome?.trim() || 'seu atleta'
    const linkPagamento = `https://gestaofc.com.br/pagar/${primeira.id}`

    const hojeBR = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    hojeBR.setHours(0, 0, 0, 0)
    const alvo = new Date(primeira.vencimento + 'T12:00:00')
    alvo.setHours(0, 0, 0, 0)
    const dias = Math.round((alvo.getTime() - hojeBR.getTime()) / 86400000)

    if (dias > DIAS_ANTECEDENCIA_ENVIO) {
      // Longe demais: quem avisa e a regua, no D-3.
      motivoNaoEnvio = `vence em ${dias} dias — a regua avisa no D-3`
      console.log(`[cobranca-manual] ${nomeAtleta}: sem aviso agora, ${motivoNaoEnvio}`)
    } else {
      try {
        if (dias <= 0) {
          await msgVencimentoHoje({
            telefone: respWhats, nomeResp, nomeAtleta,
            valor: Number(valor), dataVenc: dataFormatada, linkPagamento, escolaId,
          })
        } else {
          await msgLembreteD3({
            telefone: respWhats, nomeResp, nomeAtleta,
            valor: Number(valor), dataVenc: dataFormatada, linkPagamento, dias, escolaId,
          })
        }
        whatsappEnviado = true
      } catch (e) {
        motivoNaoEnvio = 'falha no envio: ' + (e as Error).message
        console.error('❌ Cobranca criada mas WhatsApp falhou:', (e as Error).message)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    geradas: insertions.length,
    puladas: pulados,
    whatsappEnviado,
    ...(motivoNaoEnvio ? { motivoNaoEnvio } : {}),
  })
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { cobrancaId, valorPago, formaPagamento } = await req.json()
  const { error } = await supabaseAdmin.from('Cobranca').update({
    status: 'PAGO', pagoEm: new Date().toISOString(),
    valorPago: valorPago || null, baixaManual: true,
    baixaManualEm: new Date().toISOString(), baixaManualPor: userId,
    tipo: formaPagamento || 'MANUAL',
  }).eq('id', cobrancaId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
