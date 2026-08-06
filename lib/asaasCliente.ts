// lib/asaasCliente.ts
//
// Ponto unico de criacao/atualizacao do cliente Asaas de um atleta.
//
// Por que existe: o Asaas recusa qualquer cobranca de cliente sem cpfCnpj.
// O codigo antigo montava o cliente com Atleta.cpf — que e OPCIONAL na ficha.
// O unico CPF obrigatorio do cadastro e o do responsavel principal, entao e
// dele que sai o pagador. Alem disso, o cliente so era criado quando ainda
// nao existia: quem ja tinha entrado no Asaas incompleto ficava travado pra
// sempre. Aqui, se o cliente ja existe, ele e ATUALIZADO antes do uso — os
// cadastros quebrados se consertam sozinhos na proxima cobranca.

import { supabaseAdmin } from '@/lib/supabase'
import { criarClienteAsaas, atualizarClienteAsaas } from '@/lib/asaas'

const soDigitos = (v?: string | null) => (v ?? '').replace(/\D/g, '')

export type ResultadoClienteAsaas =
  | { ok: true; customerId: string }
  | { ok: false; erro: string }

export async function garantirClienteAsaas(
  apiKey: string,
  atletaId: string,
): Promise<ResultadoClienteAsaas> {
  if (!apiKey) return { ok: false, erro: 'Chave do Asaas nao configurada para esta escola.' }

  const { data: atleta } = await supabaseAdmin
    .from('Atleta')
    .select('id, nome, cpf, telefone, endereco, numero, bairro, cep, asaasCustomerId')
    .eq('id', atletaId)
    .single()

  if (!atleta) return { ok: false, erro: 'Atleta nao encontrado.' }

  const { data: resps } = await supabaseAdmin
    .from('Responsavel')
    .select('nome, cpf, whatsapp, telefone, email')
    .eq('atletaId', atletaId)
    .eq('principal', true)
    .limit(1)
  const resp = resps?.[0] || null

  // CPF do atleta quando existir; senao o do responsavel principal (o pagador).
  const cpfAtleta = soDigitos(atleta.cpf)
  const cpfResp   = soDigitos(resp?.cpf)
  const cpf = cpfAtleta.length >= 11 ? cpfAtleta : cpfResp

  if (cpf.length < 11) {
    return {
      ok: false,
      erro: 'Para gerar a cobranca e preciso ter o CPF do responsavel na ficha. Edite o atleta, preencha o CPF do responsavel 1 e tente de novo.',
    }
  }

  const telefone = soDigitos(atleta.telefone) || soDigitos(resp?.whatsapp) || soDigitos(resp?.telefone)

  const dados: Record<string, string> = { name: atleta.nome, cpfCnpj: cpf }
  if (telefone)          { dados.phone = telefone; dados.mobilePhone = telefone }
  if (resp?.email)         dados.email = resp.email
  if (atleta.endereco)     dados.address = atleta.endereco
  if (atleta.numero)       dados.addressNumber = atleta.numero
  if (atleta.bairro)       dados.province = atleta.bairro
  if (soDigitos(atleta.cep)) dados.postalCode = soDigitos(atleta.cep)

  // Cliente ja existe: atualiza (conserta quem entrou sem CPF/telefone).
  if (atleta.asaasCustomerId) {
    const atualizado = await atualizarClienteAsaas(apiKey, atleta.asaasCustomerId, dados)
    if (atualizado?.id) return { ok: true, customerId: atualizado.id }
    console.error('[asaasCliente] falha ao atualizar', atleta.asaasCustomerId, JSON.stringify(atualizado?.errors || atualizado))
    // cai pra criacao de um cliente novo logo abaixo
  }

  const criado = await criarClienteAsaas(apiKey, dados as never)
  if (criado?.errors || !criado?.id) {
    return {
      ok: false,
      erro: criado?.errors?.[0]?.description || 'Erro ao criar o cliente no Asaas.',
    }
  }

  await supabaseAdmin.from('Atleta').update({ asaasCustomerId: criado.id }).eq('id', atletaId)
  return { ok: true, customerId: criado.id }
}
