'use client'
import { useEffect, useState, useTransition } from 'react'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/ui/BottomNav'
import { getMatriculas, aprovarMatricula, recusarMatricula, preGerarRestante } from './actions'

const T = { bg: '#0A0E1A', surface: '#0D1220', primary: '#4169E1', accent: '#00BFFF', text: '#F0F4FF', muted: 'rgba(240,244,255,0.4)', border: 'rgba(240,244,255,0.08)', green: '#00D67A', red: '#FF4444', gold: '#FFD700' }
const SYNE = 'Syne, sans-serif'
type Matricula = { id: string; nomeAtleta: string; dataNascimento: string; cpf: string | null; rg: string | null; posicao: string | null; telefone: string | null; cep: string | null; endereco: string | null; numero: string | null; bairro: string | null; cidade: string | null; estado: string | null; nomeResponsavel: string; whatsappResponsavel: string; emailResponsavel: string | null; nomeAssinatura: string | null; dataAssinatura: string | null; status: string; atletaId: string | null; criadoEm: string }
const STATUS_COR: Record<string, { color: string; bg: string; border: string }> = {
  PENDENTE: { color: T.gold, bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.25)' },
  APROVADO: { color: T.green, bg: `${T.green}12`, border: `${T.green}33` },
  RECUSADO: { color: T.red, bg: 'rgba(255,68,68,0.1)', border: 'rgba(255,68,68,0.25)' },
}

function MatriculasInner() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([])
  const [escolaId, setEscolaId] = useState('')
  const [valorMensalidade, setValorMensalidade] = useState(100)
  const [selecionada, setSelecionada] = useState<Matricula | null>(null)
  const [filtro, setFiltro] = useState<'PENDENTE' | 'APROVADO' | 'RECUSADO'>('PENDENTE')
  const [loading, startLoad] = useTransition()
  const [processando, startProcess] = useTransition()
  const [gerandoCobranca, setGerandoCobranca] = useState(false)
  const [painelCobranca, setPainelCobranca] = useState(false)
  const [valorCobranca, setValorCobranca] = useState(85)
  const [diaVencCobranca, setDiaVencCobranca] = useState(10)
  const [dataVencCobranca, setDataVencCobranca] = useState(() => {
    const d = new Date(); d.setDate(10)
    return d.toISOString().slice(0,10)
  })
  const [taxaMatricula, setTaxaMatricula] = useState(0)
  const [pixResultado, setPixResultado] = useState<{ pixCopiaCola: string; pixQrCode: string; valor: number; vencimento: string } | null>(null)

  function carregar() {
    startLoad(async () => {
      const d = await getMatriculas()
      setEscolaId(d.escolaId)
      setMatriculas(d.matriculas as Matricula[])
      setValorMensalidade(d.valorMensalidade)
      // taxa vem da configuracao da escola; o admin pode sobrescrever no modal
      if (typeof d.valorMatricula === 'number') setTaxaMatricula(d.valorMatricula)
    })
  }
  useEffect(() => { carregar() }, [])

  function aprovar(matricula: Matricula) {
    startProcess(async () => {
      try {
        const { atletaId, tokenPais } = await aprovarMatricula(matricula.id, escolaId, {
          nome: matricula.nomeAtleta, dataNascimento: matricula.dataNascimento, cpf: matricula.cpf,
          rg: matricula.rg, posicao: matricula.posicao, telefone: matricula.telefone, cep: matricula.cep,
          endereco: matricula.endereco, numero: matricula.numero, bairro: matricula.bairro,
          cidade: matricula.cidade, estado: matricula.estado,
          nomeResponsavel: matricula.nomeResponsavel, whatsappResponsavel: matricula.whatsappResponsavel,
        })
        await fetch('/api/whatsapp-aprovacao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ whatsapp: matricula.whatsappResponsavel, nomeResponsavel: matricula.nomeResponsavel, nomeAtleta: matricula.nomeAtleta, tokenPais, tipo: 'aprovacao', escolaId }) })
        setSelecionada(null); carregar()
        alert(`✅ ${matricula.nomeAtleta} aprovado!`)
      } catch (e: unknown) { alert('Erro: ' + (e instanceof Error ? e.message : String(e))) }
    })
  }

  function recusar(matricula: Matricula) {
    startProcess(async () => {
      await fetch('/api/whatsapp-aprovacao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ whatsapp: matricula.whatsappResponsavel, nomeResponsavel: matricula.nomeResponsavel, nomeAtleta: matricula.nomeAtleta, tokenPais: '', tipo: 'recusa', escolaId }) })
      await recusarMatricula(matricula.id)
      setSelecionada(null); carregar()
    })
  }

  async function gerarCobrancaAtleta(atletaId: string, nome: string) {
    setGerandoCobranca(true)
    try {
      const diaExtraido = Number(dataVencCobranca.slice(8, 10))
      // Salva diaVencimento e valorMensalidade no atleta
      await fetch('/api/atletas/atualizar-pagamento', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atletaId, diaVencimento: diaExtraido, valorMensalidade: valorCobranca })
      })
      const valorTotal = valorCobranca + (taxaMatricula || 0)
      const descricao = taxaMatricula > 0
        ? `Mensalidade + Taxa de matrícula (R$${taxaMatricula.toFixed(0)})`
        : 'Mensalidade'
      const res = await fetch('/api/cobranca', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atletaId, valor: valorTotal, vencimento: dataVencCobranca, descricao })
      })
      const data = await res.json()
      if (data.sucesso) {
        // 1a cobranca criada (com a taxa de matricula). Agora pre-gera os meses
        // seguintes ja com o valor configurado — sem a taxa, que so entra uma vez.
        let extras = 0
        try {
          const pre = await preGerarRestante(atletaId, valorCobranca, diaExtraido)
          extras = pre.geradas || 0
        } catch { /* a 1a cobranca ja esta criada; nao bloqueia o fluxo */ }

        if (data.pixCopiaCola) {
          setPixResultado({ pixCopiaCola: data.pixCopiaCola, pixQrCode: data.pixQrCode, valor: valorTotal, vencimento: dataVencCobranca })
        } else {
          alert(`✅ Cobrança gerada para ${nome}!` + (extras ? `\n\n+ ${extras} mensalidades dos próximos meses.` : ''))
        }
        setPainelCobranca(false)
      } else {
        alert('Erro: ' + (data.error || JSON.stringify(data)))
      }
    } catch (err) { alert('Erro: ' + String(err)) }
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
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '20px 20px 80px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
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
          <div style={{ background: `${T.green}08`, border: `1px solid ${T.green}25`, borderRadius: 8, padding: 16, marginTop: 20 }}>
            <p style={{ color: T.green, fontFamily: SYNE, fontWeight: 800, marginBottom: 16, textTransform: 'uppercase', textAlign: 'center' }}>✅ Matrícula aprovada</p>
            {!painelCobranca ? (
              <button onClick={() => setPainelCobranca(true)}
                style={{ width: '100%', background: T.primary, color: T.text, padding: '13px 20px', borderRadius: 8, fontFamily: SYNE, fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
                💰 Gerar 1ª mensalidade
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 12, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Configure a mensalidade</p>
                <div>
                  <label style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 4, fontFamily: SYNE, fontWeight: 700 }}>Valor da mensalidade (R$)</label>
                  <input type="number" value={valorCobranca} onChange={e => setValorCobranca(Number(e.target.value))}
                    style={{ width: '100%', background: '#080C15', border: '1px solid rgba(240,244,255,0.15)', borderRadius: 8, padding: '12px 14px', color: T.text, fontSize: 15, fontWeight: 700, boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 4, fontFamily: SYNE, fontWeight: 700 }}>Taxa de matrícula (R$) — opcional</label>
                  <input type="number" value={taxaMatricula} onChange={e => setTaxaMatricula(Number(e.target.value))} min={0}
                    placeholder="0 = sem taxa"
                    style={{ width: '100%', background: '#080C15', border: '1px solid rgba(240,244,255,0.15)', borderRadius: 8, padding: '12px 14px', color: T.text, fontSize: 15, fontWeight: 700, boxSizing: 'border-box' as const }} />
                  <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.3)', margin: '4px 0 0' }}>Será somada na 1ª mensalidade e não volta a ser cobrada</p>
                </div>
                <div>
                  <label style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 4, fontFamily: SYNE, fontWeight: 700 }}>Data de vencimento da 1ª cobrança</label>
                  <input type="date" value={dataVencCobranca} onChange={e => {
                    setDataVencCobranca(e.target.value)
                    setDiaVencCobranca(Number(e.target.value.slice(8,10)))
                  }}
                    style={{ width: '100%', background: '#080C15', border: '1px solid rgba(240,244,255,0.15)', borderRadius: 8, padding: '12px 14px', color: T.text, fontSize: 14, boxSizing: 'border-box' as const }} />
                  <p style={{ fontSize: 10, color: 'rgba(240,244,255,0.3)', margin: '4px 0 0' }}>
                    O dia {'{'}diaVencCobranca || 10{'}'} será o vencimento fixo nos meses seguintes
                  </p>
                </div>
                <div style={{ background: 'rgba(65,105,225,0.08)', border: '1px solid rgba(65,105,225,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ fontSize: 11, color: '#7DD3FC', margin: '0 0 4px', fontWeight: 700 }}>Resumo da 1ª cobrança:</p>
                  <p style={{ fontSize: 12, color: T.text, margin: 0 }}>
                    Mensalidade: R$ {valorCobranca.toFixed(2)}
                    {taxaMatricula > 0 && ` + Taxa matrícula: R$ ${taxaMatricula.toFixed(2)}`}
                    {` = `}<strong style={{ color: '#00D67A' }}>R$ {(valorCobranca + (taxaMatricula || 0)).toFixed(2)}</strong>
                  </p>
                  <p style={{ fontSize: 10, color: T.muted, margin: '4px 0 0' }}>A partir do 2º mês: R$ {valorCobranca.toFixed(2)} · Todo dia {diaVencCobranca || 10}</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setPainelCobranca(false)}
                    style={{ flex: 1, background: 'transparent', border: '1px solid rgba(240,244,255,0.1)', color: T.muted, padding: 12, borderRadius: 8, cursor: 'pointer', fontFamily: SYNE, fontWeight: 700, fontSize: 13 }}>
                    Cancelar
                  </button>
                  <button onClick={() => gerarCobrancaAtleta(selecionada.atletaId || '', selecionada.nomeAtleta)}
                    disabled={gerandoCobranca || !selecionada.atletaId || valorCobranca <= 0}
                    style={{ flex: 2, background: T.primary, color: T.text, padding: 12, borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: SYNE, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', opacity: gerandoCobranca ? 0.6 : 1 }}>
                    {gerandoCobranca ? 'Gerando...' : `⚡ Gerar PIX — R$ ${(valorCobranca + (taxaMatricula || 0)).toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* RESULTADO PIX */}
        {pixResultado && (
          <div style={{ background: `${T.green}08`, border: `1px solid ${T.green}30`, borderRadius: 12, padding: 18, marginTop: 16 }}>
            <p style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 14, color: T.green, textTransform: 'uppercase', margin: '0 0 12px', textAlign: 'center' }}>✅ PIX gerado!</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: T.muted }}>Valor</span>
              <span style={{ fontSize: 14, color: T.green, fontWeight: 800 }}>R$ {pixResultado.valor.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: T.muted }}>Vencimento</span>
              <span style={{ fontSize: 12, color: T.text }}>{new Date(pixResultado.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
            </div>
            {pixResultado.pixQrCode && (
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <img src={`data:image/png;base64,${pixResultado.pixQrCode}`} alt="QR Code" style={{ width: 160, height: 160, borderRadius: 8, background: 'white', padding: 8, display: 'block', margin: '0 auto' }} />
              </div>
            )}
            <div style={{ background: '#080C15', border: '1px solid rgba(0,214,122,0.2)', borderRadius: 8, padding: 12, marginBottom: 12, wordBreak: 'break-all', fontSize: 11, color: T.green, fontFamily: 'monospace' }}>
              {pixResultado.pixCopiaCola}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { navigator.clipboard.writeText(pixResultado.pixCopiaCola); alert('Código PIX copiado!') }}
                style={{ flex: 2, background: T.green, color: '#000', padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: SYNE, fontWeight: 900, fontSize: 13, textTransform: 'uppercase' }}>
                📋 Copiar PIX
              </button>
              <button onClick={() => setPixResultado(null)}
                style={{ flex: 1, background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, padding: '13px', borderRadius: 10, cursor: 'pointer', fontFamily: SYNE, fontWeight: 700, fontSize: 12 }}>
                Fechar
              </button>
            </div>
          </div>
        )}

        <BottomNav />
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
          const st = STATUS_COR[s]; const ativo = filtro === s
          return <button key={s} onClick={() => setFiltro(s)} style={{ padding: '7px 14px', borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: SYNE, textTransform: 'uppercase', letterSpacing: 0.5, border: `1px solid ${ativo ? st.border : T.border}`, background: ativo ? st.bg : 'transparent', color: ativo ? st.color : T.muted }}>{s} ({matriculas.filter(m => m.status === s).length})</button>
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
      <BottomNav />
    </div>
  )
}

export default function Matriculas() {
  return <AdminGuard><MatriculasInner /></AdminGuard>
}
