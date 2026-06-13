'use server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'
import { enviarWhatsApp } from '@/lib/whatsapp'

export async function listarComissao() {
  const escolaId = await getEscolaIdServer()
  const { data } = await supabaseAdmin
    .from('Professor')
    .select('id, nome, email, telefone, whatsapp, cargo, perfil, ativo, contaCriada, tokenConvite')
    .eq('escolaId', escolaId)
    .order('nome')
  return data ?? []
}

export async function convidarMembro(p: {
  nome: string
  email: string
  telefone?: string
  whatsapp?: string
  cargo: string
  perfil: string
}) {
  const escolaId = await getEscolaIdServer()
  const tokenConvite = crypto.randomUUID()

  const { data, error } = await supabaseAdmin.from('Professor').insert({
    id: crypto.randomUUID(),
    escolaId,
    nome: p.nome,
    email: p.email,
    telefone: p.telefone || null,
    whatsapp: p.whatsapp || null,
    cargo: p.cargo,
    perfil: p.perfil,
    tokenConvite,
    ativo: true,
    contaCriada: false,
  }).select('id').single()

  if (error) throw new Error(error.message)

  const linkConvite = 'https://gestaofc.com.br/convite/' + tokenConvite

  if (p.whatsapp) {
    const msg = [
      '⚽ *Convite GestaoFC*',
      '',
      'Olá, *' + p.nome.split(' ')[0] + '*!',
      '',
      'Você foi convidado para a comissão técnica como *' + p.cargo + '*.',
      '',
      'Clique no link para ativar sua conta:',
      linkConvite,
    ].join('\n')
    await enviarWhatsApp(p.whatsapp, msg).catch(() => {})
  }

  return { ok: true, tokenConvite, linkConvite }
}

export async function toggleMembroAtivo(id: string, ativo: boolean) {
  const escolaId = await getEscolaIdServer()
  await supabaseAdmin.from('Professor').update({ ativo }).eq('id', id).eq('escolaId', escolaId)
  await supabaseAdmin.from('PerfilUsuario').update({ ativo }).eq('professorId', id)
  return { ok: true }
}

export async function excluirMembro(id: string) {
  const escolaId = await getEscolaIdServer()
  await supabaseAdmin.from('PerfilUsuario').delete().eq('professorId', id)
  await supabaseAdmin.from('Professor').delete().eq('id', id).eq('escolaId', escolaId)
  return { ok: true }
}
