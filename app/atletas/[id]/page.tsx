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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
          <a href={'/atletas/' + atleta.id + '/carteirinha'} className="bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
            🪪
          </a>
          <a href={'/atletas/' + atleta.id + '/avaliacao'} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
            📋
          </a>
          <a href={'/atletas/' + atleta.id + '/editar'} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", padding: "8px 14px", borderRadius: "10px", fontSize: "13px", textDecoration: "none" }}>
            ✏️
          </a>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
        <div className="flex items-center gap-4 mb-4">
          <FotoAtleta atletaId={atleta.id} fotoUrl={atleta.fotoUrl || null} nome={atleta.nome} />
          <div>
            <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "20px", color: "#F0F0F0", margin: "0 0 4px" }}>{atleta.nome}</p>
            <p style={{ color: "#39FF14", fontSize: "13px", fontWeight: 600 }}>{atleta.posicao || 'Sem posição'}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          {atleta.dataNascimento && (
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Nascimento</span>
              <span>{new Date(atleta.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
            </div>
          )}
          {atleta.cpf && (
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>CPF</span>
              <span>{atleta.cpf}</span>
            </div>
          )}
          {atleta.rg && (
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>RG</span>
              <span>{atleta.rg}</span>
            </div>
          )}
          {atleta.telefone && (
            <div className="flex justify-between">
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Telefone</span>
              <span>{atleta.telefone}</span>
            </div>
          )}
        </div>
      </div>

      <GerarCobranca atletaId={atleta.id} atletaNome={atleta.nome} />

      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
        <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "12px", color: "#39FF14", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>Historico Financeiro</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div style={{ background: "rgba(57,255,20,0.07)", border: "1px solid rgba(57,255,20,0.15)", borderRadius: "12px", padding: "10px", textAlign: "center" }}>
            <p style={{ color: "#39FF14", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "14px" }}>{'R$ ' + totalPago.toFixed(0)}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginTop: "4px" }}>Pago</p>
          </div>
          <div style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: "12px", padding: "10px", textAlign: "center" }}>
            <p style={{ color: "#D4AF37", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "14px" }}>{'R$ ' + totalPendente.toFixed(0)}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginTop: "4px" }}>Pendente</p>
          </div>
          <div style={{ background: "rgba(255,70,70,0.07)", border: "1px solid rgba(255,70,70,0.15)", borderRadius: "12px", padding: "10px", textAlign: "center" }}>
            <p style={{ color: "#ff5555", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "14px" }}>{'R$ ' + totalVencido.toFixed(0)}</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", marginTop: "4px" }}>Vencido</p>
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

      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
        <div className="flex justify-between items-center mb-4">
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "12px", color: "#39FF14", textTransform: "uppercase", letterSpacing: "1px" }}>Historico de Presenca</p>
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
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "12px", color: "#39FF14", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Endereco</p>
          <p className="text-sm">{atleta.endereco}, {atleta.numero}</p>
          <p className="text-sm text-gray-400">{atleta.bairro} — {atleta.cidade}/{atleta.estado}</p>
          <p className="text-sm text-gray-400">CEP: {atleta.cep}</p>
        </div>
      )}

      {responsaveis && responsaveis.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "12px", color: "#39FF14", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Responsavel</p>
          {responsaveis.map((r: { id: string; nome: string; whatsapp: string; telefone: string }) => (
            <div key={r.id}>
              <p className="font-bold">{r.nome}</p>
              <p className="text-gray-400 text-sm">{r.whatsapp || r.telefone}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "16px", padding: "14px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
        <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "12px", color: "#39FF14", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Link Area dos Pais</p>
        <p className="text-xs text-gray-400 break-all mb-3">{linkPais}</p>
        <CopiarLink link={linkPais} />
      </div>

      <div style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "16px", padding: "14px", marginBottom: "12px" }}>
        <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "12px", color: "#D4AF37", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>Link de Rematricula</p>
        <p className="text-xs text-gray-500 mb-3">Envie para o responsável renovar a matrícula do atleta.</p>
        <p className="text-xs text-gray-400 break-all mb-3">{linkRematricula}</p>
        <CopiarLink link={linkRematricula} />
      </div>

      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-around", padding: "12px 0 20px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,5,0.95)", backdropFilter: "blur(10px)" }}>
        <a href="/dashboard" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Inicio</a>
        <a href="/atletas" style={{ textDecoration: "none", color: "#39FF14", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif", fontWeight: 700 }}>Atletas</a>
        <a href="/presenca" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Presenca</a>
        <a href="/financeiro" style={{ textDecoration: "none", color: "rgba(255,255,255,0.4)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Syne, sans-serif" }}>Financeiro</a>
      </nav>
    </div>
  )
}