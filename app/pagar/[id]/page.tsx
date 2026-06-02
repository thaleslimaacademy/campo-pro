'use client'
import { useEffect, useState } from 'react'
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

export default function PagarPage() {
  const params = useParams()
  const id = params.id as string
  const [cobranca, setCobranca] = useState<Cobranca | null>(null)
  const [nomeAtleta, setNomeAtleta] = useState('')
  const [nomeEscola, setNomeEscola] = useState('')
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(false)

  const syne = 'Syne, sans-serif'
  const neon = '#39FF14'
  const gold = '#D4AF37'
  const muted = 'rgba(255,255,255,0.4)'

  useEffect(() => {
    async function carregar() {
      const res = await fetch('/api/pagar?id=' + id)
      if (res.ok) {
        const data = await res.json()
        setCobranca(data)
        setNomeAtleta(data.nomeAtleta)
        setNomeEscola(data.nomeEscola)
      }
      setLoading(false)
    }
    carregar()
  }, [id])

  function copiarPix() {
    if (!cobranca?.pixCopiaCola) return
    navigator.clipboard.writeText(cobranca.pixCopiaCola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
      <p style={{ color: muted, fontFamily: 'Inter, sans-serif' }}>Carregando...</p>
    </div>
  )

  if (!cobranca) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
      <p style={{ color: muted, fontFamily: 'Inter, sans-serif' }}>Cobranca nao encontrada</p>
    </div>
  )

  const dataVenc = new Date(cobranca.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')
  const isPago = cobranca.status === 'PAGO'
  const isVencido = cobranca.status === 'VENCIDO'

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#F0F0F0', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px' }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#39FF14,#00aa00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: '#000', fontFamily: syne, boxShadow: '0 0 20px rgba(57,255,20,0.4)', margin: '0 auto 12px' }}>G</div>
        <p style={{ fontFamily: syne, fontWeight: 800, fontSize: '18px', color: '#F0F0F0', margin: '0 0 2px' }}>{nomeEscola || 'GestaoFC'}</p>
        <p style={{ fontSize: '12px', color: muted, margin: 0 }}>Pagamento de mensalidade</p>
      </div>

      {/* Card principal */}
      <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>

        {/* Status */}
        {isPago && (
          <div style={{ background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ fontFamily: syne, fontWeight: 800, color: neon, fontSize: '16px', margin: 0 }}>Pagamento confirmado!</p>
          </div>
        )}

        {isVencido && (
          <div style={{ background: 'rgba(255,70,70,0.1)', border: '1px solid rgba(255,70,70,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ fontFamily: syne, fontWeight: 800, color: '#ff5555', fontSize: '14px', margin: 0 }}>Cobranca vencida — entre em contato</p>
          </div>
        )}

        {/* Dados da cobrança */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', color: muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Atleta</p>
          <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '16px', color: '#F0F0F0', margin: 0 }}>{nomeAtleta}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '11px', color: muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Valor</p>
            <p style={{ fontFamily: syne, fontWeight: 800, fontSize: '22px', color: neon, margin: 0 }}>R$ {Number(cobranca.valor).toFixed(2)}</p>
          </div>
          <div>
            <p style={{ fontSize: '11px', color: muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Vencimento</p>
            <p style={{ fontFamily: syne, fontWeight: 700, fontSize: '16px', color: isVencido ? '#ff5555' : '#F0F0F0', margin: 0 }}>{dataVenc}</p>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', color: muted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Descricao</p>
          <p style={{ fontSize: '14px', color: '#F0F0F0', margin: 0 }}>{cobranca.descricao || 'Mensalidade'}</p>
        </div>

        {/* QR Code */}
        {!isPago && cobranca.pixQrCode && (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: muted, marginBottom: '12px' }}>Escaneie o QR Code com seu banco</p>
            <img
              src={'data:image/png;base64,' + cobranca.pixQrCode}
              alt="QR Code Pix"
              style={{ width: '200px', height: '200px', borderRadius: '12px', border: '2px solid rgba(57,255,20,0.3)' }}
            />
          </div>
        )}

        {/* Pix Copia e Cola */}
        {!isPago && cobranca.pixCopiaCola && (
          <div>
            <p style={{ fontSize: '12px', color: muted, marginBottom: '8px', textAlign: 'center' }}>ou use o Pix Copia e Cola</p>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 12px', marginBottom: '10px', wordBreak: 'break-all', fontSize: '10px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
              {cobranca.pixCopiaCola.slice(0, 60)}...
            </div>
            <button
              onClick={copiarPix}
              style={{
                width: '100%',
                background: copiado ? 'rgba(57,255,20,0.15)' : 'linear-gradient(135deg,#39FF14,#00cc00)',
                color: copiado ? neon : '#000',
                border: copiado ? '1px solid rgba(57,255,20,0.3)' : 'none',
                borderRadius: '14px',
                padding: '16px',
                fontFamily: syne,
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: copiado ? 'none' : '0 0 20px rgba(57,255,20,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {copiado ? 'Codigo copiado!' : 'Copiar codigo Pix'}
            </button>
          </div>
        )}
      </div>

      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
        Em caso de duvidas, entre em contato com a escola.
      </p>
    </div>
  )
}
