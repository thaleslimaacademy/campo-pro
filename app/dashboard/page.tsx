'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePerfil } from '@/lib/usePerfil'
import { UserButton } from '@clerk/nextjs'

export default function Dashboard() {
  const { isAdmin, isLoaded, escolaId } = usePerfil()
  const [totalAtletas, setTotalAtletas] = useState(0)
  const [presencaHoje, setPresencaHoje] = useState({ presentes: 0, total: 0 })
  const [pendentes, setPendentes] = useState(0)
  const [rematriculas, setRematriculas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [receitaMes, setReceitaMes] = useState(0)
  const [inadimplentes, setInadimplentes] = useState(0)
  const [totalPendente, setTotalPendente] = useState(0)
  const [cobrancasMes, setCobrancasMes] = useState(0)
  const [copiado, setCopiado] = useState(false)
  const [nomeEscola, setNomeEscola] = useState('GestaoFC')
  const linkMatricula = 'https://gestaofc.com.br/matricula'

  useEffect(() => {
    if (!escolaId) return
    async function carregar() {
      const { data: escola } = await supabase.from('Escola').select('nome').eq('id', escolaId).single()
      if (escola) setNomeEscola(escola.nome)
      const { count } = await supabase.from('Atleta').select('*', { count: 'exact', head: true }).eq('escolaId', escolaId).eq('ativo', true)
      setTotalAtletas(count || 0)
      const dataHoje = new Date().toISOString().split('T')[0]
      const { data: treino } = await supabase.from('Treino').select('id').eq('escolaId', escolaId).gte('data', dataHoje).limit(1).single()
      if (treino) {
        const { data: presencas } = await supabase.from('Presenca').select('status').eq('treinoId', treino.id)
        const presentes = presencas?.filter(p => p.status === 'PRESENTE').length || 0
        setPresencaHoje({ presentes, total: presencas?.length || 0 })
      }
      const { count: cp } = await supabase.from('Matricula').select('*', { count: 'exact', head: true }).eq('escolaId', escolaId).eq('status', 'PENDENTE').eq('tipo', 'matricula')
      setPendentes(cp || 0)
      const { count: cr } = await supabase.from('Matricula').select('*', { count: 'exact', head: true }).eq('escolaId', escolaId).eq('status', 'PENDENTE').eq('tipo', 'rematricula')
      setRematriculas(cr || 0)
      const agora = new Date()
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().split('T')[0]
      const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString().split('T')[0]
      const { data: cobrancas } = await supabase.from('Cobranca').select('valor, status, vencimento').eq('escolaId', escolaId).gte('vencimento', inicioMes).lte('vencimento', fimMes)
      if (cobrancas) {
        const pagas = cobrancas.filter(c => c.status === 'PAGO')
        const pend = cobrancas.filter(c => c.status === 'PENDENTE' || c.status === 'VENCIDO')
        const venc = cobrancas.filter(c => c.status === 'VENCIDO')
        setReceitaMes(pagas.reduce((s, c) => s + Number(c.valor), 0))
        setTotalPendente(pend.reduce((s, c) => s + Number(c.valor), 0))
        setInadimplentes(venc.length)
        setCobrancasMes(cobrancas.length)
      }
      setLoading(false)
    }
    carregar()
  }, [escolaId])

  function copiarLink() {
    navigator.clipboard.writeText(linkMatricula)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const pct = presencaHoje.total > 0 ? Math.round((presencaHoje.presentes / presencaHoje.total) * 100) : 0
  const mes = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const dia = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const recTotal = receitaMes + totalPendente
  const pctRec = recTotal > 0 ? Math.round((receitaMes / recTotal) * 100) : 0

  const syne = 'Syne, sans-serif'
  const inter = 'Inter, sans-serif'
  const neon = '#39FF14'
  const gold = '#D4AF37'
  const muted = 'rgba(255,255,255,0.4)'
  const cardBg = 'rgba(255,255,255,0.05)' as const
  const cardBorder = '1px solid rgba(255,255,255,0.07)' as const

  if (!isLoaded) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: muted, fontFamily: inter }}>Carregando...</p></div>
  if (!escolaId) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: muted, fontFamily: inter }}>Configurando sessao...</p></div>

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', color: '#F0F0F0', fontFamily: inter }}>

      {/* HEADER */}
      <div style={{ padding: '16px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#39FF14,#00aa00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: 800, color: '#000', fontFamily: syne, boxShadow: '0 0 16px rgba(57,255,20,0.4)' }}>G</div>
            <div>
              <div style={{ fontFamily: syne, fontWeight: 800, fontSize: '18px', color: '#F0F0F0', letterSpacing: '-0.5px' }}>{nomeEscola}</div>
              <div style={{ fontSize: '10px', color: neon, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600 }}>Pro</div>
            </div>
          </div>
          <UserButton />
        </div>
        <div style={{ fontSize: '11px', color: muted, marginBottom: '2px' }}>{dia}</div>
        <div style={{ fontFamily: syne, fontSize: '22px', fontWeight: 800, color: '#F0F0F0', lineHeight: 1.1 }}>
          Ola, <span style={{ color: neon }}>Thales</span>
        </div>
      </div>

      {/* METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 20px 16px' }}>
        <div style={{ background: 'rgba(57,255,20,0.07)', borderRadius: '16px', padding: '14px', border: '1px solid rgba(57,255,20,0.2)' }}>
          <div style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Alunos ativos</div>
          <div style={{ fontFamily: syne, fontSize: '26px', fontWeight: 800, color: neon }}>{loading ? '...' : totalAtletas}</div>
          <div style={{ fontSize: '10px', color: muted, marginTop: '4px' }}>cadastrados</div>
        </div>
        {isAdmin && (
          <div style={{ background: inadimplentes > 0 ? 'rgba(255,70,70,0.07)' : cardBg, borderRadius: '16px', padding: '14px', border: inadimplentes > 0 ? '1px solid rgba(255,70,70,0.3)' : cardBorder }}>
            <div style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Inadimplentes</div>
            <div style={{ fontFamily: syne, fontSize: '26px', fontWeight: 800, color: inadimplentes > 0 ? '#ff5555' : neon }}>{loading ? '...' : inadimplentes}</div>
            <div style={{ fontSize: '10px', color: muted, marginTop: '4px' }}>em atraso</div>
          </div>
        )}
        <div style={{ background: cardBg, borderRadius: '16px', padding: '14px', border: cardBorder }}>
          <div style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Presenca hoje</div>
          <div style={{ fontFamily: syne, fontSize: '26px', fontWeight: 800, color: pct >= 75 ? neon : pct > 0 ? gold : muted }}>{loading ? '...' : presencaHoje.total === 0 ? '-' : pct + '%'}</div>
          <div style={{ fontSize: '10px', color: muted, marginTop: '4px' }}>{presencaHoje.total > 0 ? presencaHoje.presentes + ' de ' + presencaHoje.total : 'sem treino'}</div>
        </div>
        {isAdmin && (
          <div style={{ background: 'rgba(212,175,55,0.07)', borderRadius: '16px', padding: '14px', border: '1px solid rgba(212,175,55,0.2)' }}>
            <div style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Receita mes</div>
            <div style={{ fontFamily: syne, fontSize: '26px', fontWeight: 800, color: gold }}>{loading ? '...' : 'R$' + receitaMes.toFixed(0)}</div>
            <div style={{ fontSize: '10px', color: muted, marginTop: '4px' }}>{mes}</div>
          </div>
        )}
      </div>

      {/* FINANCEIRO */}
      {isAdmin && (
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Financeiro</span>
            <a href="/financeiro" style={{ color: neon, fontSize: '10px', textDecoration: 'none', textTransform: 'none', letterSpacing: 0 }}>Ver tudo</a>
          </div>
          <div style={{ background: cardBg, borderRadius: '16px', padding: '14px', border: cardBorder }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: muted }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: neon, boxShadow: '0 0 4px #39FF14' }}></div>Recebido
              </div>
              <span style={{ fontFamily: syne, fontWeight: 700, color: neon, fontSize: '13px' }}>R$ {loading ? '...' : receitaMes.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: muted }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: gold, boxShadow: '0 0 4px #D4AF37' }}></div>A receber
              </div>
              <span style={{ fontFamily: syne, fontWeight: 700, color: gold, fontSize: '13px' }}>R$ {loading ? '...' : totalPendente.toFixed(2)}</span>
            </div>
            {!loading && recTotal > 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,#39FF14,#00cc00)', width: pctRec + '%' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '10px', color: muted }}>
                  <span>{pctRec}% recebido</span><span>{cobrancasMes} cobrancas</span>
                </div>
              </div>
            )}
            {!loading && cobrancasMes === 0 && <p style={{ fontSize: '11px', color: muted, textAlign: 'center', padding: '8px 0' }}>Nenhuma cobranca este mes</p>}
          </div>
        </div>
      )}

      {/* PENDENTES */}
      {isAdmin && pendentes > 0 && (
        <div style={{ padding: '0 20px 14px' }}>
          <a href="/matriculas" style={{ display: 'block', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '16px', padding: '14px', textDecoration: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: gold, fontWeight: 700, fontSize: '13px', fontFamily: syne }}>Pre-matriculas pendentes</p>
                <p style={{ color: muted, fontSize: '11px', marginTop: '3px' }}>{pendentes} aguardam aprovacao</p>
              </div>
              <span style={{ background: neon, color: '#000', fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '20px', fontFamily: syne }}>{pendentes}</span>
            </div>
          </a>
        </div>
      )}

      {/* ACOES */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Acoes rapidas</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { href: '/atletas/novo', icon: 'soccer', label: 'Novo atleta', sub: 'Cadastrar', style: { background: 'rgba(57,255,20,0.07)', border: '1px solid rgba(57,255,20,0.25)' } },
            { href: '/presenca', icon: 'check', label: 'Chamada', sub: 'Presenca', style: { background: cardBg, border: cardBorder } },
            { href: '/turmas', icon: 'users', label: 'Turmas', sub: 'Gerenciar', style: { background: cardBg, border: cardBorder } },
            { href: '/convocacao', icon: 'megaphone', label: 'Convocacoes', sub: 'Escalar', style: { background: cardBg, border: cardBorder } },
            { href: '/campeonato', icon: 'trophy', label: 'Campeonatos', sub: 'Tabelas', style: { background: cardBg, border: cardBorder } },
            { href: '/mensagens', icon: 'message', label: 'Mensagens', sub: 'Comunicar', style: { background: cardBg, border: cardBorder } },
          ].map(item => (
            <a key={item.href} href={item.href} style={{ ...item.style, borderRadius: '14px', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '5px', textDecoration: 'none', color: '#F0F0F0' }}>
              <span style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: '#F0F0F0' }}>{item.label}</span>
              <span style={{ fontSize: '10px', color: muted }}>{item.sub}</span>
            </a>
          ))}
          {isAdmin && (
            <>
              <a href="/financeiro" style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '14px', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '5px', textDecoration: 'none', color: '#F0F0F0' }}>
                <span style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: gold }}>Financeiro</span>
                <span style={{ fontSize: '10px', color: muted }}>Cobrancas</span>
              </a>
              <a href="/matriculas" style={{ background: cardBg, border: cardBorder, borderRadius: '14px', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '5px', textDecoration: 'none', color: '#F0F0F0' }}>
                <span style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px' }}>Matriculas</span>
                {pendentes > 0 ? <span style={{ background: neon, color: '#000', fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '20px', fontFamily: syne, display: 'inline-block', width: 'fit-content' }}>{pendentes} pendentes</span> : <span style={{ fontSize: '10px', color: muted }}>Gerenciar</span>}
              </a>
              <a href="/alteracao-massa" style={{ background: cardBg, border: cardBorder, borderRadius: '14px', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '5px', textDecoration: 'none', color: '#F0F0F0' }}>
                <span style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px' }}>Alteracao em massa</span>
                <span style={{ fontSize: '10px', color: muted }}>Edicao rapida</span>
              </a>
              <a href="/configuracoes" style={{ background: cardBg, border: cardBorder, borderRadius: '14px', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '5px', textDecoration: 'none', color: '#F0F0F0' }}>
                <span style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px' }}>Configuracoes</span>
                <span style={{ fontSize: '10px', color: muted }}>Escola e visual</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* LINK MATRICULA */}
      {isAdmin && (
        <div style={{ padding: '0 20px 24px' }}>
          <div style={{ background: cardBg, borderRadius: '16px', padding: '14px', border: cardBorder }}>
            <p style={{ fontSize: '11px', color: muted, marginBottom: '8px' }}>Link de pre-matricula</p>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', wordBreak: 'break-all', marginBottom: '10px' }}>{linkMatricula}</p>
            <button onClick={copiarLink} style={{ width: '100%', background: copiado ? 'rgba(57,255,20,0.15)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(57,255,20,0.3)', borderRadius: '10px', padding: '10px', color: neon, fontFamily: syne, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
              {copiado ? 'Copiado!' : 'Copiar link de matricula'}
            </button>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '12px 0 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(10px)' }}>
        {[
          { href: '/dashboard', label: 'Inicio', active: true },
          { href: '/atletas', label: 'Atletas', active: false },
          { href: '/presenca', label: 'Presenca', active: false },
        ].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: item.active ? neon : muted, fontFamily: syne, fontWeight: item.active ? 700 : 400 }}>{item.label}</span>
            {item.active && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: neon, boxShadow: '0 0 4px #39FF14' }}></div>}
          </a>
        ))}
        {isAdmin && (
          <a href="/financeiro" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', color: muted, fontFamily: syne }}>Financeiro</span>
          </a>
        )}
      </nav>
    </div>
  )
}
