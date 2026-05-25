import { supabase } from '@/lib/supabase'
import CopiarLink from './CopiarLink'
import GraficoPresenca from './GraficoPresenca'

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

  // Busca últimos 6 meses de presença
  const agora = new Date()
  const seisAtras = new Date(agora.getFullYear(), agora.getMonth() - 5, 1)

  const { data: presencas } = await supabase
    .from('Presenca')
    .select('status, criadoEm')
    .eq('atletaId', id)
    .gte('criadoEm', seisAtras.toISOString())
    .order('criadoEm', { ascending: true })

  // Agrupa por mês
  const meses: Record<string, { presentes: number; total: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    const chave = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    meses[chave] = { presentes: 0, total: 0 }
  }

  presencas?.forEach(p => {
    const d = new Date(p.criadoEm)
    const chave = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (meses[chave] !== undefined) {
      meses[chave].total++
      if (p.status === 'PRESENTE') meses[chave].presentes++
    }
  })

  const dadosGrafico = Object.entries(meses).map(([mes, dados]) => ({
    mes,
    presentes: dados.presentes,
    total: dados.total,
    percentual: dados.total > 0 ? Math.round((dados.presentes / dados.total) * 100) : 0,
  }))

  // Estatísticas gerais
  const totalPresencas = presencas?.length || 0
  const totalPresentes = presencas?.filter(p => p.status === 'PRESENTE').length || 0
  const percentualGeral = totalPresencas > 0 ? Math.round((totalPresentes / totalPresencas) * 100) : 0

  const linkPais = `https://campo-pro.vercel.app/pais/${atleta.tokenPais}`

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <a href="/atletas" className="text-gray-400">← Voltar</a>
        <h1 className="text-xl font-bold">Perfil do Atleta</h1>
      </div>

      {/* Dados pessoais */}
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

      {/* Gráfico de presença */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <div className="flex justify-between items-center mb-4">
          <p className="font-bold text-sm">📊 Histórico de Presença</p>
          <div className="text-right">
            <p className={`text-lg font-bold ${percentualGeral >= 75 ? 'text-green-400' : percentualGeral >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {percentualGeral}%
            </p>
            <p className="text-xs text-gray-500">{totalPresentes}/{totalPresencas} treinos</p>
          </div>
        </div>

        {totalPresencas === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Nenhuma presença registrada</p>
        ) : (
          <GraficoPresenca dados={dadosGrafico} />
        )}

        {/* Legenda */}
        <div className="flex gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-xs text-gray-400">Presente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-600"></div>
            <span className="text-xs text-gray-400">Total</span>
          </div>
        </div>
      </div>

      {/* Endereço */}
      {atleta.endereco && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <p className="text-gray-400 text-sm mb-2">Endereço</p>
          <p className="text-sm">{atleta.endereco}, {atleta.numero}</p>
          <p className="text-sm text-gray-400">{atleta.bairro} — {atleta.cidade}/{atleta.estado}</p>
          <p className="text-sm text-gray-400">CEP: {atleta.cep}</p>
        </div>
      )}

      {/* Responsável */}
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

      {/* Link dos pais */}
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