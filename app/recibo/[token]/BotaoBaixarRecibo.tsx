'use client'
import { useState } from 'react'
import { gerarRecibo } from '@/lib/gerarRecibo'

type Dados = Parameters<typeof gerarRecibo>[0]

export default function BotaoBaixarRecibo({ dados }: { dados: Dados }) {
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState(false)

  async function baixar() {
    setGerando(true); setErro(false)
    try { await gerarRecibo(dados) } catch { setErro(true) } finally { setGerando(false) }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <button onClick={baixar} disabled={gerando} style={{
        width: '100%', padding: '15px 16px', borderRadius: 12, border: 'none', background: '#2EA866', color: '#fff',
        fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, cursor: gerando ? 'wait' : 'pointer', opacity: gerando ? 0.7 : 1,
      }}>
        {gerando ? 'Gerando PDF…' : '📄 Baixar recibo em PDF'}
      </button>
      {erro && <p style={{ fontSize: 12, color: '#DC2626', textAlign: 'center', marginTop: 8 }}>Não foi possível gerar o PDF. Tente de novo ou tire um print desta tela.</p>}
    </div>
  )
}
