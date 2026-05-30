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

  useEffect(() => {
    async function carregar() {
      const { data: at } = await supabase
        .from('Atleta')
        .select('*')
        .eq('id', id)
        .single()
      setAtleta(at)

      if (at?.turmaId) {
        const { data: tm } = await supabase
          .from('Turma')
          .select('id, nome')
          .eq('id', at.turmaId)
          .single()
        setTurma(tm)
      }

      if (at?.tokenPais) {
        const url = 'https://campo-pro.vercel.app/pais/' + at.tokenPais
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

    janela.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Carteirinha - ${atleta?.nome}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page {
            size: 85.6mm 54mm;
            margin: 0;
          }
          body {
            width: 85.6mm;
            height: 54mm;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        ${conteudo.outerHTML}
      </body>
      </html>
    `)
    janela.document.close()
    setTimeout(() => {
      janela.print()
      janela.close()
    }, 500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  if (!atleta) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p>Atleta não encontrado.</p>
      </div>
    )
  }

  const nascimento = atleta.dataNascimento
    ? new Date(atleta.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')
    : null

  const idade = atleta.dataNascimento
    ? new Date().getFullYear() - new Date(atleta.dataNascimento + 'T12:00:00').getFullYear()
    : null

  const cardStyle: React.CSSProperties = {
    width: '85.6mm',
    height: '54mm',
    background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
    borderRadius: '8px',
    padding: '4mm',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <a href={'/atletas/' + atleta.id} className="text-gray-400">← Voltar</a>
        <h1 className="text-xl font-bold">🪪 Carteirinha</h1>
      </div>

      <p className="text-gray-400 text-sm mb-4 text-center">
        Preview da carteirinha — tamanho CNH (85.6 x 54mm)
      </p>

      <div className="flex justify-center mb-6">
        <div ref={carteirinhaRef} style={cardStyle}>
          <div style={{
            position: 'absolute', top: '-10mm', right: '-10mm',
            width: '35mm', height: '35mm', borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-8mm', left: '-8mm',
            width: '25mm', height: '25mm', borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#6ee7b7', fontSize: '5px', fontWeight: 'bold', letterSpacing: '1px', margin: 0 }}>
                ASSOCIAÇÃO ESPORTIVA
              </p>
              <p style={{ color: '#ffffff', fontSize: '7px', fontWeight: 'bold', margin: '1px 0 0 0', letterSpacing: '0.5px' }}>
                THALES LIMA FOOTBALL ACADEMY
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '2px 5px' }}>
              <p style={{ color: '#6ee7b7', fontSize: '5px', margin: 0 }}>Nº</p>
              <p style={{ color: '#ffffff', fontSize: '6px', fontWeight: 'bold', margin: 0 }}>{numero}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '3mm', alignItems: 'flex-start', flex: 1, marginTop: '3mm' }}>
            <div style={{ flexShrink: 0 }}>
              {atleta.fotoUrl ? (
                <img
                  src={atleta.fotoUrl}
                  alt={atleta.nome}
                  style={{
                    width: '18mm', height: '22mm', objectFit: 'cover',
                    borderRadius: '4px', border: '1.5px solid rgba(110,231,183,0.5)',
                  }}
                />
              ) : (
                <div style={{
                  width: '18mm', height: '22mm',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px', border: '1.5px solid rgba(110,231,183,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#6ee7b7', fontSize: '14px',
                }}>
                  {atleta.nome[0]}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ color: '#ffffff', fontSize: '8px', fontWeight: 'bold', margin: '0 0 1mm 0', lineHeight: 1.2 }}>
                {atleta.nome}
              </p>
              <p style={{ color: '#6ee7b7', fontSize: '6px', fontWeight: 'bold', margin: '0 0 2mm 0' }}>
                {atleta.posicao || 'Atleta'}
              </p>
              {nascimento && (
                <div style={{ marginBottom: '1mm' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '5px', margin: 0 }}>NASCIMENTO</p>
                  <p style={{ color: '#ffffff', fontSize: '6px', margin: 0 }}>
                    {nascimento}{idade ? ' (' + idade + ' anos)' : ''}
                  </p>
                </div>
              )}
              {(atleta.cpf || atleta.rg) && (
                <div style={{ marginBottom: '1mm' }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '5px', margin: 0 }}>
                    {atleta.cpf ? 'CPF' : 'RG'}
                  </p>
                  <p style={{ color: '#ffffff', fontSize: '6px', margin: 0 }}>
                    {atleta.cpf || atleta.rg}
                  </p>
                </div>
              )}
              {turma && (
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '5px', margin: 0 }}>TURMA</p>
                  <p style={{ color: '#ffffff', fontSize: '6px', margin: 0 }}>{turma.nome}</p>
                </div>
              )}
            </div>

            {qrCodeUrl && (
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={qrCodeUrl} alt="QR" style={{ width: '14mm', height: '14mm' }} />
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '4px', marginTop: '1mm', textAlign: 'center' }}>
                  Area dos Pais
                </p>
              </div>
            )}
          </div>

          <div style={{
            borderTop: '0.5px solid rgba(255,255,255,0.2)',
            paddingTop: '2mm',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '4px', margin: 0 }}>
              Iturama - MG | campo-pro.vercel.app
            </p>
            <p style={{ color: '#6ee7b7', fontSize: '5px', fontWeight: 'bold', margin: 0 }}>
              ATLETA OFICIAL
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={imprimir}
          className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold"
        >
          🖨️ Imprimir Carteirinha
        </button>
      </div>

      <p className="text-gray-500 text-xs text-center mt-4">
        Dica: No diálogo de impressão defina o tamanho como Personalizado 85.6 x 54mm ou imprima em A4 e recorte.
      </p>
    </div>
  )
}