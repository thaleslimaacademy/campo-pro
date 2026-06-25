'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'

interface Atleta {
  id: string
  nome: string
  posicao: string | null
  dataNascimento: string | null
  cpf: string | null
  rg: string | null
  fotoUrl: string | null
  tokenPais: string | null
  turmaId: string | null
}

interface Turma {
  id: string
  nome: string
}

export default function Carteirinha() {
  const params = useParams()
  const id = params.id as string
  const carteirinhaRef = useRef<HTMLDivElement>(null)

  const [atleta, setAtleta] = useState<Atleta | null>(null)
  const [turma, setTurma] = useState<Turma | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [loading, setLoading] = useState(true)

  const numero = id.slice(0, 8).toUpperCase()

  const syne = 'Syne, sans-serif'
  const neon = '#4169E1'
  const gold = '#FFD700'
  const bg = 'linear-gradient(160deg,#0A0E1A,#0A0E1A,#0A0E1A)'

  useEffect(() => {
    async function carregar() {
      const { data: at } = await supabase.from('Atleta').select('*').eq('id', id).single()
      setAtleta(at)

      if (at?.turmaId) {
        const { data: tm } = await supabase.from('Turma').select('id, nome').eq('id', at.turmaId).single()
        setTurma(tm)
      }

      if (at?.tokenPais) {
        // URL corrigida para o domínio de produção
        const url = 'https://gestaofc.com.br/pais/' + at.tokenPais
        const qr = await QRCode.toDataURL(url, { width: 120, margin: 1 })
        setQrCodeUrl(qr)
      }

      setLoading(false)
    }
    carregar()
  }, [id])

  function imprimir() {
    const conteudo = carteirinhaRef.current
    if (!conteudo) return
    const janela = window.open('', '_blank', 'width=400,height=300')
    if (!janela) return
    janela.document.write(
      '<!DOCTYPE html><html><head><title>Carteirinha - ' + atleta?.nome + '</title>' +
      '<style>* { margin: 0; padding: 0; box-sizing: border-box; } @page { size: 85.6mm 54mm; margin: 0; } body { width: 85.6mm; height: 54mm; overflow: hidden; }</style>' +
      '</head><body>' + conteudo.outerHTML + '</body></html>'
    )
    janela.document.close()
    setTimeout(() => { janela.print(); janela.close() }, 500)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter,sans-serif' }}>Carregando...</p>
    </div>
  )

  if (!atleta) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Atleta não encontrado.</p>
    </div>
  )

  const nascimento = atleta.dataNascimento
    ? new Date(atleta.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')
    : null

  const idade = atleta.dataNascimento
    ? new Date().getFullYear() - new Date(atleta.dataNascimento + 'T12:00:00').getFullYear()
    : null

  // ── Estilo do card físico (tamanho CNH) ──
  const cardStyle: React.CSSProperties = {
    width: '85.6mm',
    height: '54mm',
    background: 'linear-gradient(135deg,#0A0E1A 0%,#0A0E1A 50%,#0A0E1A 100%)',
    borderRadius: '8px',
    padding: '4mm',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 40px rgba(57,255,20,0.1)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
    border: '1px solid rgba(57,255,20,0.2)',
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#F0F4FF', fontFamily: 'Inter,sans-serif', paddingBottom: '40px' }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <a href={'/atletas/' + atleta.id} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none' }}>← Voltar</a>
        <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: '20px', color: '#F0F4FF', margin: 0 }}>🪪 Carteirinha</h1>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textAlign: 'center', marginBottom: '20px' }}>
        Preview — tamanho CNH (85.6 × 54mm)
      </p>

      {/* ── CARD ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', padding: '0 20px' }}>
        <div ref={carteirinhaRef} style={cardStyle}>

          {/* Círculos decorativos */}
          <div style={{ position: 'absolute', top: '-10mm', right: '-10mm', width: '35mm', height: '35mm', borderRadius: '50%', background: 'rgba(57,255,20,0.06)' }} />
          <div style={{ position: 'absolute', bottom: '-8mm', left: '-8mm', width: '25mm', height: '25mm', borderRadius: '50%', background: 'rgba(57,255,20,0.04)' }} />
          <div style={{ position: 'absolute', top: '50%', right: '20mm', width: '1px', height: '80%', transform: 'translateY(-50%)', background: 'rgba(57,255,20,0.08)' }} />

          {/* Header do card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <p style={{ color: 'rgba(57,255,20,0.7)', fontSize: '5px', fontWeight: 'bold', letterSpacing: '1px', margin: 0 }}>
                ASSOCIAÇÃO ESPORTIVA
              </p>
              <p style={{ color: '#ffffff', fontSize: '7px', fontWeight: 'bold', margin: '1px 0 0', letterSpacing: '0.5px' }}>
                THALES LIMA FOOTBALL ACADEMY
              </p>
            </div>
            <div style={{ background: 'rgba(57,255,20,0.12)', border: '0.5px solid rgba(57,255,20,0.3)', borderRadius: '4px', padding: '2px 5px', textAlign: 'center' }}>
              <p style={{ color: 'rgba(57,255,20,0.7)', fontSize: '4px', margin: 0 }}>Nº</p>
              <p style={{ color: '#4169E1', fontSize: '6px', fontWeight: 'bold', margin: 0 }}>{numero}</p>
            </div>
          </div>

          {/* Corpo do card */}
          <div style={{ display: 'flex', gap: '3mm', alignItems: 'flex-start', flex: 1, marginTop: '3mm', position: 'relative' }}>

            {/* Foto */}
            <div style={{ flexShrink: 0 }}>
              {atleta.fotoUrl ? (
                <img
                  src={atleta.fotoUrl}
                  alt={atleta.nome}
                  style={{ width: '18mm', height: '22mm', objectFit: 'cover', borderRadius: '4px', border: '1.5px solid rgba(57,255,20,0.5)' }}
                />
              ) : (
                <div style={{ width: '18mm', height: '22mm', background: 'rgba(57,255,20,0.08)', borderRadius: '4px', border: '1.5px solid rgba(57,255,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4169E1', fontSize: '14px', fontWeight: 'bold' }}>
                  {atleta.nome[0]}
                </div>
              )}
            </div>

            {/* Dados */}
            <div style={{ flex: 1 }}>
              <p style={{ color: '#ffffff', fontSize: '8px', fontWeight: 'bold', margin: '0 0 1mm', lineHeight: 1.2 }}>{atleta.nome}</p>
              <p style={{ color: '#4169E1', fontSize: '6px', fontWeight: 'bold', margin: '0 0 2mm' }}>{atleta.posicao || 'Atleta'}</p>
              {nascimento && (
                <div style={{ marginBottom: '1mm' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '5px', margin: 0 }}>NASCIMENTO</p>
                  <p style={{ color: '#ffffff', fontSize: '6px', margin: 0 }}>{nascimento}{idade ? ' (' + idade + ' anos)' : ''}</p>
                </div>
              )}
              {(atleta.cpf || atleta.rg) && (
                <div style={{ marginBottom: '1mm' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '5px', margin: 0 }}>{atleta.cpf ? 'CPF' : 'RG'}</p>
                  <p style={{ color: '#ffffff', fontSize: '6px', margin: 0 }}>{atleta.cpf || atleta.rg}</p>
                </div>
              )}
              {turma && (
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '5px', margin: 0 }}>TURMA</p>
                  <p style={{ color: '#FFD700', fontSize: '6px', fontWeight: 'bold', margin: 0 }}>{turma.nome}</p>
                </div>
              )}
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={qrCodeUrl} alt="QR" style={{ width: '14mm', height: '14mm', borderRadius: '3px' }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '4px', marginTop: '1mm', textAlign: 'center' }}>Área dos Pais</p>
              </div>
            )}
          </div>

          {/* Rodapé do card */}
          <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)', paddingTop: '2mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '4px', margin: 0 }}>
              Iturama - MG | gestaofc.com.br
            </p>
            <p style={{ color: '#4169E1', fontSize: '5px', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' }}>
              ATLETA OFICIAL
            </p>
          </div>
        </div>
      </div>

      {/* ── BOTÃO IMPRIMIR ── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 20px', marginBottom: '16px' }}>
        <button
          onClick={imprimir}
          style={{ background: 'linear-gradient(135deg,#4169E1,#00D67A)', color: '#0A0E1A', padding: '14px 36px', borderRadius: '14px', fontSize: '15px', fontWeight: 800, fontFamily: syne, border: 'none', cursor: 'pointer', boxShadow: '0 0 24px rgba(57,255,20,0.3)' }}
        >
          🖨️ Imprimir Carteirinha
        </button>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', textAlign: 'center', padding: '0 24px' }}>
        No diálogo de impressão defina o tamanho como Personalizado 85.6 × 54mm ou imprima em A4 e recorte.
      </p>
    </div>
  )
}
