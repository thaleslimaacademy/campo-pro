'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export async function listarAtletasParaPremio() {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin
    .from('Atleta').select('id, nome, fotoUrl, posicao, tokenPais')
    .eq('escolaId', escolaId).eq('ativo', true).order('nome')
  return data ?? []
}

export async function listarPremiacoes(atletaId: string) {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin
    .from('Premiacao').select('*')
    .eq('atletaId', atletaId).eq('escolaId', escolaId)
    .order('dataConquista', { ascending: false })
  return data ?? []
}

/**
 * Envia e-mail aos responsaveis que tem e-mail cadastrado avisando da
 * premiacao. So dispara se RESEND_API_KEY estiver configurada. Retorna
 * avisos (nao lanca erro) para nao quebrar a concessao do premio, mas
 * agora CHECA a resposta da Resend em vez de ignorar em silencio.
 */
async function enviarEmailPremiacao(atletaId: string, escolaId: string, titulo: string, icone: string, descricao: string): Promise<string[]> {
  const avisos: string[] = []
  if (!process.env.RESEND_API_KEY) {
    avisos.push('RESEND_API_KEY não configurada — e-mail não enviado')
    return avisos
  }
  try {
    const { data: atleta } = await supabaseAdmin.from('Atleta').select('nome, tokenPais').eq('id', atletaId).single()
    const { data: escola } = await supabaseAdmin.from('Escola').select('nome').eq('id', escolaId).single()
    const { data: responsaveis } = await supabaseAdmin.from('Responsavel')
      .select('email, nome').eq('atletaId', atletaId).not('email', 'is', null)

    if (!responsaveis?.length) {
      avisos.push('Nenhum responsável com e-mail cadastrado para este atleta')
      return avisos
    }
    const linkPais = atleta?.tokenPais ? `https://gestaofc.com.br/pais/${atleta.tokenPais}` : 'https://gestaofc.com.br'

    for (const resp of responsaveis) {
      if (!resp.email) continue
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'GestãoFC <onboarding@resend.dev>',
            to: resp.email,
            subject: `${icone} ${atleta?.nome || 'Seu atleta'} conquistou: ${titulo}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <div style="background:#4169E1; padding:24px; text-align:center; border-radius:12px 12px 0 0;">
                  <h1 style="color:#fff; margin:0; font-size:20px;">${icone} Nova conquista!</h1>
                </div>
                <div style="background:#f5f7fb; padding:24px; border-radius:0 0 12px 12px;">
                  <p style="font-size:15px; color:#111;">Olá, ${resp.nome?.split(' ')[0] || ''}!</p>
                  <p style="font-size:15px; color:#111;"><strong>${atleta?.nome || ''}</strong> acabou de receber uma nova premiação em ${escola?.nome || 'sua escola'}:</p>
                  <div style="background:#fff; border-left:4px solid #4169E1; padding:14px 16px; margin:16px 0; border-radius:6px;">
                    <p style="margin:0; font-weight:bold; font-size:16px; color:#4169E1;">${titulo}</p>
                    <p style="margin:6px 0 0; font-size:13px; color:#555;">${descricao || ''}</p>
                  </div>
                  <a href="${linkPais}" style="display:inline-block; background:#4169E1; color:#fff; text-decoration:none; padding:12px 20px; border-radius:8px; font-weight:bold; font-size:14px;">Ver perfil do atleta</a>
                </div>
              </div>
            `,
          }),
        })
        if (!res.ok) {
          const corpo = await res.text()
          avisos.push(`Resend recusou envio para ${resp.email} (${res.status}): ${corpo}`)
          console.error('Resend erro:', res.status, corpo)
        }
      } catch (e) {
        avisos.push(`Falha de rede ao enviar para ${resp.email}: ${(e as Error).message}`)
      }
    }
  } catch (e) {
    avisos.push(`Falha geral ao preparar e-mails: ${(e as Error).message}`)
  }
  return avisos
}

export async function concederPremio(atletaId: string, titulo: string, icone: string, descricao: string) {
  const escolaId = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Premiacao').insert({
    escolaId, atletaId, titulo, icone, descricao,
    dataConquista: new Date().toISOString().split('T')[0],
  })
  if (error) throw new Error(error.message)

  // Enviar push notification para os pais
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://gestaofc.com.br'}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        atletaId,
        title: `${icone} Nova conquista!`,
        body: `${titulo} — ${descricao}`,
        url: '/',
      }),
    })
  } catch {}

  // Enviar e-mail para os responsaveis com e-mail cadastrado
  const avisosEmail = await enviarEmailPremiacao(atletaId, escolaId, titulo, icone, descricao)

  return { ok: true, avisosEmail: avisosEmail.length ? avisosEmail : undefined }
}

export async function removerPremio(id: string) {
  const escolaId = await getEscolaIdServer()
  const { error } = await supabaseAdmin.from('Premiacao').delete()
    .eq('id', id).eq('escolaId', escolaId)
  if (error) throw new Error(error.message)
  return { ok: true }
}
