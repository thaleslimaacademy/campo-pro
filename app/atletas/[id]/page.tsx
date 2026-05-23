import { supabase } from '@/lib/supabase'
import CopiarLink from './CopiarLink'

export default async function PerfilAtleta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: atleta } = await supabase
    .from('Atleta')
    .select('*')
    .eq('id', id)
    .single()

  if (!atleta) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p>Atleta não encontrado.</p>
      </div>
    )
  }

  const { data: responsaveis } = await supabase
    .from('Responsavel')
    .select('*')
    .eq('atletaId', id)

  const linkPais = `https://campo-pro.vercel.app/pais/${atleta.tokenPais}`

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <a href="/atletas" className="text-gray-400">← Voltar</a>
        <h1 className="text-xl font-bold">Perfil do Atleta</h1>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center text-2xl font-bold text-green-400">
            {atleta.nome[0]}
          </div>
          <div>
            <p className="text-xl font-bold">{atleta.nome}</p>
            <p className="text-green-500">{atleta.posicao || 'Sem posição'}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {atleta.dataNascimento && (
            <div className="flex justify-between">
              <span className="text-gray-400">Nascimento</span>
              <span>{new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
          {atleta.cpf && (
            <div className="flex justify-between">
              <span className="text-gray-400">CPF</span>
              <span>{atleta.cpf}</span>
            </div>
          )}
          {atleta.rg && (
            <div className="flex justify-between">
              <span className="text-gray-400">RG</span>
              <span>{atleta.rg}</span>
            </div>
          )}
          {atleta.telefone && (
            <div className="flex justify-between">
              <span className="text-gray-400">Telefone</span>
              <span>{atleta.telefone}</span>
            </div>
          )}
        </div>
      </div>

      {atleta.endereco && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <p className="text-gray-400 text-sm mb-2">Endereço</p>
          <p className="text-sm">{atleta.endereco}, {atleta.numero}</p>
          <p className="text-sm text-gray-400">{atleta.bairro} — {atleta.cidade}/{atleta.estado}</p>
          <p className="text-sm text-gray-400">CEP: {atleta.cep}</p>
        </div>
      )}

      {responsaveis && responsaveis.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <p className="text-gray-400 text-sm mb-2">Responsável</p>
          {responsaveis.map((r: { id: string; nome: string; whatsapp: string; telefone: string }) => (
            <div key={r.id}>
              <p className="font-bold">{r.nome}</p>
              <p className="text-gray-400 text-sm">{r.whatsapp || r.telefone}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-2">🔗 Link da Área dos Pais</p>
        <p className="text-xs text-gray-400 break-all mb-3">{linkPais}</p>
        <CopiarLink link={linkPais} />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br/>Início</a>
        <a href="/atletas" className="text-green-500 text-xs text-center">👥<br/>Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br/>Presença</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br/>Financeiro</a>
      </nav>
    </div>
  )
}