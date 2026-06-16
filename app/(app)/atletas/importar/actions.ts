'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEscolaIdServer } from '@/lib/getEscolaIdServer'

export type AtletaImport = {
  nome: string
  dataNascimento?: string
  posicao?: string
  cpf?: string
  rg?: string
  telefone?: string
  cep?: string
  endereco?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  nomeResponsavel?: string
  whatsappResponsavel?: string
  emailResponsavel?: string
}

export async function importarAtletas(atletas: AtletaImport[]) {
  const escolaId = await getEscolaIdServer()
  const resultados: { nome: string; ok: boolean; erro?: string }[] = []

  for (const a of atletas) {
    if (!a.nome?.trim()) {
      resultados.push({ nome: '(sem nome)', ok: false, erro: 'Nome obrigatório' })
      continue
    }
    try {
      const atletaId = crypto.randomUUID()
      // Convert DD/MM/YYYY to YYYY-MM-DD
      let dataNasc: string | null = null
      if (a.dataNascimento) {
        const d = a.dataNascimento.trim()
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
          const [dia, mes, ano] = d.split('/')
          dataNasc = `${ano}-${mes}-${dia}`
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          dataNasc = d
        }
      }

      const { error } = await supabaseAdmin.from('Atleta').insert({
        id: atletaId,
        escolaId,
        nome: a.nome.trim(),
        tokenPais: crypto.randomUUID(),
        dataNascimento: dataNasc,
        posicao: a.posicao || null,
        cpf: a.cpf?.replace(/\D/g,'') || null,
        rg: a.rg || null,
        telefone: a.telefone || null,
        cep: a.cep || null,
        endereco: a.endereco || null,
        numero: a.numero || null,
        bairro: a.bairro || null,
        cidade: a.cidade || null,
        estado: a.estado || null,
        ativo: true,
      })
      if (error) { resultados.push({ nome: a.nome, ok: false, erro: error.message }); continue }

      if (a.nomeResponsavel || a.whatsappResponsavel) {
        await supabaseAdmin.from('Responsavel').insert({
          id: crypto.randomUUID(),
          atletaId,
          escolaId,
          nome: a.nomeResponsavel || a.nome,
          whatsapp: a.whatsappResponsavel || null,
          email: a.emailResponsavel || null,
          principal: true,
        })
      }

      resultados.push({ nome: a.nome, ok: true })
    } catch (e) {
      resultados.push({ nome: a.nome, ok: false, erro: String(e) })
    }
  }

  return resultados
}
