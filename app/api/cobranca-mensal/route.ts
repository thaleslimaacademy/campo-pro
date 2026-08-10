import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { criarCobrancaPix, getPixQrCode } from '@/lib/asaas'
import { getAsaasKey } from '@/lib/getAsaasKey'
import { garantirClienteAsaas } from '@/lib/asaasCliente'
import { msgVencimentoHoje } from '@/lib/whatsapp-templates'

// 06/08/2026 — este arquivo criava o cliente Asaas com
//   cpfCnpj: atleta.cpf || '00000000191'
// ou seja, quem nao tinha CPF proprio na ficha entrava no Asaas com um CPF
// de teste. A cobranca era gerada, mas amarrada a um CPF que nao existe —
// problema de conciliacao e fiscal, nao so tecnico. Agora usa
// garantirClienteAsaas, que puxa o CPF do responsavel principal (o unico
// obrigatorio na ficha). Sem CPF em lugar nenhum, a mensalidade ainda e
// criada, porem como cobranca MANUAL, e o atleta entra no contador
// totalSemCpf da resposta pra voce saber quem precisa completar o cadastro.
//
// 09/08/2026 — tres mudancas:
//   1. WhatsApp passa por msgVencimentoHoje (template Meta 'cobranca_vencimento')
//      em vez de enviarWhatsApp direto, que ia 100% Evolution.
//   2. O valor padrao era a constante 85 no codigo. Virou uma cadeia:
//      valor do atleta > plano > valor da escola > 85. A Alexandrita mudou
//      pra 80 e todo atleta sem plano estava sendo cobrado a mais.
//   3. .single() virou .maybeSingle() na busca de cobranca existente:
//      .single() trata zero linhas como erro, e o atleta podia receber
//      cobranca duplicada.

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-cron-secret')
    if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const agora = new Date()
    const hoje = agora.getDate() // dia do mês atual (1-31)
    const anoMes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`

    const { data: escolas } = await supabaseAdmin.from('Escola')
      .select('id, nome, valorMensalidade').eq('ativo', true)

    let totalGeradas = 0, totalErros = 0, totalPuladas = 0, totalBolsistas = 0
    let totalSemCpf = 0
    const semCpf: string[] = []

    for (const escola of escolas || []) {
      const apiKey = await getAsaasKey(escola.id)
      const valorEscola = Number(escola.valorMensalidade) || 0

      // Busca planos da escola
      const { data: planosEscola } = await supabaseAdmin.from('PlanoMensalidade')
        .select('slug, valor').eq('escolaId', escola.id)
      const PLANOS: Record<string, number> = {}
      for (const p of planosEscola || []) PLANOS[p.slug] = Number(p.valor)

      // Busca SOMENTE atletas cujo diaVencimento é HOJE
      const { data: atletas } = await supabaseAdmin.from('Atleta')
        .select('id, nome, planoMensalidade, valorMensalidade, diaVencimento, bolsista')
        .eq('escolaId', escola.id)
        .eq('ativo', true)
        .eq('diaVencimento', hoje) // ← filtro chave

      for (const atleta of atletas || []) {
        if (atleta.bolsista) { totalBolsistas++; continue }

        // Verifica se já tem cobrança neste mês/ano.
        // maybeSingle: zero linhas e um resultado valido aqui, nao erro.
        const { data: cobExistente } = await supabaseAdmin.from('Cobranca')
          .select('id, asaasId, status, valor').eq('atletaId', atleta.id)
          .like('vencimento', `${anoMes}%`).limit(1).maybeSingle()

        if (cobExistente) {
          // Se já tem cobrança pré-gerada sem Asaas e está PENDENTE → gera PIX e envia WhatsApp
          if (cobExistente.status === 'PENDENTE' && !cobExistente.asaasId && apiKey) {
            try {
              const cli = await garantirClienteAsaas(apiKey, atleta.id)
              if (!cli.ok) {
                console.error('[cobranca-mensal] sem cliente Asaas para', atleta.nome, '—', cli.erro)
                totalSemCpf++; semCpf.push(atleta.nome)
              } else {
                const venc = `${anoMes}-${String(hoje).padStart(2,'0')}`
                const cobAsaas = await criarCobrancaPix(apiKey, { customer: cli.customerId, billingType:'PIX', value: cobExistente.valor, dueDate: venc, description:'Mensalidade' })
                if (!cobAsaas.errors) {
                  const qr = await getPixQrCode(apiKey, cobAsaas.id)
                  await supabaseAdmin.from('Cobranca').update({ asaasId: cobAsaas.id, pixCopiaCola: qr.payload||null, pixQrCode: qr.encodedImage||null }).eq('id', cobExistente.id)
                  // Envia WhatsApp
                  const { data: resps } = await supabaseAdmin.from('Responsavel').select('nome, whatsapp').eq('atletaId', atleta.id).eq('principal', true).limit(1)
                  const resp = resps?.[0]
                  if (resp?.whatsapp) {
                    await msgVencimentoHoje({
                      telefone: resp.whatsapp,
                      nomeResp: resp.nome?.split(' ')[0] || 'Responsável',
                      nomeAtleta: atleta.nome,
                      valor: Number(cobExistente.valor),
                      dataVenc: new Date(venc + 'T12:00:00').toLocaleDateString('pt-BR'),
                      linkPagamento: `https://gestaofc.com.br/pagar/${cobExistente.id}`,
                      escolaId: escola.id,
                    })
                  }
                }
              }
            } catch(err) { console.error('Erro PIX pre-gerada:', err) }
          }
          totalPuladas++; continue
        }

        const vencimento = `${anoMes}-${String(hoje).padStart(2, '0')}`
        // Valor: o do proprio atleta manda; depois o plano; depois o padrao
        // da escola. O 85 fixo so sobra se nada estiver configurado.
        const valor = Number(atleta.valorMensalidade)
          || PLANOS[atleta.planoMensalidade || '']
          || valorEscola
          || 85

        try {
          let asaasCustomerId: string | null = null
          if (apiKey) {
            const cli = await garantirClienteAsaas(apiKey, atleta.id)
            if (cli.ok) {
              asaasCustomerId = cli.customerId
            } else {
              // Sem CPF do atleta nem do responsavel: nao inventa CPF.
              // A mensalidade e criada como MANUAL e o atleta e reportado.
              console.error('[cobranca-mensal] sem cliente Asaas para', atleta.nome, '—', cli.erro)
              totalSemCpf++; semCpf.push(atleta.nome)
            }
          }

          const novoId = crypto.randomUUID()

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
            await msgVencimentoHoje({
              telefone: resp.whatsapp,
              nomeResp: resp.nome?.split(' ')[0] || 'Responsável',
              nomeAtleta: atleta.nome,
              valor,
              dataVenc: new Date(vencimento + 'T12:00:00').toLocaleDateString('pt-BR'),
              linkPagamento: `https://gestaofc.com.br/pagar/${novoId}`,
              escolaId: escola.id,
            })
          }

          totalGeradas++
          await new Promise(r => setTimeout(r, 300))
        } catch (err) {
          console.error('Erro atleta', atleta.id, err)
          totalErros++
        }
      }
    }

    return NextResponse.json({
      ok: true, totalGeradas, totalPuladas, totalErros, totalBolsistas,
      totalSemCpf, semCpf, diaHoje: hoje,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
