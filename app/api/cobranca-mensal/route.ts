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
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().split('T')[0]
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString().split('T')[0]
    const { data: escolas } = await supabaseAdmin.from('Escola').select('id, nome').eq('ativo', true)
    let totalGeradas = 0, totalErros = 0, totalPuladas = 0, totalBolsistas = 0
    for (const escola of escolas || []) {
      const apiKey = await getAsaasKey(escola.id)
      const { data: planosEscola } = await supabaseAdmin.from('PlanoMensalidade').select('slug, valor').eq('escolaId', escola.id)
      const PLANOS: Record<string, number> = {}
      for (const p of planosEscola || []) PLANOS[p.slug] = Number(p.valor)
      const { data: atletas } = await supabaseAdmin.from('Atleta')
        .select('id, nome, cpf, telefone, asaasCustomerId, planoMensalidade, diaVencimento, bolsista')
        .eq('escolaId', escola.id).eq('ativo', true)
      for (const atleta of atletas || []) {
        // Pula bolsistas — mensalidade 100% gratuita
        if (atleta.bolsista) { totalBolsistas++; continue }

        const { count } = await supabaseAdmin.from('Cobranca').select('*', { count: 'exact', head: true })
          .eq('atletaId', atleta.id).gte('vencimento', inicioMes).lte('vencimento', fimMes)
        if (count && count > 0) { totalPuladas++; continue }
        const dia = atleta.diaVencimento || 10
        const vencimento = new Date(agora.getFullYear(), agora.getMonth(), dia).toISOString().split('T')[0]
        const valor = PLANOS[atleta.planoMensalidade || 'STANDARD'] || 85
        try {
          let asaasCustomerId = atleta.asaasCustomerId
          if (!asaasCustomerId) {
            const cliente = await criarClienteAsaas(apiKey, {
              name: atleta.nome, cpfCnpj: atleta.cpf?.replace(/\D/g, '') || '00000000191',
              phone: atleta.telefone || '', address: '', addressNumber: '', province: '', postalCode: '',
            })
            if (!cliente.errors) { asaasCustomerId = cliente.id; await supabaseAdmin.from('Atleta').update({ asaasCustomerId }).eq('id', atleta.id) }
          }
          if (!asaasCustomerId) { totalErros++; continue }
          const cobranca = await criarCobrancaPix(apiKey, { customer: asaasCustomerId, billingType: 'PIX', value: valor, dueDate: vencimento, description: 'Mensalidade' })
          if (cobranca.errors) { totalErros++; continue }
          const qrCode = await getPixQrCode(apiKey, cobranca.id)
          const novoId = crypto.randomUUID()
          await supabaseAdmin.from('Cobranca').insert({
            id: novoId, escolaId: escola.id, atletaId: atleta.id, valor, vencimento,
            status: 'PENDENTE', asaasId: cobranca.id,
            pixCopiaCola: qrCode.payload || null, pixQrCode: qrCode.encodedImage || null, descricao: 'Mensalidade',
          })
          const { data: responsaveis } = await supabaseAdmin.from('Responsavel').select('nome, whatsapp').eq('atletaId', atleta.id).limit(1)
          const resp = responsaveis?.[0]
          if (resp?.whatsapp) {
            const nomeResp = resp.nome.split(' ')[0]
            const linkPagamento = 'https://gestaofc.com.br/pagar/' + novoId
            const mensagem = 'Ola ' + nomeResp + '!\n\nA mensalidade de *' + atleta.nome + '* foi gerada.\n\nValor: *R$ ' + valor.toFixed(2) + '*\nVencimento: *' + new Date(vencimento + 'T12:00:00').toLocaleDateString('pt-BR') + '*\n\nPague agora:\n' + linkPagamento + '\n\n_' + escola.nome + '_'
            await enviarWhatsApp(resp.whatsapp, mensagem)
          }
          totalGeradas++
          await new Promise(r => setTimeout(r, 300))
        } catch (err) { console.error('Erro atleta', atleta.id, err); totalErros++ }
      }
    }
    return NextResponse.json({ ok: true, totalGeradas, totalPuladas, totalErros, totalBolsistas })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
