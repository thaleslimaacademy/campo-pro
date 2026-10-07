import { supabaseAdmin } from '@/lib/supabase'
import { enviarPush } from '@/lib/push'
import { msgConvocacao } from '@/lib/whatsapp-templates'

/**
 * Convocacao: aviso GRATIS por notificacao no celular (push) para quem ativou
 * os avisos. WhatsApp (modelo Marketing, ~R$ 0,32 cada) so quando o admin
 * pedir, e so para quem NAO tem avisos ativos.
 * O clique abre a Area dos Pais, onde o responsavel confirma a presenca.
 * Chamar so do servidor.
 */

type Conv = { id: string; escolaId: string; titulo: string; data: string | null; horario: string | null; local: string | null }

async function carregar(convocacaoId: string, escolaId: string) {
  const { data: conv } = await supabaseAdmin.from('Convocacao')
    .select('id, escolaId, titulo, data, horario, local')
    .eq('id', convocacaoId).eq('escolaId', escolaId).maybeSingle()
  if (!conv) return null
  const { data: cas } = await supabaseAdmin.from('ConvocacaoAtleta')
    .select('atletaId, status').eq('convocacaoId', convocacaoId)
  const atletaIds = [...new Set(((cas ?? []) as { atletaId: string }[]).map(c => c.atletaId))]
  return { conv: conv as Conv, atletaIds, cas: (cas ?? []) as { atletaId: string; status: string | null }[] }
}

export function dataBR(d: string | null) {
  if (!d) return 'a confirmar'
  const [a, m, dia] = String(d).slice(0, 10).split('-')
  return `${dia}/${m}/${a}`
}
export const horaBR = (h: string | null) => (h ? String(h).slice(0, 5) : 'a confirmar')

/** Atletas da lista que tem pelo menos 1 celular com avisos ativos. */
async function atletasComAviso(escolaId: string, atletaIds: string[]) {
  if (!atletaIds.length) return new Set<string>()
  const { data } = await supabaseAdmin.from('PushSubscription').select('atletaid')
    .eq('escolaid', escolaId).in('atletaid', atletaIds)
  return new Set(((data ?? []) as { atletaid: string }[]).map(r => r.atletaid))
}

export type ResumoConvocacao = {
  total: number; comAviso: number; semAviso: number
  confirmados: number; recusados: number; pendentes: number
}

export async function resumoConvocacao(convocacaoId: string, escolaId: string): Promise<ResumoConvocacao | null> {
  const c = await carregar(convocacaoId, escolaId)
  if (!c) return null
  const com = await atletasComAviso(escolaId, c.atletaIds)
  const st = (s: string | null) => (s || 'pendente').toLowerCase()
  return {
    total: c.atletaIds.length,
    comAviso: com.size,
    semAviso: c.atletaIds.length - com.size,
    confirmados: c.cas.filter(x => st(x.status) === 'confirmado').length,
    recusados: c.cas.filter(x => st(x.status) === 'recusado').length,
    pendentes: c.cas.filter(x => !['confirmado', 'recusado'].includes(st(x.status))).length,
  }
}

/** Notificacao no celular (gratis). Cada celular abre a Area dos Pais do proprio atleta. */
export async function avisarConvocacaoPush(convocacaoId: string, escolaId: string) {
  const c = await carregar(convocacaoId, escolaId)
  if (!c) return { ok: false as const, erro: 'Convocação não encontrada' }
  const { conv, atletaIds } = c
  const r = await enviarPush({
    escolaId, atletaIds,
    title: `⚽ Convocação: ${conv.titulo}`,
    body: `${dataBR(conv.data)} às ${horaBR(conv.horario)} · ${conv.local || 'local a confirmar'}. Toque para confirmar a presença.`,
  })
  return { ok: true as const, celulares: r.enviados, atletas: atletaIds.length }
}

/** WhatsApp (pago, Marketing) so para quem nao tem avisos no celular. */
export async function avisarConvocacaoWhatsApp(convocacaoId: string, escolaId: string) {
  const c = await carregar(convocacaoId, escolaId)
  if (!c) return { ok: false as const, erro: 'Convocação não encontrada' }
  const { conv, atletaIds } = c
  const com = await atletasComAviso(escolaId, atletaIds)
  const alvo = atletaIds.filter(id => !com.has(id))
  if (!alvo.length) return { ok: true as const, enviados: 0, falhas: 0, semNumero: 0 }

  const [{ data: atletas }, { data: resps }] = await Promise.all([
    supabaseAdmin.from('Atleta').select('id, nome, telefone, tokenPais').in('id', alvo),
    supabaseAdmin.from('Responsavel').select('atletaId, whatsapp, principal').in('atletaId', alvo),
  ])
  const numero = (id: string) => {
    const rs = ((resps ?? []) as { atletaId: string; whatsapp: string | null; principal: boolean | null }[])
      .filter(r => r.atletaId === id && r.whatsapp)
      .sort((a, b) => Number(!!b.principal) - Number(!!a.principal))
    return rs[0]?.whatsapp || ((atletas ?? []) as { id: string; telefone: string | null }[]).find(a => a.id === id)?.telefone || null
  }

  let enviados = 0, falhas = 0, semNumero = 0
  const jaEnviado = new Set<string>() // irmaos com o mesmo numero recebem 1 so
  for (const a of (atletas ?? []) as { id: string; nome: string; tokenPais: string | null }[]) {
    const tel = numero(a.id)
    if (!tel) { semNumero++; continue }
    const chave = tel.replace(/\D/g, '')
    if (jaEnviado.has(chave)) continue
    jaEnviado.add(chave)
    try {
      const r = await msgConvocacao({
        telefone: tel,
        nomeAtleta: a.nome,
        titulo: conv.titulo || 'Evento',
        data: dataBR(conv.data),
        horario: horaBR(conv.horario),
        local: conv.local || 'a confirmar',
        linkConfirmacao: a.tokenPais ? `https://gestaofc.com.br/pais/${a.tokenPais}` : 'https://gestaofc.com.br', // o modelo aprovado exige as 5 variaveis
        escolaId,
      }) as { ok?: boolean } | undefined
      if (r && typeof r === 'object' && r.ok === false) falhas++
      else enviados++
    } catch (e) {
      falhas++
      console.error('WhatsApp convocacao:', (e as Error).message)
    }
    await new Promise(res => setTimeout(res, 300))
  }
  return { ok: true as const, enviados, falhas, semNumero }
}
