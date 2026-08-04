'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { hexToRgb } from '@/lib/hexToRgb'

type Cobranca = {
  id: string
  valor: number
  vencimento: string
  status: string
  descricao: string
  pixCopiaCola: string | null
  pixQrCode: string | null
  competencia: string | null
}

const T = {
  bg: '#0A0E1A', surface: '#0D1220', surface2: '#121A2E',
  primary: '#4169E1', cobalt: '#1A3FA8',
  text: '#F0F4FF', muted: 'rgba(240,244,255,0.45)', faint: 'rgba(240,244,255,0.25)',
  border: 'rgba(240,244,255,0.08)', green: '#00D67A', red: '#FF4444', gold: '#FFD700',
}
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'
const LABEL: React.CSSProperties = { fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }

function CardCobranca({ cobranca, primary, cobalt, primaryRgbStr }: { cobranca: Cobranca; primary: string; cobalt: string; primaryRgbStr: string }) {
  const [copiado, setCopiado] = useState(false)
  const [falhouCopiar, setFalhou] = useState(false)
  const [mostrarCodigo, setMostrarCodigo] = useState(false)
  const codigoRef = useRef<HTMLTextAreaElement>(null)

  async function copiarPix() {
    const codigo = cobranca.pixCopiaCola
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
        setFalhou(true)
        setMostrarCodigo(true)
        setTimeout(() => { codigoRef.current?.focus(); codigoRef.current?.select() }, 100)
      }
    }
  }

  const dataVenc = new Date((cobranca.vencimento || '').includes('T') ? cobranca.vencimento : cobranca.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
  const isVencido = cobranca.status === 'VENCIDO'
  const competenciaLabel = cobranca.competencia
    ? new Date(cobranca.competencia + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : null

  return (
    <div style={{ width: '100%', maxWidth: 400, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24, marginBottom: 16 }}>
      {isVencido && (
        <div style={{ background: `${T.red}12`, border: `1px solid ${T.red}35`, borderRadius: 12, padding: 12, textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, color: T.red, fontSize: 14, margin: 0 }}>⚠️ Cobrança vencida</p>
        </div>
      )}

      {competenciaLabel && (
        <div style={{ marginBottom: 20 }}>
          <p style={LABEL}>Referente a</p>
          <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 17, color: T.text, margin: 0, textTransform: 'capitalize' }}>{competenciaLabel}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <p style={LABEL}>Valor</p>
          <p style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 24, color: T.green, margin: 0, letterSpacing: -0.5 }}>R$ {Number(cobranca.valor).toFixed(2)}</p>
        </div>
        <div>
          <p style={LABEL}>Vencimento</p>
          <p style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 17, color: isVencido ? T.red : T.text, margin: 0 }}>{dataVenc}</p>
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <p style={LABEL}>Descrição</p>
        <p style={{ fontSize: 14, color: T.text, margin: 0 }}>{cobranca.descricao || 'Mensalidade'}</p>
      </div>

      {cobranca.pixQrCode && (
        <div style={{ textAlign: 'center', marginBottom: 20, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Escaneie o QR Code com seu banco</p>
          <div style={{ display: 'inline-block', background: '#FFFFFF', padding: 10, borderRadius: 14, border: `2px solid ${primary}40` }}>
            <img src={'data:image/png;base64,' + cobranca.pixQrCode} alt="QR Code Pix" style={{ width: 200, height: 200, display: 'block' }} />
          </div>
        </div>
      )}

      {cobranca.pixCopiaCola && (
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
                style={{ width: '100%', height: 100, background: T.surface2, border: `1px solid ${T.gold}50`, borderRadius: 10, padding: 12, color: T.text, fontSize: 11, fontFamily: 'monospace', lineHeight: 1.5, resize: 'none', marginBottom: 12, boxSizing: 'border-box', WebkitUserSelect: 'all', userSelect: 'all' }}
              />
            </>
          )}
          <button
            onClick={copiarPix}
            style={{
              width: '100%',
              background: copiado ? `${T.green}18` : `linear-gradient(135deg, ${primary}, ${cobalt})`,
              color: copiado ? T.green : T.text,
              border: copiado ? `1px solid ${T.green}40` : 'none',
              borderRadius: 14, padding: 17, fontFamily: SYNE, fontWeight: 800, fontSize: 15,
              cursor: 'pointer', letterSpacing: 0.3,
              boxShadow: copiado ? 'none' : `0 6px 20px rgba(${primaryRgbStr},0.3)`, transition: 'all 0.2s',
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
  )
}

export default function PagarAtletaPage() {
  const params = useParams()
  const atletaId = params.atletaId as string
  const [nomeAtleta, setNomeAtleta] = useState('')
  const [nomeEscola, setNomeEscola] = useState('')
  const [logoEscola, setLogoEscola] = useState<string | null>(null)
  const [corPrimaria, setCorPrimaria] = useState<string | null>(null)
  const [corSecundaria, setCorSecundaria] = useState<string | null>(null)
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch('/api/pagar-atleta?atletaId=' + atletaId)
        if (res.ok) {
          const data = await res.json()
          setNomeAtleta(data.nomeAtleta)
          setNomeEscola(data.nomeEscola)
          setLogoEscola(data.logoEscola || null)
          setCorPrimaria(data.corPrimaria || null)
          setCorSecundaria(data.corSecundaria || null)
          setCobrancas(data.cobrancas)
        }
      } catch { /* mostra "nao encontrado" abaixo */ }
      setLoading(false)
    }
    carregar()
  }, [atletaId])

  const primary = corPrimaria || T.primary
  const cobalt  = corSecundaria || T.cobalt
  const primaryRgb = hexToRgb(primary)
  const primaryRgbStr = `${primaryRgb.r},${primaryRgb.g},${primaryRgb.b}`

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
      <p style={{ color: T.muted, fontFamily: INTER }}>Carregando...</p>
    </div>
  )

  if (!nomeAtleta) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: T.bg, padding: 24, textAlign: 'center' }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
      <p style={{ color: T.text, fontFamily: SYNE, fontWeight: 800, fontSize: 18, margin: '0 0 6px' }}>Atleta não encontrado</p>
      <p style={{ color: T.muted, fontFamily: INTER, fontSize: 13, margin: 0 }}>Verifique o link ou fale com a escola.</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: INTER, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {logoEscola ? (
          <img
            src={logoEscola}
            alt={nomeEscola}
            style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 16, background: '#FFFFFF', padding: 6, boxSizing: 'border-box', display: 'block', margin: '0 auto 14px' }}
          />
        ) : (
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${primary}, ${cobalt})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: T.text, fontFamily: SYNE, boxShadow: `0 8px 24px rgba(${primaryRgbStr},0.35)`, margin: '0 auto 14px' }}>{(nomeEscola || '?').charAt(0).toUpperCase()}</div>
        )}
        <p style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 19, color: T.text, margin: '0 0 4px', letterSpacing: -0.3 }}>{nomeEscola}</p>
        <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Pendências de {nomeAtleta}</p>
      </div>

      {cobrancas.length === 0 ? (
        <div style={{ width: '100%', maxWidth: 400, background: T.surface, border: `1px solid ${T.green}35`, borderRadius: 20, padding: 24, textAlign: 'center' }}>
          <p style={{ fontFamily: SYNE, fontWeight: 800, color: T.green, fontSize: 16, margin: 0 }}>✅ Nenhuma pendência</p>
          <p style={{ fontSize: 12, color: T.muted, margin: '6px 0 0' }}>Todas as mensalidades estão em dia.</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>{cobrancas.length} cobrança{cobrancas.length !== 1 ? 's' : ''} em aberto — escolha qual pagar</p>
          {cobrancas.map(c => <CardCobranca key={c.id} cobranca={c} primary={primary} cobalt={cobalt} primaryRgbStr={primaryRgbStr} />)}
        </>
      )}

      <p style={{ fontSize: 11, color: T.faint, textAlign: 'center', maxWidth: 340, lineHeight: 1.6, marginTop: 8 }}>
        Em caso de dúvidas, entre em contato com a escola.
      </p>
      <p style={{ fontSize: 10, color: T.faint, textAlign: 'center', marginTop: 18, opacity: 0.6 }}>
        Emitido via gestaofc.com.br
      </p>
    </div>
  )
}
