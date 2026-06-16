import { supabase } from '@/lib/supabase'

export default async function AreaPais({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // ── Busca atleta pelo token do responsável ──
  const { data: atleta } = await supabase
    .from('Atleta')
    .select('id, nome, posicao, tokenPais, fotoUrl, escolaId')
    .eq('tokenPais', token)
    .single()

  // Token inválido ou expirado
  if (!atleta) {
    return (
      <div
        style={{ background: 'linear-gradient(160deg, #0a1a06, #050505, #111003)' }}
        className="min-h-screen text-white flex flex-col items-center justify-center p-6"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-3xl mx-auto mb-4">
            ❌
          </div>
          <h2 className="text-xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
            Link inválido
          </h2>
          <p className="text-gray-400 mt-2 text-sm">Este link não existe ou expirou.</p>
        </div>
      </div>
    )
  }

  // ── Presenças do mês atual ──
  const mesAtual = new Date().toISOString().slice(0, 7)
  const { data: presencas } = await supabase
    .from('Presenca')
    .select('status')
    .eq('atletaId', atleta.id)
    .gte('criadoEm', mesAtual + '-01')

  const total = presencas?.length || 0
  const presentes = presencas?.filter(p => p.status === 'PRESENTE').length || 0
  const percentual = total > 0 ? Math.round((presentes / total) * 100) : 0

  // ── Cobranças recentes (últimas 6) ──
  const { data: cobrancas } = await supabase
    .from('Cobranca')
    .select('id, valor, vencimento, status, descricao, pixCopiaCola')
    .eq('atletaId', atleta.id)
    .order('vencimento', { ascending: false })
    .limit(6)

  // ── Premiações ──
  const { data: premiacoes } = await supabase
    .from('Premiacao').select('id, titulo, icone')
    .eq('atletaId', atleta.id).order('dataConquista', { ascending: false })

  // ── Última avaliação física ──
  const { data: avaliacoes } = await supabase
    .from('Avaliacao').select('dataAvaliacao, peso, altura, imc, gordura')
    .eq('atletaId', atleta.id).order('dataAvaliacao', { ascending: false }).limit(1)
  const ultimaAval = avaliacoes?.[0] || null

  // ── Slug da escola para fotos/loja ──
  const { data: escola } = await supabase
    .from('Escola').select('slug').eq('id', atleta.escolaId).single()
  const escolaSlug = escola?.slug || ''

  // ── Nível do atleta ──
  const totalConquistas = premiacoes?.length || 0
  const nivel = totalConquistas >= 61 ? { label: 'Lenda TLFA', emoji: '👑' }
    : totalConquistas >= 51 ? { label: 'Referência', emoji: '🟡' }
    : totalConquistas >= 41 ? { label: 'Elite', emoji: '🔴' }
    : totalConquistas >= 31 ? { label: 'Destaque', emoji: '🟠' }
    : totalConquistas >= 21 ? { label: 'Competidor', emoji: '🟣' }
    : totalConquistas >= 11 ? { label: 'Em Desenvolvimento', emoji: '🔵' }
    : totalConquistas >= 6  ? { label: 'Aprendiz', emoji: '🟢' }
    : { label: 'Iniciante', emoji: '🔰' }

  const totalPago = cobrancas?.filter(c => c.status === 'PAGO').reduce((s, c) => s + Number(c.valor), 0) || 0
  const totalPendente = cobrancas?.filter(c => c.status === 'PENDENTE' || c.status === 'VENCIDO').reduce((s, c) => s + Number(c.valor), 0) || 0
  const temInadimplencia = cobrancas?.some(c => c.status === 'VENCIDO') || false

  // ── Paleta por status de cobrança ──
  const statusCor: Record<string, string> = {
    PAGO: '#39FF14',
    PENDENTE: '#D4AF37',
    VENCIDO: '#FF4444',
    CANCELADO: '#6B7280',
  }
  const statusBorder: Record<string, string> = {
    PAGO: 'rgba(57,255,20,0.2)',
    PENDENTE: 'rgba(212,175,55,0.25)',
    VENCIDO: 'rgba(255,68,68,0.25)',
    CANCELADO: 'rgba(107,114,128,0.15)',
  }
  const statusBgAlpha: Record<string, string> = {
    PAGO: 'rgba(57,255,20,0.05)',
    PENDENTE: 'rgba(212,175,55,0.05)',
    VENCIDO: 'rgba(255,68,68,0.05)',
    CANCELADO: 'rgba(107,114,128,0.05)',
  }

  // ── Cor da barra de presença ──
  const barColor = percentual >= 75 ? '#39FF14' : percentual >= 50 ? '#D4AF37' : '#FF4444'
  const barLabel =
    percentual >= 75 ? '✓ Frequência excelente' :
    percentual === 0 ? 'Sem treinos registrados este mês' :
    '⚠ Frequência baixa'

  return (
    <div
      style={{ background: 'linear-gradient(160deg, #0a1a06, #050505, #111003)' }}
      className="min-h-screen text-white pb-12"
    >

      {/* ─────────────────────────────────────────── */}
      {/* HEADER                                      */}
      {/* ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-5 pt-10 pb-8 text-center border-b border-white/5">
        {/* Glow decorativo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-72 h-24 rounded-full blur-3xl opacity-10"
            style={{ background: '#39FF14' }}
          />
        </div>

        <div className="relative z-10">
          {/* Ícone central */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
            style={{
              background: 'rgba(57,255,20,0.08)',
              border: '1px solid rgba(57,255,20,0.3)',
              boxShadow: '0 0 20px rgba(57,255,20,0.12)',
            }}
          >
            ⚽
          </div>

          {/* Nome da academia */}
          <h1
            className="text-xl font-black tracking-tight leading-tight"
            style={{ fontFamily: 'Syne, sans-serif', color: '#39FF14' }}
          >
            Thales Lima Football Academy
          </h1>

          {/* Badge subtítulo */}
          <span
            className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: 'rgba(212,175,55,0.1)',
              color: '#D4AF37',
              border: '1px solid rgba(212,175,55,0.25)',
              letterSpacing: '0.05em',
            }}
          >
            Área do Responsável
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────── */}
      {/* CONTEÚDO                                    */}
      {/* ─────────────────────────────────────────── */}
      <div className="px-5 mt-5 space-y-4">

        {/* ── CARD ATLETA ── */}
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: 'rgba(255,255,255,0.025)',
            borderColor: 'rgba(212,175,55,0.2)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#D4AF37' }}
          >
            Atleta
          </p>

          <div className="flex items-center gap-4">
            {/* Foto ou inicial */}
            {atleta.fotoUrl ? (
              <img
                src={atleta.fotoUrl}
                alt={atleta.nome}
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                style={{ border: '2px solid rgba(212,175,55,0.6)' }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
                style={{
                  background: 'rgba(57,255,20,0.08)',
                  border: '2px solid rgba(57,255,20,0.3)',
                  color: '#39FF14',
                  fontFamily: 'Syne, sans-serif',
                }}
              >
                {atleta.nome[0]}
              </div>
            )}

            <div>
              {/* Nome */}
              <p
                className="text-lg font-black leading-tight"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {atleta.nome}
              </p>

              {/* Posição */}
              <span
                className="inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                  background: 'rgba(212,175,55,0.1)',
                  color: '#D4AF37',
                  border: '1px solid rgba(212,175,55,0.25)',
                }}
              >
                {atleta.posicao || 'Sem posição definida'}
              </span>
            </div>
          </div>
        </div>

        {/* ── CARD PRESENÇA ── */}
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: 'rgba(255,255,255,0.025)',
            borderColor: 'rgba(57,255,20,0.15)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#D4AF37' }}
          >
            📅 Presença este mês
          </p>

          <div className="flex items-end gap-4 mb-3">
            {/* Percentual em destaque */}
            <span
              className="text-5xl font-black leading-none"
              style={{
                fontFamily: 'Syne, sans-serif',
                color: barColor,
                textShadow: '0 0 20px ' + barColor + '60',
              }}
            >
              {percentual}%
            </span>

            <div className="pb-1">
              <p className="text-sm font-semibold text-white">
                {presentes} de {total} treinos
              </p>
              <p className="text-xs mt-0.5" style={{ color: barColor + 'BB' }}>
                {barLabel}
              </p>
            </div>
          </div>

          {/* Barra de progresso */}
          {total > 0 && (
            <div
              className="w-full rounded-full h-1.5"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            >
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{
                  width: percentual + '%',
                  background: barColor,
                  boxShadow: '0 0 10px ' + barColor + '70',
                }}
              />
            </div>
          )}
        </div>

        {/* ── CARD FINANCEIRO ── */}
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: 'rgba(255,255,255,0.025)',
            borderColor: 'rgba(57,255,20,0.15)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: '#D4AF37' }}
          >
            💰 Financeiro
          </p>

          {/* Alerta de inadimplência */}
          {temInadimplencia && (
            <div
              className="rounded-xl p-3 mb-4 border"
              style={{
                background: 'rgba(255,68,68,0.07)',
                borderColor: 'rgba(255,68,68,0.25)',
              }}
            >
              <p className="text-red-400 font-bold text-sm">⚠️ Pagamento em atraso</p>
              <p className="text-gray-400 text-xs mt-1">
                Entre em contato com a escola para regularizar.
              </p>
            </div>
          )}

          {/* Totais: Pago / A Pagar */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div
              className="rounded-xl p-3 text-center border"
              style={{
                background: 'rgba(57,255,20,0.05)',
                borderColor: 'rgba(57,255,20,0.2)',
              }}
            >
              <p
                className="text-lg font-black"
                style={{ fontFamily: 'Syne, sans-serif', color: '#39FF14' }}
              >
                {'R$ ' + totalPago.toFixed(2)}
              </p>
              <p className="text-xs mt-1 text-gray-400">Total pago</p>
            </div>

            <div
              className="rounded-xl p-3 text-center border"
              style={{
                background: totalPendente > 0 ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.03)',
                borderColor: totalPendente > 0 ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.07)',
              }}
            >
              <p
                className="text-lg font-black"
                style={{
                  fontFamily: 'Syne, sans-serif',
                  color: totalPendente > 0 ? '#D4AF37' : '#4B5563',
                }}
              >
                {'R$ ' + totalPendente.toFixed(2)}
              </p>
              <p className="text-xs mt-1 text-gray-400">A pagar</p>
            </div>
          </div>

          {/* Lista de cobranças */}
          {!cobrancas || cobrancas.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              Nenhuma cobrança registrada
            </p>
          ) : (
            <div className="space-y-2">
              {cobrancas.map(c => (
                <div
                  key={c.id}
                  className="rounded-xl p-3 border"
                  style={{
                    background: statusBgAlpha[c.status] || 'rgba(255,255,255,0.03)',
                    borderColor: statusBorder[c.status] || 'rgba(255,255,255,0.07)',
                  }}
                >
                  {/* Linha superior: descrição + badge status */}
                  <div className="flex justify-between items-start mb-1.5">
                    <p className="text-sm font-semibold">{c.descricao || 'Mensalidade'}</p>
                    <span
                      className="text-xs font-black px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                      style={{
                        color: statusCor[c.status] || '#9CA3AF',
                        background: (statusCor[c.status] || '#9CA3AF') + '18',
                      }}
                    >
                      {c.status}
                    </span>
                  </div>

                  {/* Linha inferior: vencimento + valor */}
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-400">
                      {'Vence: ' + new Date((c.vencimento || '').slice(0,10) + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-sm font-bold text-white">
                      {'R$ ' + Number(c.valor).toFixed(2)}
                    </p>
                  </div>

                  {/* Pix Copia e Cola (apenas pendente/vencido) */}
                  {(c.status === 'PENDENTE' || c.status === 'VENCIDO') && c.pixCopiaCola && (
                    <div
                      className="mt-2.5 rounded-lg p-2.5"
                      style={{
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid rgba(57,255,20,0.15)',
                      }}
                    >
                      <p className="text-xs text-gray-400 mb-1">📋 Pix Copia e Cola:</p>
                      <p
                        className="text-xs break-all font-mono"
                        style={{ color: '#39FF14', lineHeight: '1.6' }}
                      >
                        {c.pixCopiaCola}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── CARD NIVEL E CONQUISTAS ── */}
        {premiacoes && premiacoes.length > 0 && (
          <div
            className="rounded-2xl p-4 border"
            style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,215,0,0.2)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#D4AF37' }}>
              🏆 Conquistas
            </p>
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontSize: 28 }}>{nivel.emoji}</span>
              <div>
                <p className="font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{nivel.label}</p>
                <p className="text-xs" style={{ color: '#D4AF37' }}>{totalConquistas} conquistas desbloqueadas</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {premiacoes.slice(0, 8).map((p: {id:string;titulo:string;icone:string}) => (
                <span key={p.id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                  style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', color: '#D4AF37' }}>
                  {p.icone} {p.titulo}
                </span>
              ))}
              {premiacoes.length > 8 && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                  +{premiacoes.length - 8} mais
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── CARD AVALIACAO FISICA ── */}
        {ultimaAval && (
          <div
            className="rounded-2xl p-4 border"
            style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(57,255,20,0.15)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#D4AF37' }}>
              💪 Última Avaliação Física
            </p>
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {new Date(ultimaAval.dataAvaliacao + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Peso', valor: ultimaAval.peso ? ultimaAval.peso + ' kg' : '—' },
                { label: 'Altura', valor: ultimaAval.altura ? ultimaAval.altura + ' cm' : '—' },
                { label: 'IMC', valor: ultimaAval.imc ? Number(ultimaAval.imc).toFixed(1) : '—' },
                { label: '% Gordura', valor: ultimaAval.gordura ? Number(ultimaAval.gordura).toFixed(1) + '%' : '—' },
              ].map(item => (
                <div key={item.label} className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.15)' }}>
                  <p className="font-black text-white" style={{ fontFamily: 'Syne, sans-serif', fontSize: 18 }}>{item.valor}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FOTOS E LOJA ── */}
        {escolaSlug && (
          <div
            className="rounded-2xl p-4 border"
            style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#D4AF37' }}>
              📸 Academia
            </p>
            <div className="grid grid-cols-2 gap-3">
              <a href={`/galeria/${escolaSlug}`}
                className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-black text-sm"
                style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)', color: '#FF6B00', textDecoration: 'none', fontFamily: 'Syne, sans-serif' }}>
                📸 Fotos
              </a>
              <a href={`/loja/${escolaSlug}`}
                className="flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-black text-sm"
                style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', color: '#FFD700', textDecoration: 'none', fontFamily: 'Syne, sans-serif' }}>
                🛒 Loja
              </a>
            </div>
          </div>
        )}

        {/* ── CARD CONTATO ── */}
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: 'rgba(255,255,255,0.025)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#D4AF37' }}
          >
            📞 Fale conosco
          </p>

          
          <a
            href="https://wa.me/5534998168467"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-black text-sm transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #39FF14 0%, #2bcc0f 100%)',
              color: '#050505',
              fontFamily: 'Syne, sans-serif',
              boxShadow: '0 0 24px rgba(57,255,20,0.3), 0 4px 12px rgba(0,0,0,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            💬 Falar com a Academy
          </a>
        </div>

      </div>
    </div>
  )
}
