import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { criarClienteAsaas, criarCobrancaPix, getPixQrCode } from '@/lib/asaas'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-cron-secret')
    if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const agora = new Date()
    const hoje = agora.getDate() // dia do mês atual (1-31)
    const anoMes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`

    const { data: escolas } = await supabaseAdmin.from('Escola')
      .select('id, nome, evolutionInstance').eq('ativo', true)

    let totalGeradas = 0, totalErros = 0, totalPuladas = 0, totalBolsistas = 0

    for (const escola of escolas || []) {
      const apiKey = await getAsaasKey(escola.id)

      // Busca planos da escola
      const { data: planosEscola } = await supabaseAdmin.from('PlanoMensalidade')
        .select('slug, valor').eq('escolaId', escola.id)
      const PLANOS: Record<string, number> = {}
      for (const p of planosEscola || []) PLANOS[p.slug] = Number(p.valor)

      // Busca SOMENTE atletas cujo diaVencimento é HOJE
      const { data: atletas } = await supabaseAdmin.from('Atleta')
        .select('id, nome, cpf, telefone, asaasCustomerId, planoMensalidade, diaVencimento, bolsista')
        .eq('escolaId', escola.id)
        .eq('ativo', true)
        .eq('diaVencimento', hoje) // ← filtro chave

      for (const atleta of atletas || []) {
        if (atleta.bolsista) { totalBolsistas++; continue }

        // Verifica se já tem cobrança neste mês/ano
        const { count } = await supabaseAdmin.from('Cobranca')
          .select('*', { count: 'exact', head: true })
          .eq('atletaId', atleta.id)
          .like('vencimento', `${anoMes}%`)
        if (count && count > 0) { totalPuladas++; continue }

        const vencimento = `${anoMes}-${String(hoje).padStart(2, '0')}`
        // P2: valor CHEIO do plano (sem proporcional)
        const valor = PLANOS[atleta.planoMensalidade || ''] || 85

        try {
          let asaasCustomerId = atleta.asaasCustomerId
          if (!asaasCustomerId && apiKey) {
            const cliente = await criarClienteAsaas(apiKey, {
              name: atleta.nome,
              cpfCnpj: atleta.cpf?.replace(/\D/g, '') || '00000000191',
              phone: atleta.telefone || '',
              address: '', addressNumber: '', province: '', postalCode: '',
            })
            if (!cliente.errors) {
              asaasCustomerId = cliente.id
              await supabaseAdmin.from('Atleta').update({ asaasCustomerId }).eq('id', atleta.id)
            }
          }

          let novoId = crypto.randomUUID()

          if (asaasCustomerId && apiKey) {
            // Com Asaas: gera PIX
            const cobranca = await criarCobrancaPix(apiKey, {
              customer: asaasCustomerId, billingType: 'PIX',
              value: valor, dueDate: vencimento, description: 'Mensalidade',
            })
            if (cobranca.errors) { totalErros++; continue }
            const qrCode = await getPixQrCode(apiKey, cobranca.id)
            await supabaseAdmin.from('Cobranca').insert({
              id: novoId, escolaId: escola.id, atletaId: atleta.id,
              atletaNome: atleta.nome?.trim() || atleta.nome, valor, vencimento,
              status: 'PENDENTE', asaasId: cobranca.id,
              pixCopiaCola: qrCode.payload || null,
              pixQrCode: qrCode.encodedImage || null,
              descricao: 'Mensalidade',
            })
          } else {
            // Sem Asaas: cobrança manual
            await supabaseAdmin.from('Cobranca').insert({
              id: novoId, escolaId: escola.id, atletaId: atleta.id,
              atletaNome: atleta.nome?.trim() || atleta.nome, valor, vencimento,
              status: 'PENDENTE', tipo: 'MANUAL', descricao: 'Mensalidade',
            })
          }

          // Envia WhatsApp
          const { data: resps } = await supabaseAdmin.from('Responsavel')
            .select('nome, whatsapp').eq('atletaId', atleta.id).eq('principal', true).limit(1)
          const resp = resps?.[0]
          if (resp?.whatsapp) {
            const nomeResp = resp.nome.split(' ')[0]
            const dataFmt = new Date(vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
            const linkPagamento = `https://gestaofc.com.br/pagar/${novoId}`
            const mensagem = `Ola ${nomeResp}! 👋\n\nA mensalidade de *${atleta.nome}* foi gerada.\n\n💰 Valor: *R$ ${valor.toFixed(2)}*\n📅 Vencimento: *${dataFmt}*\n\nPague agora:\n${linkPagamento}\n\n_${escola.nome.split('—').pop()?.trim() || escola.nome}_`
            await enviarWhatsApp(resp.whatsapp, mensagem, escola.id)
          }

          totalGeradas++
          await new Promise(r => setTimeout(r, 300))
        } catch (err) {
          console.error('Erro atleta', atleta.id, err)
          totalErros++
        }
      }
    }

    return NextResponse.json({ ok: true, totalGeradas, totalPuladas, totalErros, totalBolsistas, diaHoje: hoje })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
