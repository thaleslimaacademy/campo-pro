'use client'
import { useState } from 'react'

/** Pix da mensalidade na Area dos Pais: QR Code + botao de copiar. Sem Pix pronto, leva para a pagina de pagamento (que gera o Pix na hora). */
export default function PagarPix({ copiaCola, qrCode, linkPagar }: { copiaCola: string | null; qrCode: string | null; linkPagar: string }) {
  const [aberto, setAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [mostrarCodigo, setMostrarCodigo] = useState(false)

  const btn = (bg: string, cor: string, borda = 'none'): React.CSSProperties => ({
    flex: 1, padding: '11px 12px', borderRadius: 10, border: borda, background: bg, color: cor,
    fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'Syne, sans-serif', textAlign: 'center', textDecoration: 'none',
  })

  if (!copiaCola) {
    return (
      <div style={{ marginTop: 10, display: 'flex' }}>
        <a href={linkPagar} style={btn('#2EA866', '#fff')}>Pagar com Pix</a>
      </div>
    )
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(copiaCola!)
      setCopiado(true); setTimeout(() => setCopiado(false), 3000)
    } catch { setMostrarCodigo(true) } // navegador sem permissao: mostra o codigo para copiar na mao
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={copiar} style={btn('#2EA866', '#fff')}>{copiado ? 'Código copiado ✅' : 'Copiar código Pix'}</button>
        {qrCode && <button onClick={() => setAberto(a => !a)} style={btn('#fff', '#1F2937', '1px solid #E3E8E5')}>{aberto ? 'Fechar QR' : 'Ver QR Code'}</button>}
      </div>
      {copiado && <p style={{ fontSize: 12, color: '#23874F', margin: '8px 0 0' }}>Abra o app do seu banco → Pix → <b>Pix Copia e Cola</b> e cole o código.</p>}
      {aberto && qrCode && (
        <div style={{ marginTop: 10, background: '#fff', border: '1px solid #E3E8E5', borderRadius: 12, padding: 12, textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={'data:image/png;base64,' + qrCode} alt="QR Code Pix" style={{ width: 200, height: 200, margin: '0 auto', display: 'block' }} />
          <p style={{ fontSize: 11, color: '#6B7280', margin: '6px 0 0' }}>Escaneie com o app do banco em outro celular</p>
        </div>
      )}
      {mostrarCodigo && (
        <textarea readOnly value={copiaCola} onFocus={e => e.currentTarget.select()}
          style={{ marginTop: 8, width: '100%', fontSize: 11, padding: 8, borderRadius: 8, border: '1px solid #E3E8E5', fontFamily: 'monospace', boxSizing: 'border-box' }} rows={4} />
      )}
    </div>
  )
}
