import { supabase } from '@/lib/supabase'
import CopiarLink from './CopiarLink'
import GraficoPresenca from './GraficoPresenca'
import FotoAtleta from './FotoAtleta'
import GerarCobranca from './GerarCobranca'

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

  const agora = new Date()
  const seisAtras = new Date(agora.getFullYear(), agora.getMonth() - 5, 1)

  const { data: presencas } = await supabase
    .from('Presenca')
    .select('status, criadoEm')
    .eq('atletaId', id)
    .gte('criadoEm', seisAtras.toISOString())
    .order('criadoEm', { ascending: true })

  const meses: Record<string, { presentes: number; total: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    const chave = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    meses[chave] = { presentes: 0, total: 0 }
  }

  if (presencas) {
    presencas.forEach(p => {
      const d = new Date(p.criadoEm)
      const chave = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      if (meses[chave] !== undefined) {
        meses[chave].total++
        if (p.status === 'PRESENTE') meses[chave].presentes++
      }
    })
  }

  const dadosGrafico = Object.entries(meses).map(([mes, dados]) => ({
    mes,
    presentes: dados.presentes,
    total: dados.total,
    percentual: dados.total > 0 ? Math.round((dados.presentes / dados.total) * 100) : 0,
  }))

  const totalPresencas = presencas ? presencas.length : 0
  const totalPresentes = presencas ? presencas.filter(p => p.status === 'PRESENTE').length : 0
  const percentualGeral = totalPresencas > 0 ? Math.round((totalPresentes / totalPresencas) * 100) : 0

  const { data: cobrancas } = await supabase
    .from('Cobranca')
    .select('id, valor, vencimento, status, descricao')
    .eq('atletaId', id)
    .order('vencimento', { ascending: false })
    .limit(12)

  const totalPago = cobrancas ? cobrancas.filter(c => c.status === 'PAGO').reduce((s, c) => s + Number(c.valor), 0) : 0
  const totalPendente = cobrancas ? cobrancas.filter(c => c.status === 'PENDENTE').reduce((s, c) => s + Number(c.valor), 0) : 0
  const totalVencido = cobrancas ? cobrancas.filter(c => c.status === 'VENCIDO').reduce((s, c) => s + Number(c.valor), 0) : 0

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

  const linkPais = 'https://campo-pro.vercel.app/pais/' + atleta.tokenPais
  const linkRematricula = 'https://campo-pro.vercel.app/rematricula/' + atleta.id

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a href="/atletas" className="text-gray-400">← Voltar</a>
          <h1 className="text-xl font-bold">Perfil do Atleta</h1>
        </div>
        <div className="flex gap-2">
          <a href={'/atletas/' + atleta.id + '/avaliacao'} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
            📋 Avaliar
          </a>
          <a href={'/atletas/' + atleta.id + '/editar'} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
            ✏️ Editar
          </a>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <FotoAtleta atletaId={atleta.id} fotoUrl={atleta.fotoUrl || null} nome={atleta.nome} />
          <div>
            <p className="text-xl font-bold">{atleta.nome}</p>
            <p className="text-green-500">{atleta.posicao || 'Sem posição'}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {atleta.dataNascimento && (
            <div className="flex justify-between">
              <span className="text-gray-400">Nascimento</span>
              <span>{new Date(atleta.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
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

      <GerarCobranca atletaId={atleta.id} atletaNome={atleta.nome} />

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="font-bold text-sm mb-4">💰 Histórico Financeiro</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-green-400/10 rounded-xl p-3 text-center">
            <p className="text-green-400 font-bold text-sm">{'R$ ' + totalPago.toFixed(0)}</p>
            <p className="text-gray-400 text-xs mt-1">Pago</p>
          </div>
          <div className="bg-yellow-400/10 rounded-xl p-3 text-center">
            <p className="text-yellow-400 font-bold text-sm">{'R$ ' + totalPendente.toFixed(0)}</p>
            <p className="text-gray-400 text-xs mt-1">Pendente</p>
          </div>
          <div className="bg-red-400/10 rounded-xl p-3 text-center">
            <p className="text-red-400 font-bold text-sm">{'R$ ' + totalVencido.toFixed(0)}</p>
            <p className="text-gray-400 text-xs mt-1">Vencido</p>
          </div>
        </div>
        {!cobrancas || cobrancas.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Nenhuma cobrança registrada</p>
        ) : (
          <div className="space-y-2">
            {cobrancas.map(c => (
              <div key={c.id} className={'flex justify-between items-center rounded-xl p-3 ' + (statusBg[c.status] || 'bg-gray-800')}>
                <div>
                  <p className="text-sm font-medium">{c.descricao || 'Mensalidade'}</p>
                  <p className="text-xs text-gray-400">{new Date(c.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{'R$ ' + Number(c.valor).toFixed(2)}</p>
                  <p className={'text-xs font-bold ' + (statusCor[c.status] || 'text-gray-400')}>{c.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <div className="flex justify-between items-center mb-4">
          <p className="font-bold text-sm">📊 Histórico de Presença</p>
          <div className="text-right">
            <p className={'text-lg font-bold ' + (percentualGeral >= 75 ? 'text-green-400' : percentualGeral >= 50 ? 'text-yellow-400' : 'text-red-400')}>
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

      <div className="bg-orange-600/10 border border-orange-600/30 rounded-xl p-4 mb-4">
        <p className="text-orange-400 font-bold text-sm mb-1">🔄 Link de Rematrícula</p>
        <p className="text-xs text-gray-500 mb-3">Envie para o responsável renovar a matrícula do atleta.</p>
        <p className="text-xs text-gray-400 break-all mb-3">{linkRematricula}</p>
        <CopiarLink link={linkRematricula} />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br />Início</a>
        <a href="/atletas" className="text-green-500 text-xs text-center">👥<br />Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br />Presença</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br />Financeiro</a>
      </nav>
    </div>
  )
}