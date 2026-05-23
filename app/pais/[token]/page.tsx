import { supabase } from '@/lib/supabase'

export default async function AreaPais({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const { data: atleta } = await supabase
    .from('Atleta')
    .select('id, nome, posicao, tokenPais')
    .eq('tokenPais', token)
    .single()

  if (!atleta) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <p className="text-5xl mb-4">❌</p>
        <h2 className="text-xl font-bold">Link inválido</h2>
        <p className="text-gray-400 mt-2">Este link não existe ou expirou.</p>
      </div>
    )
  }

  const mesAtual = new Date().toISOString().slice(0, 7)
  const { data: presencas } = await supabase
    .from('Presenca')
    .select('status')
    .eq('atletaId', atleta.id)
    .gte('criadoEm', `${mesAtual}-01`)

  const total = presencas?.length || 0
  const presentes = presencas?.filter(p => p.status === 'PRESENTE').length || 0
  const percentual = total > 0 ? Math.round((presentes / total) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="text-center mb-8">
        <p className="text-4xl mb-2">⚽</p>
        <h1 className="text-xl font-bold text-green-500">Campo Pro</h1>
        <p className="text-gray-400 text-sm">Área do Responsável</p>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-1">Atleta</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-900 rounded-full flex items-center justify-center text-xl font-bold text-green-400">
            {atleta.nome[0]}
          </div>
          <div>
            <p className="text-lg font-bold">{atleta.nome}</p>
            <p className="text-green-500 text-sm">{atleta.posicao || 'Sem posição'}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-3">Presença este mês</p>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-green-400">{percentual}%</div>
          <div>
            <p className="text-sm text-white">{presentes} de {total} treinos</p>
            <p className="text-xs text-gray-400">
              {percentual >= 75 ? '✅ Frequência boa' : percentual === 0 ? '📋 Sem treinos este mês' : '⚠️ Frequência baixa'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-gray-400 text-sm mb-2">Mensalidade</p>
        <p className="text-2xl font-bold text-green-400">Em dia ✅</p>
        <p className="text-gray-400 text-sm mt-1">Entre em contato com a escola para mais detalhes.</p>
      </div>
    </div>
  )
}