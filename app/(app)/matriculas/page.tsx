'use client'
import { usePerfil } from '@/lib/usePerfil'
import AdminGuard from '@/components/AdminGuard'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const T = { bg: '#0A0E1A', surface: '#0D1220', primary: '#4169E1', accent: '#00BFFF', text: '#F0F4FF', muted: 'rgba(240,244,255,0.4)', border: 'rgba(240,244,255,0.08)', green: '#00D67A', red: '#FF4444', gold: '#FFD700' }
const SYNE = 'Syne, sans-serif'

type Matricula = { id: string; nomeAtleta: string; dataNascimento: string; cpf: string | null; rg: string | null; posicao: string | null; telefone: string | null; cep: string | null; endereco: string | null; numero: string | null; bairro: string | null; cidade: string | null; estado: string | null; nomeResponsavel: string; whatsappResponsavel: string; emailResponsavel: string | null; nomeAssinatura: string | null; dataAssinatura: string | null; status: string; atletaId: string | null; criadoEm: string }

const STATUS_COR: Record<string, { color: string; bg: string; border: string }> = {
  PENDENTE: { color: T.gold, bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.25)' },
  APROVADO: { color: T.green, bg: `${T.green}12`, border: `${T.green}33` },
  RECUSADO: { color: T.red, bg: 'rgba(255,68,68,0.1)', border: 'rgba(255,68,68,0.25)' },
}

function MatriculasInner() {
  const { escolaId } = usePerfil()
  const [matriculas, setMatriculas] = useState<Matricula[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionada, setSelecionada] = useState<Matricula | null>(null)
  const [processando, setProcessando] = useState(false)
  const [gerandoCobranca, setGerandoCobranca] = useState(false)
  const [valorMensalidade, setValorMensalidade] = useState<number>(100)
  const [filtro, setFiltro] = useState<'PENDENTE' | 'APROVADO' | 'RECUSADO'>('PENDENTE')

  async function carregar() {
    const [{ data }, { data: ed }] = await Promise.all([
      supabase.from('Matricula').select('*').eq('escolaId', escolaId!).order('criadoEm', { ascending: false }),
      supabase.from('Escola').select('valorMensalidade').eq('id', escolaId!).single(),
    ])
    setMatriculas(data || [])
    if (ed?.valorMensalidade) setValorMensalidade(Number(ed.valorMensalidade))
    setLoading(false)
  }

  useEffect(() => { if (escolaId) carregar() }, [escolaId])

  async function aprovar(matricula: Matricula) {
    setProcessando(true)
    const atletaId = crypto.randomUUID()
    const tokenPais = crypto.randomUUID()
    const { error } = await supabase.from('Atleta').insert({ id: atletaId, escolaId: escolaId!, nome: matricula.nomeAtleta, dataNascimento: matricula.dataNascimento, cpf: matricula.cpf, rg: matricula.rg, posicao: matricula.posicao, telefone: matricula.telefone, cep: matricula.cep, endereco: matricula.endereco, numero: matricula.numero, bairro: matricula.bairro, cidade: matricula.cidade, estado: matricula.estado, tokenPais, ativo: true })
    if (error) { alert('Erro: ' + error.message); setProcessando(false); return }
    await supabase.from('Responsavel').insert({ id: crypto.randomUUID(), atletaId, nome: matricula.nomeResponsavel, telefone: matricula.whatsappResponsavel, whatsapp: matricula.whatsappResponsavel, principal: true })
    await supabase.from('Matricula').update({ status: 'APROVADO', atletaId }).eq('id', matricula.id)
    await fetch('/api/whatsapp-aprovacao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ whatsapp: matricula.whatsappResponsavel, nomeResponsavel: matricula.nomeResponsavel, nomeAtleta: matricula.nomeAtleta, tokenPais, tipo: 'aprovacao' }) })
    setSelecionada(null)
    await carregar()
    setProcessando(false)
    alert(`✅ ${matricula.nomeAtleta} aprovado!`)
  }

  async function recusar(matricula: Matricula) {
    setProcessando(true)
    await fetch('/api/whatsapp-aprovacao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ whatsapp: matricula.whatsappResponsavel, nomeResponsavel: matricula.nomeResponsavel, nomeAtleta: matricula.nomeAtleta, tokenPais: '', tipo: 'recusa' }) })
    await supabase.from('Matricula').update({ status: 'RECUSADO' }).eq('id', matricula.id)
    setSelecionada(null)
    await carregar()
    setProcessando(false)
  }

  async function gerarCobrancaAtleta(atletaId: string, nome: string) {
    setGerandoCobranca(true)
    const vencimento = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0]
    const res = await fetch('/api/cobranca', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ atletaId, valor: valorMensalidade, vencimento, descricao: 'Mensalidade', desconto: { value: 15, dueDateLimitDays: 0, type: 'FIXED' } }) })
    const data = await res.json()
    alert(data.sucesso ? `Cobrança gerada para ${nome}!` : 'Erro: ' + JSON.stringify(data))
    setGerandoCobranca(false)
  }

  const filtradas = matriculas.filter(m => m.status === filtro)
  const pendentes = matriculas.filter(m => m.status === 'PENDENTE').length
  const INF = (label: string, value: string | null | undefined) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.muted }}>{label}</span>
      <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{value || '—'}</span>
    </div>
  )

  if (selecionada) {
    const st = STATUS_COR[selecionada.status]
    return (
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '20px 20px 80px', fontFamily: 'Inter, sans-serif' }}>        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setSelecionada(null)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-arrow-left" aria-hidden="true"></i> Voltar
          </button>
          <h1 style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 20, color: T.text, textTransform: 'uppercase' }}>Pré-matrícula</h1>
          <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 4, textTransform: 'uppercase' }}>{selecionada.status}</span>
        </div>

        {[
          { title: 'Dados do Atleta', fields: [['Nome', selecionada.nomeAtleta], ['Nascimento', new Date(selecionada.dataNascimento).toLocaleDateString('pt-BR')], ['CPF', selecionada.cpf], ['RG', selecionada.rg], ['Posição', selecionada.posicao], ['Telefone', selecionada.telefone]] },
          { title: 'Responsável', fields: [['Nome', selecionada.nomeResponsavel], ['WhatsApp', selecionada.whatsappResponsavel], ['E-mail', selecionada.emailResponsavel]] },
          { title: 'Assinatura Digital', fields: [['Assinado por', selecionada.nomeAssinatura], ['Data', selecionada.dataAssinatura ? new Date(selecionada.dataAssinatura).toLocaleString('pt-BR') : null], ['Contrato aceito', 'Sim']] },
        ].map(sec => (
          <div key={sec.title} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.primary}`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
            <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 11, color: T.primary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{sec.title}</p>
            {sec.fields.map(([l, v]) => INF(l as string, v as string))}
          </div>
        ))}

        {selecionada.status === 'PENDENTE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
            <button onClick={() => aprovar(selecionada)} disabled={processando} style={{ background: T.primary, color: T.text, padding: 16, borderRadius: 8, fontFamily: SYNE, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5, opacity: processando ? 0.6 : 1 }}>
              {processando ? 'Processando...' : '✅ Aprovar e notificar WhatsApp'}
            </button>
            <button onClick={() => recusar(selecionada)} disabled={processando} style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', color: T.red, padding: 14, borderRadius: 8, fontFamily: SYNE, fontWeight: 700, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase' }}>
              ❌ Recusar
            </button>
          </div>
        )}
        {selecionada.status === 'APROVADO' && (
          <div style={{ background: `${T.green}08`, border: `1px solid ${T.green}25`, borderRadius: 8, padding: 16, textAlign: 'center', marginTop: 20 }}>
            <p style={{ color: T.green, fontFamily: SYNE, fontWeight: 800, marginBottom: 12, textTransform: 'uppercase' }}>Matrícula aprovada</p>
            <button onClick={() => gerarCobrancaAtleta(selecionada.atletaId || '', selecionada.nomeAtleta)} disabled={gerandoCobranca || !selecionada.atletaId} style={{ background: T.primary, color: T.text, padding: '13px 20px', borderRadius: 8, fontFamily: SYNE, fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', textTransform: 'uppercase', opacity: gerandoCobranca ? 0.6 : 1 }}>
              {gerandoCobranca ? 'Gerando...' : 'Gerar Cobrança PIX'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '0 0 80px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: T.primary, padding: '20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Gestão</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 26, color: T.text, letterSpacing: -0.8, textTransform: 'uppercase' }}>Pré-matrículas</div>
              {pendentes > 0 && <span style={{ background: T.gold, color: '#0A0A00', fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 4, fontFamily: SYNE }}>{pendentes}</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 20px 10px', display: 'flex', gap: 8 }}>
        {(['PENDENTE', 'APROVADO', 'RECUSADO'] as const).map(s => {
          const st = STATUS_COR[s]
          const ativo = filtro === s
          return (
            <button key={s} onClick={() => setFiltro(s)} style={{ padding: '7px 14px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: SYNE, textTransform: 'uppercase', letterSpacing: 0.5, border: `1px solid ${ativo ? st.border : T.border}`, background: ativo ? st.bg : 'transparent', color: ativo ? st.color : T.muted }}>
              {s} ({matriculas.filter(m => m.status === s).length})
            </button>
          )
        })}
      </div>

      <div style={{ padding: '0 20px' }}>
        {loading && <p style={{ color: T.muted, textAlign: 'center', padding: 40, fontSize: 13 }}>Carregando...</p>}
        {!loading && filtradas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <i className="ti ti-clipboard-list" style={{ fontSize: 48, color: T.border, display: 'block', marginBottom: 12 }} aria-hidden="true"></i>
            <p style={{ fontSize: 13, color: T.muted }}>Nenhuma pré-matrícula {filtro.toLowerCase()}</p>
          </div>
        )}
        {filtradas.map(m => {
          const st = STATUS_COR[m.status]
          return (
            <button key={m.id} onClick={() => setSelecionada(m)} style={{ width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, textAlign: 'left', cursor: 'pointer', marginBottom: 8, display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 14, color: T.text, margin: '0 0 3px', textTransform: 'uppercase' }}>{m.nomeAtleta}</p>
                  <p style={{ fontSize: 11, color: T.muted, margin: '0 0 2px' }}>{m.posicao || 'Sem posição'} · {m.cidade || 'Sem cidade'}</p>
                  <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Resp: {m.nomeResponsavel}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: st.color, background: st.bg, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{m.status}</span>
                  <span style={{ fontSize: 10, color: T.muted }}>{new Date(m.criadoEm).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px', borderTop: `1px solid ${T.border}`, background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        {[{ href: '/dashboard', label: 'Início', icon: 'ti-home' }, { href: '/atletas', label: 'Atletas', icon: 'ti-users' }, { href: '/presenca', label: 'Presença', icon: 'ti-check' }, { href: '/financeiro/caixa', label: 'Financeiro', icon: 'ti-wallet' }].map(item => (
          <a key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 22, color: T.muted }} aria-hidden="true"></i>
            <span style={{ fontSize: 9, fontFamily: SYNE, fontWeight: 700, color: T.muted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}

export default function Matriculas(props: any) {
  return <AdminGuard><MatriculasInner {...props} /></AdminGuard>
}
