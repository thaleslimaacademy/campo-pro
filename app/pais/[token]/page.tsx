import { supabase } from '@/lib/supabase'

export default async function AreaPais({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const { data: atleta } = await supabase
    .from('Atleta')
    .select('id, nome, posicao, tokenPais, fotoUrl')
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

  const { data: cobrancas } = await supabase
    .from('Cobranca')
    .select('id, valor, vencimento, status, descricao, pixCopiaCola')
    .eq('atletaId', atleta.id)
    .order('vencimento', { ascending: false })
    .limit(6)

  const totalPago = cobrancas?.filter(c => c.status === 'PAGO').reduce((s, c) => s + Number(c.valor), 0) || 0
  const totalPendente = cobrancas?.filter(c => c.status === 'PENDENTE' || c.status === 'VENCIDO').reduce((s, c) => s + Number(c.valor), 0) || 0
  const temInadimplencia = cobrancas?.some(c => c.status === 'VENCIDO') || false

  const statusCor: Record<string, string> = {
    PAGO: 'text-green-400',
    PENDENTE: 'text-yellow-400',
    VENCIDO: 'text-red-400',
    CANCELADO: 'text-gray-400',
  }

  const statusBg: Record<string, string> = {
    PAGO: 'bg-green-400/10',
    PENDENTE: 'bg-yellow-400/10',
    VENCIDO: 'bg-red-400/10',
    CANCELADO: 'bg-gray-400/10',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-10">

      <div className="text-center mb-6">
        <p className="text-4xl mb-2">⚽</p>
        <h1 className="text-xl font-bold text-green-500">Thales Lima Football Academy</h1>
        <p className="text-gray-400 text-sm">Área do Responsável</p>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-3">Atleta</p>
        <div className="flex items-center gap-3">
          {atleta.fotoUrl ? (
            <img src={atleta.fotoUrl} alt={atleta.nome} className="w-14 h-14 rounded-full object-cover border-2 border-green-500" />
          ) : (
            <div className="w-14 h-14 bg-green-900 rounded-full flex items-center justify-center text-xl font-bold text-green-400">
              {atleta.nome[0]}
            </div>
          )}
          <div>
            <p className="text-lg font-bold">{atleta.nome}</p>
            <p className="text-green-500 text-sm">{atleta.posicao || 'Sem posição'}</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-3">📅 Presença este mês</p>
        <div className="flex items-center gap-4">
          <div className={`text-3xl font-bold ${percentual >= 75 ? 'text-green-400' : percentual >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {percentual}%
          </div>
          <div>
            <p className="text-sm text-white">{presentes} de {total} treinos</p>
            <p className="text-xs text-gray-400">
              {percentual >= 75 ? '✅ Frequência boa' : percentual === 0 ? '📋 Sem treinos este mês' : '⚠️ Frequência baixa'}
            </p>
          </div>
        </div>
        {total > 0 && (
          <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
            <div
              className={`h-2 rounded-full transition-all ${percentual >= 75 ? 'bg-green-500' : percentual >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${percentual}%` }}
            />
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-3">💰 Financeiro</p>

        {temInadimplencia && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
            <p className="text-red-400 font-bold text-sm">⚠️ Pagamento em atraso</p>
            <p className="text-gray-400 text-xs mt-1">Entre em contato com a escola para regularizar.</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-400/10 rounded-xl p-3 text-center">
            <p className="text-green-400 font-bold">R$ {totalPago.toFixed(2)}</p>
            <p className="text-gray-400 text-xs mt-1">Total pago</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${totalPendente > 0 ? 'bg-yellow-400/10' : 'bg-gray-800'}`}>
            <p className={`font-bold ${totalPendente > 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
              R$ {totalPendente.toFixed(2)}
            </p>
            <p className="text-gray-400 text-xs mt-1">A pagar</p>
          </div>
        </div>

        {!cobrancas || cobrancas.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Nenhuma cobrança registrada</p>
        ) : (
          <div className="space-y-2">
            {cobrancas.map(c => (
              <div key={c.id} className={`rounded-xl p-3 ${statusBg[c.status] || 'bg-gray-800'}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium">{c.descricao || 'Mensalidade'}</p>
                  <p className={`text-xs font-bold ${statusCor[c.status] || 'text-gray-400'}`}>{c.status}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-400">
                    Vencimento: {new Date(c.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm font-bold">R$ {Number(c.valor).toFixed(2)}</p>
                </div>
                {(c.status === 'PENDENTE' || c.status === 'VENCIDO') && c.pixCopiaCola && (
                  <div className="mt-2 bg-black/20 rounded-lg p-2">
                    <p className="text-xs text-gray-400 mb-1">Pix Copia e Cola:</p>
                    <p className="text-xs text-green-400 break-all font-mono">{c.pixCopiaCola}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-gray-400 text-sm mb-3">📞 Contato</p>
        
          href="https://wa.me/5534998168467"
          target="_blank"
          className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm text-center block"
        >
          💬 Falar com a Academy
        </a>
      </div>

    </div>
  )
}