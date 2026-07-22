'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'

type Cobranca = {
  id: string
  valor: number
  vencimento: string
  status: string
  descricao: string
  pixCopiaCola: string | null
  pixQrCode: string | null
  atletaId: string
}

// ── Design system do app ──
const T = {
  bg:       '#0A0E1A',
  surface:  '#0D1220',
  surface2: '#121A2E',
  primary:  '#4169E1',
  cobalt:   '#1A3FA8',
  sky:      '#7DD3FC',
  text:     '#F0F4FF',
  muted:    'rgba(240,244,255,0.45)',
  faint:    'rgba(240,244,255,0.25)',
  border:   'rgba(240,244,255,0.08)',
  green:    '#00D67A',
  red:      '#FF4444',
  gold:     '#FFD700',
}
const SYNE  = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

const LABEL: React.CSSProperties = {
  fontSize: 11, color: T.muted, textTransform: 'uppercase',
  letterSpacing: 1, marginBottom: 4,
}

export default function PagarPage() {
  const params = useParams()
  const id = params.id as string
  const [cobranca, setCobranca]   = useState<Cobranca | null>(null)
  const [nomeAtleta, setNomeAtleta] = useState('')
  const [nomeEscola, setNomeEscola] = useState('')
  const [loading, setLoading]     = useState(true)
  const [copiado, setCopiado]     = useState(false)
  const [falhouCopiar, setFalhou] = useState(false)
  const [mostrarCodigo, setMostrarCodigo] = useState(false)
  const codigoRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch('/api/pagar?id=' + id)
        if (res.ok) {
          const data = await res.json()
          setCobranca(data)
          setNomeAtleta(data.nomeAtleta)
          setNomeEscola(data.nomeEscola)
        }
      } catch { /* mostra "nao encontrada" abaixo */ }
      setLoading(false)
    }
    carregar()
  }, [id])

  // O navegador embutido do WhatsApp costuma bloquear a clipboard API em
  // silencio: o botao dizia "copiado" e nada ia para a area de transferencia.
  // Aqui tentamos a API moderna, caimos no execCommand e, se tudo falhar,
  // abrimos o codigo na tela para o pai selecionar na mao.
  async function copiarPix() {
    const codigo = cobranca?.pixCopiaCola
    if (!codigo) return
    setFalhou(false)

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(codigo)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 3000)
        return
      }
      throw new Error('clipboard indisponivel')
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = codigo
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.top = '0'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        ta.setSelectionRange(0, codigo.length)
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        if (!ok) throw new Error('execCommand falhou')
        setCopiado(true)
        setTimeout(() => setCopiado(false), 3000)
      } catch {
        // ultimo recurso: mostra o codigo inteiro selecionado na tela
        setFalhou(true)
        setMostrarCodigo(true)
        setTimeout(() => {
          codigoRef.current?.focus()
          codigoRef.current?.select()
        }, 100)
      }
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
      <p style={{ color: T.muted, fontFamily: INTER }}>Carregando...</p>
    </div>
  )

  if (!cobranca) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: T.bg, padding: 24, textAlign: 'center' }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
      <p style={{ color: T.text, fontFamily: SYNE, fontWeight: 800, fontSize: 18, margin: '0 0 6px' }}>Cobrança não encontrada</p>
      <p style={{ color: T.muted, fontFamily: INTER, fontSize: 13, margin: 0 }}>Verifique o link ou fale com a escola.</p>
    </div>
  )

  const dataVenc = new Date((cobranca.vencimento || '').includes('T') ? cobranca.vencimento : cobranca.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
  const isPago    = cobranca.status === 'PAGO'
  const isVencido = cobranca.status === 'VENCIDO'

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: INTER, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 40px' }}>

      {/* Cabecalho */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: `linear-gradient(135deg, ${T.primary}, ${T.cobalt})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 900, color: T.text, fontFamily: SYNE,
          boxShadow: `0 8px 24px rgba(65,105,225,0.35)`, margin: '0 auto 14px',
        }}>G</div>
        <p style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 19, color: T.text, margin: '0 0 4px', letterSpacing: -0.3 }}>
          {nomeEscola || 'GestãoFC'}
        </p>
        <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Pagamento de mensalidade</p>
      </div>

      {/* Card principal */}
      <div style={{ width: '100%', maxWidth: 400, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24, marginBottom: 16 }}>

        {isPago && (
          <div style={{ background: `${T.green}12`, border: `1px solid ${T.green}35`, borderRadius: 12, padding: 14, textAlign: 'center', marginBottom: 20 }}>
            <p style={{ fontFamily: SYNE, fontWeight: 800, color: T.green, fontSize: 16, margin: '0 0 2px' }}>✅ Pagamento confirmado</p>
            <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Não é necessário pagar novamente.</p>
          </div>
        )}

        {isVencido && !isPago && (
          <div style={{ background: `${T.red}12`, border: `1px solid ${T.red}35`, borderRadius: 12, padding: 12, textAlign: 'center', marginBottom: 20 }}>
            <p style={{ fontFamily: SYNE, fontWeight: 800, color: T.red, fontSize: 14, margin: 0 }}>⚠️ Cobrança vencida</p>
          </div>
        )}

        {/* Atleta */}
        <div style={{ marginBottom: 20 }}>
          <p style={LABEL}>Atleta</p>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 17, color: T.text, margin: 0 }}>{nomeAtleta}</p>
        </div>

        {/* Valor + vencimento */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <p style={LABEL}>Valor</p>
            <p style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 24, color: T.green, margin: 0, letterSpacing: -0.5 }}>
              R$ {Number(cobranca.valor).toFixed(2)}
            </p>
          </div>
          <div>
            <p style={LABEL}>Vencimento</p>
            <p style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 17, color: isVencido && !isPago ? T.red : T.text, margin: 0 }}>{dataVenc}</p>
          </div>
        </div>

        {/* Descricao */}
        <div style={{ marginBottom: isPago ? 0 : 22 }}>
          <p style={LABEL}>Descrição</p>
          <p style={{ fontSize: 14, color: T.text, margin: 0 }}>{cobranca.descricao || 'Mensalidade'}</p>
        </div>

        {/* QR Code */}
        {!isPago && cobranca.pixQrCode && (
          <div style={{ textAlign: 'center', marginBottom: 20, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Escaneie o QR Code com seu banco</p>
            <div style={{ display: 'inline-block', background: '#FFFFFF', padding: 10, borderRadius: 14, border: `2px solid ${T.primary}40` }}>
              <img
                src={'data:image/png;base64,' + cobranca.pixQrCode}
                alt="QR Code Pix"
                style={{ width: 200, height: 200, display: 'block' }}
              />
            </div>
          </div>
        )}

        {/* Pix copia e cola */}
        {!isPago && cobranca.pixCopiaCola && (
          <div>
            <p style={{ fontSize: 12, color: T.muted, marginBottom: 10, textAlign: 'center' }}>ou use o Pix Copia e Cola</p>

            {!mostrarCodigo ? (
              <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 12, wordBreak: 'break-all', fontSize: 10, color: T.faint, lineHeight: 1.5 }}>
                {cobranca.pixCopiaCola.slice(0, 60)}...
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12, color: T.gold, marginBottom: 8, textAlign: 'center', lineHeight: 1.5 }}>
                  Seu navegador bloqueou a cópia automática.<br />Toque no código, segure e escolha <b>Copiar</b>:
                </p>
                <textarea
                  ref={codigoRef}
                  readOnly
                  value={cobranca.pixCopiaCola}
                  onClick={e => e.currentTarget.select()}
                  style={{
                    width: '100%', height: 100, background: T.surface2,
                    border: `1px solid ${T.gold}50`, borderRadius: 10, padding: 12,
                    color: T.text, fontSize: 11, fontFamily: 'monospace',
                    lineHeight: 1.5, resize: 'none', marginBottom: 12,
                    boxSizing: 'border-box', WebkitUserSelect: 'all', userSelect: 'all',
                  }}
                />
              </>
            )}

            <button
              onClick={copiarPix}
              style={{
                width: '100%',
                background: copiado ? `${T.green}18` : `linear-gradient(135deg, ${T.primary}, ${T.cobalt})`,
                color: copiado ? T.green : T.text,
                border: copiado ? `1px solid ${T.green}40` : 'none',
                borderRadius: 14, padding: 17,
                fontFamily: SYNE, fontWeight: 800, fontSize: 15,
                cursor: 'pointer', letterSpacing: 0.3,
                boxShadow: copiado ? 'none' : `0 6px 20px rgba(65,105,225,0.3)`,
                transition: 'all 0.2s',
              }}
            >
              {copiado ? '✓ Código copiado!' : falhouCopiar ? 'Tentar copiar novamente' : '📋 Copiar código Pix'}
            </button>

            {copiado && (
              <p style={{ fontSize: 12, color: T.green, textAlign: 'center', marginTop: 10, marginBottom: 0 }}>
                Agora abra o app do seu banco e escolha <b>Pix Copia e Cola</b>.
              </p>
            )}
          </div>
        )}
      </div>

      <p style={{ fontSize: 11, color: T.faint, textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
        Em caso de dúvidas, entre em contato com a escola.
      </p>
    </div>
  )
}
