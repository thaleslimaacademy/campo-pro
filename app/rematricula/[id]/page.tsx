'use client'
import { usePerfil } from '@/lib/usePerfil'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { enviarRematricula } from './actions'

const CONTRATO = `CONTRATO DE RENOVAÇÃO DE SERVIÇOS ESPORTIVOS
ASSOCIAÇÃO ESPORTIVA THALES LIMA FOOTBALL ACADEMY

CLÁUSULA 1 — DO OBJETO
O presente contrato tem por objeto a renovação dos serviços de treinamento e formação esportiva na modalidade futebol, oferecidos pela Associação Esportiva Thales Lima Football Academy, doravante denominada ACADEMY, ao atleta identificado nesta ficha de rematrícula.

CLÁUSULA 2 — DA RENOVAÇÃO E MENSALIDADE
2.1 A renovação da matrícula do ATLETA somente será confirmada após a assinatura deste contrato e aprovação pelo responsável da ACADEMY.
2.2 O valor da mensalidade será informado no ato da renovação e poderá ser reajustado anualmente, mediante aviso prévio de 30 (trinta) dias.
2.3 O vencimento da mensalidade ocorrerá todo dia 10 de cada mês.
2.4 Em caso de não pagamento até a data de vencimento, incidirão:
- Multa de 2% (dois por cento) sobre o valor da mensalidade
- Juros de mora de 1% (um por cento) ao mês, calculados pro rata die
2.5 O atraso superior a 60 (sessenta) dias poderá acarretar a suspensão do ATLETA das atividades.
2.6 O atraso superior a 90 (noventa) dias implicará no cancelamento automático da matrícula.

CLÁUSULA 3 — DO CANCELAMENTO E DESISTÊNCIA
3.1 O cancelamento deverá ser comunicado por escrito com antecedência mínima de 30 (trinta) dias.
3.2 Não haverá devolução de mensalidades já pagas.

CLÁUSULA 4 — DAS OBRIGAÇÕES DO CONTRATANTE
4.1 Manter os dados cadastrais sempre atualizados.
4.2 Informar qualquer condição de saúde ou limitação física do ATLETA.
4.3 Responsabilizar-se pelo transporte do ATLETA até o local de treinamento.
4.4 Tratar com respeito todos os treinadores, funcionários e demais atletas.

CLÁUSULA 5 — DO DIREITO DE IMAGEM E VOZ
5.1 O CONTRATANTE autoriza, em caráter gratuito, irrevogável e por prazo indeterminado, o uso da imagem e nome do ATLETA pela ACADEMY para fins de divulgação nas redes sociais e material promocional.

CLÁUSULA 6 — DO FORO
As partes elegem o foro da Comarca de Iturama - MG para dirimir quaisquer dúvidas ou litígios.

CLÁUSULA 7 — DA ASSINATURA DIGITAL
Este contrato é celebrado em meio digital, tendo plena validade jurídica nos termos da MP nº 2.200-2/2001 e do Marco Civil da Internet (Lei nº 12.965/2014).`

// ── Painel de Assinatura ──
function PainelAssinatura({ onAssinar, disabled }: { onAssinar: (img: string) => void, disabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const desenhando = useRef(false)
  const [temAssinatura, setTemAssinatura] = useState(false)

  const syne = 'Syne, sans-serif'
  const neon = '#4169E1'
  const gold = '#D4AF37'

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#0A0E1A'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#4169E1'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY }
  }

  function iniciar(e: React.TouchEvent | React.MouseEvent) {
    if (disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    desenhando.current = true
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function desenhar(e: React.TouchEvent | React.MouseEvent) {
    if (!desenhando.current || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setTemAssinatura(true)
  }

  function parar() { desenhando.current = false }

  function limpar() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#0A0E1A'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setTemAssinatura(false)
  }

  function confirmar() {
    const canvas = canvasRef.current
    if (!canvas) return
    onAssinar(canvas.toDataURL('image/png'))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Assine com o dedo *</label>
        {temAssinatura && (
          <button onClick={limpar} type="button" style={{ fontSize: '11px', color: '#ff5555', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Limpar</button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        style={{ width: '100%', borderRadius: '12px', border: '1.5px dashed rgba(65,105,225,0.4)', touchAction: 'none', display: 'block', background: '#0A0E1A' }}
        onMouseDown={iniciar}
        onMouseMove={desenhar}
        onMouseUp={parar}
        onMouseLeave={parar}
        onTouchStart={iniciar}
        onTouchMove={desenhar}
        onTouchEnd={parar}
      />
      {!temAssinatura && (
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '8px' }}>
          ✍️ Use o dedo para assinar
        </p>
      )}
      {temAssinatura && (
        <button
          type="button"
          onClick={confirmar}
          style={{ width: '100%', marginTop: '12px', background: 'linear-gradient(135deg,#4169E1,#1A3FA8)', color: '#F0F4FF', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: 'pointer' }}
        >
          Usar esta assinatura ✓
        </button>
      )}
    </div>
  )
}

// ── Página principal ──
export default function Rematricula() {
  const { escolaId } = usePerfil()
  const params = useParams()
  const id = params.id as string

  const [atleta, setAtleta] = useState<any>(null)
  const [responsavel, setResponsavel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [etapa, setEtapa] = useState<'form' | 'contrato' | 'sucesso'>('form')
  const [salvando, setSalvando] = useState(false)
  const [contratoLido, setContratoLido] = useState(false)
  const [aceito, setAceito] = useState(false)
  const [assinaturaImg, setAssinaturaImg] = useState<string | null>(null)
  const [nomeAssinatura, setNomeAssinatura] = useState('')
  const [erros, setErros] = useState<string[]>([])
  const [form, setForm] = useState({
    nomeResponsavel: '',
    cpfResponsavel: '',
    whatsapp: '',
    email: '',
    telefoneAtleta: '',
    posicao: '',
    // endereco
    cep: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '',
    // 2o responsavel
    nomeResponsavel2: '', whatsappResponsavel2: '', parentesco2: '',
    // novos
    tamanhoUniforme: '',
    autorizacaoImagem: false,
  })

  // Tokens visuais
  const syne = 'Syne, sans-serif'
  const neon = '#4169E1'
  const gold = '#D4AF37'
  const cardBg = 'rgba(255,255,255,0.03)'
  const cardBorder = '1px solid rgba(255,255,255,0.07)'
  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 14px', color: '#F0F0F0', fontFamily: 'Inter,sans-serif', fontSize: '13px', marginTop: '4px', outline: 'none', boxSizing: 'border-box' as const }

  useEffect(() => {
    async function carregar() {
      const { data: at } = await supabase.from('Atleta').select('*').eq('id', id).single()
      setAtleta(at)
      if (at) {
        const { data: resp } = await supabase.from('Responsavel').select('*').eq('atletaId', id).single()
        setResponsavel(resp)
        setForm({
          nomeResponsavel: resp?.nome || '',
          cpfResponsavel: resp?.cpf || '',
          whatsapp: resp?.whatsapp || '',
          email: resp?.email || '',
          telefoneAtleta: at.telefone || '',
          posicao: at.posicao || 'Goleiro',
          cep: at.cep || '', endereco: at.endereco || '', numero: at.numero || '',
          bairro: at.bairro || '', cidade: at.cidade || '', estado: at.estado || '',
          nomeResponsavel2: '', whatsappResponsavel2: '', parentesco2: '',
          tamanhoUniforme: at.tamanhoUniforme || '',
          autorizacaoImagem: at.autorizacaoImagem || false,
        })
        setNomeAssinatura(resp?.nome || '')
      }
      setLoading(false)
    }
    carregar()
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm(prev => ({ ...prev, [name]: val }))
    setErros([])
  }

  function avancarContrato(e: React.FormEvent) {
    e.preventDefault()
    const novosErros: string[] = []
    if (!form.nomeResponsavel.trim()) novosErros.push('Nome do responsável é obrigatório.')
    if (!form.cpfResponsavel.trim()) novosErros.push('CPF do responsável é obrigatório.')
    if (!form.whatsapp.trim()) novosErros.push('WhatsApp é obrigatório.')
    if (novosErros.length > 0) { setErros(novosErros); return }
    setErros([])
    setEtapa('contrato')
    window.scrollTo(0, 0)
  }

  async function confirmarRematricula() {
    if (!aceito || !assinaturaImg || !nomeAssinatura.trim()) return
    setSalvando(true)
    try {
      await enviarRematricula({
        escolaId: escolaId!,
        atletaId: atleta.id,
        nomeAtleta: atleta.nome,
        dataNascimento: atleta.dataNascimento || null,
        cpf: atleta.cpf || null,
        rg: atleta.rg || null,
        posicao: form.posicao,
        telefone: form.telefoneAtleta || null,
        nomeResponsavel: form.nomeResponsavel,
        whatsappResponsavel: form.whatsapp,
        emailResponsavel: form.email || null,
        cpfResponsavel: form.cpfResponsavel,
        cep: form.cep || null, endereco: form.endereco || null, numero: form.numero || null,
        bairro: form.bairro || null, cidade: form.cidade || null, estado: form.estado || null,
        nomeResponsavel2: form.nomeResponsavel2 || null,
        whatsappResponsavel2: form.whatsappResponsavel2 || null,
        parentesco2: form.parentesco2 || null,
        tamanhoUniforme: form.tamanhoUniforme || null,
        autorizacaoImagem: form.autorizacaoImagem,
        nomeAssinatura: nomeAssinatura.trim(),
      })
      setEtapa('sucesso')
    } catch (err) {
      setErros(['Erro ao enviar a rematrícula: ' + (err as Error).message + '. Tente novamente.'])
      setEtapa('form')
      window.scrollTo(0, 0)
    }
    setSalvando(false)
  }

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0A0E1A,#0A0E1A,#0d1430)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter,sans-serif' }}>Carregando...</p>
    </div>
  )

  if (!atleta) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0A0E1A,#0A0E1A,#0d1430)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Atleta não encontrado.</p>
    </div>
  )

  // ── Etapa: Sucesso ──
  if (etapa === 'sucesso') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0A0E1A,#0A0E1A,#0d1430)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', color: '#F0F0F0' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
      <h2 style={{ fontFamily: syne, fontWeight: 800, fontSize: '26px', color: neon, margin: '0 0 8px' }}>Rematrícula enviada!</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Recebemos a solicitação de renovação.</p>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '24px' }}>
        A equipe da <span style={{ color: neon, fontWeight: 700 }}>Thales Lima Football Academy</span> irá confirmar em breve.
      </p>
      <div style={{ background: cardBg, border: '1px solid rgba(65,105,225,0.2)', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '360px', textAlign: 'left' }}>
        <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: neon, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Próximos passos</p>
        {['Nossa equipe analisa a renovação', 'Você recebe confirmação via WhatsApp', 'Matrícula renovada para o próximo período'].map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontFamily: syne, fontWeight: 800, fontSize: '12px', color: gold, minWidth: '18px' }}>{i + 1}.</span>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>{step}</p>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Etapa: Contrato ──
  if (etapa === 'contrato') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0A0E1A,#0A0E1A,#0d1430)', color: '#F0F0F0', fontFamily: 'Inter,sans-serif', padding: '20px', paddingBottom: '40px' }}>

      {/* Header contrato */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => setEtapa('form')} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← Voltar</button>
        <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: '20px', margin: 0 }}>Contrato de Renovação</h1>
      </div>

      {/* Card atleta */}
      <div style={{ background: 'rgba(65,105,225,0.05)', border: '1px solid rgba(65,105,225,0.2)', borderRadius: '14px', padding: '14px', marginBottom: '14px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Renovação de Matrícula</p>
        <p style={{ fontFamily: syne, fontWeight: 800, fontSize: '18px', color: '#F0F0F0', margin: '0 0 2px' }}>{atleta.nome}</p>
        <p style={{ fontSize: '12px', color: gold, margin: 0 }}>Thales Lima Football Academy</p>
      </div>

      {/* Texto do contrato */}
      <div
        style={{ background: 'rgba(255,255,255,0.02)', border: cardBorder, borderRadius: '14px', padding: '16px', marginBottom: '14px', height: '280px', overflowY: 'auto' }}
        onScroll={e => {
          const el = e.currentTarget
          if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) setContratoLido(true)
        }}
      >
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'Inter,sans-serif', fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', margin: 0 }}>{CONTRATO}</pre>
        {contratoLido && (
          <p style={{ color: neon, textAlign: 'center', marginTop: '16px', fontWeight: 700, fontSize: '13px' }}>✓ Contrato lido!</p>
        )}
      </div>

      {!contratoLido && (
        <p style={{ color: gold, fontSize: '11px', textAlign: 'center', marginBottom: '12px' }}>
          ↓ Role até o final para habilitar a assinatura
        </p>
      )}

      {/* Painel de assinatura */}
      <div style={{ background: cardBg, border: contratoLido ? '1px solid rgba(65,105,225,0.2)' : cardBorder, borderRadius: '14px', padding: '16px', marginBottom: '14px', opacity: contratoLido ? 1 : 0.4, pointerEvents: contratoLido ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
        <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '12px', color: neon, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>✍️ Assinatura Digital</p>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Nome completo do responsável *</label>
          <input
            value={nomeAssinatura}
            onChange={e => setNomeAssinatura(e.target.value)}
            type="text"
            style={inputStyle}
          />
        </div>

        <PainelAssinatura disabled={!contratoLido} onAssinar={(img) => setAssinaturaImg(img)} />

        {assinaturaImg && (
          <div style={{ marginTop: '14px', border: '1px solid rgba(65,105,225,0.25)', borderRadius: '12px', padding: '12px', background: 'rgba(65,105,225,0.04)' }}>
            <p style={{ fontSize: '11px', color: neon, marginBottom: '8px' }}>✓ Assinatura capturada</p>
            <img src={assinaturaImg} alt="Assinatura" style={{ width: '100%', borderRadius: '8px', maxHeight: '96px', objectFit: 'contain', background: '#0A0E1A', display: 'block' }} />
            <button onClick={() => setAssinaturaImg(null)} type="button" style={{ fontSize: '11px', color: '#ff5555', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginTop: '8px' }}>Refazer assinatura</button>
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginTop: '16px' }}>
          <input type="checkbox" checked={aceito} onChange={e => setAceito(e.target.checked)} style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: neon }} />
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>Li e concordo com todos os termos do contrato de renovação.</span>
        </label>

        {assinaturaImg && aceito && nomeAssinatura && (
          <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Assinado por: <span style={{ color: '#F0F0F0', fontWeight: 700 }}>{nomeAssinatura}</span></p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        )}
      </div>

      <button
        onClick={confirmarRematricula}
        disabled={!aceito || !assinaturaImg || !nomeAssinatura.trim() || salvando}
        style={{ width: '100%', background: (!aceito || !assinaturaImg || !nomeAssinatura.trim() || salvando) ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#4169E1,#1A3FA8)', color: (!aceito || !assinaturaImg || !nomeAssinatura.trim() || salvando) ? 'rgba(255,255,255,0.3)' : '#050505', padding: '16px', borderRadius: '14px', fontWeight: 800, fontSize: '15px', fontFamily: syne, border: 'none', cursor: (!aceito || !assinaturaImg || !nomeAssinatura.trim() || salvando) ? 'not-allowed' : 'pointer', transition: 'all 0.3s' }}
      >
        {salvando ? 'Enviando...' : 'Confirmar Rematrícula →'}
      </button>
    </div>
  )

  // ── Etapa: Form ──
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0A0E1A,#0A0E1A,#0d1430)', color: '#F0F0F0', fontFamily: 'Inter,sans-serif', paddingBottom: '48px' }}>

      {/* Header */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '32px 20px 24px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '240px', height: '80px', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.12, background: neon }} />
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(65,105,225,0.08)', border: '1px solid rgba(65,105,225,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', margin: '0 auto 10px' }}>🔄</div>
          <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: '18px', color: neon, margin: '0 0 4px' }}>Thales Lima Football Academy</h1>
          <span style={{ display: 'inline-block', fontSize: '11px', color: gold, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '20px', padding: '2px 10px', letterSpacing: '0.05em' }}>Renovação de Matrícula</span>
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Card atleta */}
        <div style={{ background: cardBg, border: '1px solid rgba(212,175,55,0.2)', borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Atleta</p>
          <p style={{ fontFamily: syne, fontWeight: 800, fontSize: '17px', color: '#F0F0F0', margin: '0 0 4px' }}>{atleta.nome}</p>
          {atleta.dataNascimento && (
            <p style={{ fontSize: '12px', color: gold, margin: '0 0 2px' }}>
              {new Date(atleta.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
          )}
          {atleta.cpf && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '1px 0' }}>CPF: {atleta.cpf}</p>}
          {atleta.rg && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '1px 0' }}>RG: {atleta.rg}</p>}
        </div>

        {/* Erros */}
        {erros.length > 0 && (
          <div style={{ background: 'rgba(255,60,60,0.07)', border: '1px solid rgba(255,60,60,0.25)', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
            {erros.map((erro, i) => (
              <p key={i} style={{ color: '#ff5555', fontSize: '13px', fontWeight: 700, margin: i > 0 ? '6px 0 0' : '0' }}>❌ {erro}</p>
            ))}
          </div>
        )}

        {/* Form */}
        <form onSubmit={avancarContrato} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '11px', color: neon, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Dados do Atleta</p>

          <div>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Posição</label>
            <select name="posicao" value={form.posicao} onChange={handleChange} style={{ ...inputStyle, appearance: 'none' as const }}>
              <option>Goleiro</option>
              <option>Zagueiro</option>
              <option>Lateral</option>
              <option>Volante</option>
              <option>Meia</option>
              <option>Atacante</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Telefone do atleta</label>
            <input name="telefoneAtleta" value={form.telefoneAtleta} onChange={handleChange} type="tel" placeholder="(34) 99999-9999" style={inputStyle} />
          </div>

          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '11px', color: neon, textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 0' }}>Responsável</p>

          <div>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Nome do responsável *</label>
            <input name="nomeResponsavel" value={form.nomeResponsavel} onChange={handleChange} type="text" placeholder="Nome completo" style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              CPF do responsável * <span style={{ color: gold, fontSize: '10px' }}>(obrigatório para boletos)</span>
            </label>
            <input
              name="cpfResponsavel"
              value={form.cpfResponsavel}
              onChange={handleChange}
              type="text"
              placeholder="000.000.000-00"
              style={{ ...inputStyle, borderColor: erros.some(e => e.includes('CPF')) ? 'rgba(255,60,60,0.6)' : 'rgba(255,255,255,0.1)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>WhatsApp *</label>
            <input name="whatsapp" value={form.whatsapp} onChange={handleChange} type="tel" placeholder="(34) 99999-9999" style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>E-mail</label>
            <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="email@exemplo.com" style={inputStyle} />
          </div>

          {/* 2o responsavel (opcional) */}
          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '11px', color: neon, textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 0' }}>2º Responsável <span style={{ color: 'rgba(255,255,255,0.3)', textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></p>

          <div>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Nome</label>
            <input name="nomeResponsavel2" value={form.nomeResponsavel2} onChange={handleChange} type="text" placeholder="Nome completo" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>WhatsApp</label>
              <input name="whatsappResponsavel2" value={form.whatsappResponsavel2} onChange={handleChange} type="tel" placeholder="(34) 99999-9999" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Parentesco</label>
              <input name="parentesco2" value={form.parentesco2} onChange={handleChange} type="text" placeholder="Ex: Mãe, Pai" style={inputStyle} />
            </div>
          </div>

          {/* Endereco */}
          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '11px', color: neon, textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 0' }}>Endereço</p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: '0 0 40%' }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>CEP</label>
              <input name="cep" value={form.cep} onChange={handleChange} type="text" placeholder="00000-000" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Rua</label>
              <input name="endereco" value={form.endereco} onChange={handleChange} type="text" placeholder="Logradouro" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: '0 0 30%' }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Número</label>
              <input name="numero" value={form.numero} onChange={handleChange} type="text" placeholder="Nº" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Bairro</label>
              <input name="bairro" value={form.bairro} onChange={handleChange} type="text" placeholder="Bairro" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Cidade</label>
              <input name="cidade" value={form.cidade} onChange={handleChange} type="text" placeholder="Cidade" style={inputStyle} />
            </div>
            <div style={{ flex: '0 0 25%' }}>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>UF</label>
              <input name="estado" value={form.estado} onChange={handleChange} type="text" placeholder="MG" maxLength={2} style={inputStyle} />
            </div>
          </div>

          {/* Uniforme + autorizacao */}
          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '11px', color: neon, textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 0' }}>Outros</p>

          <div>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Tamanho de uniforme</label>
            <select name="tamanhoUniforme" value={form.tamanhoUniforme} onChange={handleChange} style={{ ...inputStyle, appearance: 'none' as const }}>
              <option value="">Selecionar</option>
              <option value="2">2 anos</option>
              <option value="4">4 anos</option>
              <option value="6">6 anos</option>
              <option value="8">8 anos</option>
              <option value="10">10 anos</option>
              <option value="12">12 anos</option>
              <option value="14">14 anos</option>
              <option value="PP">PP</option>
              <option value="P">P</option>
              <option value="M">M</option>
              <option value="G">G</option>
              <option value="GG">GG</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', background: 'rgba(65,105,225,0.05)', border: '1px solid rgba(65,105,225,0.2)', borderRadius: '12px', padding: '14px' }}>
            <input type="checkbox" name="autorizacaoImagem" checked={form.autorizacaoImagem} onChange={handleChange} style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: neon, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>Autorizo o uso da imagem do atleta em fotos e vídeos da academia para divulgação em redes sociais e materiais institucionais.</span>
          </label>

          <button
            type="submit"
            style={{ width: '100%', background: 'linear-gradient(135deg,#4169E1,#1A3FA8)', color: '#F0F4FF', padding: '16px', borderRadius: '14px', fontWeight: 800, fontSize: '15px', fontFamily: syne, border: 'none', cursor: 'pointer', marginTop: '8px', boxShadow: '0 0 24px rgba(65,105,225,0.35)' }}
          >
            Avançar para o Contrato →
          </button>
        </form>
      </div>
    </div>
  )
}
