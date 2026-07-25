'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import QRCode from 'qrcode'
import { getCarteirinhasData } from './actions'

const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

type Atleta = { id: string; nome: string; posicao: string | null; dataNascimento: string | null; cpf: string | null; fotoUrl: string | null; tokenPais: string | null; turmaId: string | null }
type Escola = { id: string; nome: string; cidade: string | null; estado: string | null; logoUrl: string | null; corPrimaria: string | null; corSecundaria: string | null; corTexto: string | null }

export default function CarteirinhasEmMassa() {
  const gradeRef = useRef<HTMLDivElement>(null)
  const [, startLoad] = useTransition()

  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [turmasPorId, setTurmasPorId] = useState<Record<string, string>>({})
  const [escola, setEscola] = useState<Escola | null>(null)
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())

  useEffect(() => {
    startLoad(async () => {
      const d = await getCarteirinhasData()
      setAtletas(d.atletas as Atleta[])
      setTurmasPorId(d.turmasPorId)
      setEscola(d.escola as Escola)
      setSelecionados(new Set((d.atletas as Atleta[]).map(a => a.id)))

      const entradas = await Promise.all(
        (d.atletas as Atleta[])
          .filter(a => a.tokenPais)
          .map(async a => {
            const qr = await QRCode.toDataURL('https://gestaofc.com.br/pais/' + a.tokenPais, { width: 120, margin: 1 })
            return [a.id, qr] as const
          })
      )
      setQrCodes(Object.fromEntries(entradas))
      setLoading(false)
    })
  }, [])

  function toggle(id: string) {
    setSelecionados(prev => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id); else novo.add(id)
      return novo
    })
  }

  function selecionarTodos() { setSelecionados(new Set(atletas.map(a => a.id))) }
  function limparSelecao() { setSelecionados(new Set()) }

  function imprimir() {
    const conteudo = gradeRef.current
    if (!conteudo) return
    const janela = window.open('', '_blank')
    if (!janela) return
    janela.document.write(
      '<!DOCTYPE html><html><head><title>Carteirinhas</title>' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Inter:wght@400;600&display=swap">' +
      '<style>' +
      '* { margin: 0; padding: 0; box-sizing: border-box; }' +
      '@page { size: A4; margin: 10mm; }' +
      'body { display: flex; flex-wrap: wrap; gap: 4mm; }' +
      '.carteirinha-print { page-break-inside: avoid; break-inside: avoid; }' +
      '</style>' +
      '</head><body>' +
      Array.from(selecionados).map(id => {
        const el = conteudo.querySelector('[data-atleta-id="' + id + '"]')
        return el ? '<div class="carteirinha-print">' + el.outerHTML + '</div>' : ''
      }).join('') +
      '</body></html>'
    )
    janela.document.close()
    setTimeout(() => { janela.print(); janela.close() }, 800)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(240,244,255,0.4)', fontFamily: INTER }}>Carregando...</p>
    </div>
  )

  const bgColor = escola?.corPrimaria || '#0A0E1A'
  const accentColor = escola?.corSecundaria || '#4169E1'
  const textColor = escola?.corTexto || '#F0F4FF'
  const borderColor = accentColor + '44'
  const mutedColor = textColor + '70'
  const escolaNome = escola?.nome || 'GESTÃO FC'
  const cidadeEstado = escola?.cidade && escola?.estado ? `${escola.cidade} - ${escola.estado}` : ''
  const logoPreview = escola?.logoUrl || null

  const validade = new Date()
  validade.setFullYear(validade.getFullYear() + 1)
  const validadeStr = validade.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E1A', color: '#F0F4FF', fontFamily: INTER, paddingBottom: 80 }}>

      {/* HEADER */}
      <div style={{ background: '#4169E1', padding: '20px 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Atletas</div>
            <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 22, color: '#F0F4FF', letterSpacing: -0.5, textTransform: 'uppercase' }}>🪪 Carteirinhas em massa</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/atletas" style={{ background: 'rgba(240,244,255,0.15)', border: '1px solid rgba(240,244,255,0.2)', color: '#F0F4FF', borderRadius: 8, padding: '8px 14px', fontFamily: SYNE, fontWeight: 700, fontSize: 11, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 0.5 }}>← Voltar</a>
            <button onClick={imprimir} disabled={selecionados.size === 0} style={{ background: '#F0F4FF', color: '#4169E1', borderRadius: 8, padding: '8px 14px', fontFamily: SYNE, fontWeight: 800, fontSize: 11, border: 'none', cursor: selecionados.size ? 'pointer' : 'not-allowed', opacity: selecionados.size ? 1 : 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              🖨️ Imprimir {selecionados.size} selecionada{selecionados.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* BARRA DE SELEÇÃO */}
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 12, color: 'rgba(240,244,255,0.5)', margin: 0 }}>{atletas.length} atleta{atletas.length !== 1 ? 's' : ''} ativo{atletas.length !== 1 ? 's' : ''}</p>
        <button onClick={selecionarTodos} style={{ background: 'transparent', border: '1px solid rgba(65,105,225,0.4)', color: '#4169E1', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: SYNE, fontWeight: 700 }}>Selecionar todos</button>
        <button onClick={limparSelecao} style={{ background: 'transparent', border: '1px solid rgba(240,244,255,0.15)', color: 'rgba(240,244,255,0.5)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: SYNE, fontWeight: 700 }}>Limpar</button>
      </div>

      {/* GRADE (tela) */}
      <div ref={gradeRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '0 20px 24px' }}>
        {atletas.map(atleta => {
          const selecionado = selecionados.has(atleta.id)
          const turma = atleta.turmaId ? turmasPorId[atleta.turmaId] : null
          const qrCodeUrl = qrCodes[atleta.id] || ''
          const numero = atleta.id.slice(0, 8).toUpperCase()
          const nascimento = atleta.dataNascimento
            ? new Date(atleta.dataNascimento.includes('T') ? atleta.dataNascimento : atleta.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')
            : null

          return (
            <div key={atleta.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={selecionado} onChange={() => toggle(atleta.id)} />
                <span style={{ fontSize: 11, color: 'rgba(240,244,255,0.5)' }}>{atleta.nome}</span>
              </label>
              <div
                data-atleta-id={atleta.id}
                className="carteirinha-print"
                style={{
                  width: '85.6mm', height: '54mm',
                  background: bgColor,
                  borderRadius: 8,
                  padding: '3.5mm',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  position: 'relative', overflow: 'hidden',
                  fontFamily: 'Arial, sans-serif',
                  border: `1px solid ${borderColor}`,
                  opacity: selecionado ? 1 : 0.35,
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />
                <div style={{ position: 'absolute', bottom: '-12mm', right: '-12mm', width: '40mm', height: '40mm', borderRadius: '50%', border: `1px solid ${accentColor}15` }} />
                <div style={{ position: 'absolute', bottom: '-20mm', right: '-20mm', width: '60mm', height: '60mm', borderRadius: '50%', border: `1px solid ${accentColor}08` }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" style={{ width: '12mm', height: '12mm', objectFit: 'contain', background: 'white', borderRadius: 3, padding: 2 }} />
                    ) : (
                      <div style={{ width: '12mm', height: '12mm', background: accentColor + '20', border: `0.5px solid ${accentColor}50`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>⚽</div>
                    )}
                    <div>
                      <p style={{ color: mutedColor, fontSize: '4.5px', fontWeight: 'bold', letterSpacing: '0.8px', margin: 0 }}>ASSOCIAÇÃO ESPORTIVA</p>
                      <p style={{ color: textColor, fontSize: '6px', fontWeight: 'bold', margin: '1px 0 0', letterSpacing: '0.3px' }}>{escolaNome.toUpperCase()}</p>
                    </div>
                  </div>
                  <div style={{ background: accentColor + '20', border: `0.5px solid ${accentColor}50`, borderRadius: '3px', padding: '2px 5px', textAlign: 'center', flexShrink: 0 }}>
                    <p style={{ color: mutedColor, fontSize: '3.5px', margin: 0, letterSpacing: '0.5px' }}>Nº</p>
                    <p style={{ color: accentColor, fontSize: '5.5px', fontWeight: 'bold', margin: 0 }}>{numero}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '3mm', alignItems: 'flex-start', flex: 1, marginTop: '2.5mm', position: 'relative', zIndex: 1 }}>
                  <div style={{ flexShrink: 0 }}>
                    {atleta.fotoUrl ? (
                      <img src={atleta.fotoUrl} alt={atleta.nome} style={{ width: '16mm', height: '21.3mm', objectFit: 'cover', objectPosition: 'center center', borderRadius: '3px', border: `1.5px solid ${accentColor}60` }} />
                    ) : (
                      <div style={{ width: '16mm', height: '21.3mm', background: accentColor + '15', borderRadius: '3px', border: `1.5px dashed ${accentColor}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <span style={{ color: accentColor, fontSize: '10px' }}>👤</span>
                        <span style={{ color: mutedColor, fontSize: '3.5px', textAlign: 'center' }}>FOTO</span>
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5mm' }}>
                    <div>
                      <p style={{ color: textColor, fontSize: '7.5px', fontWeight: 'bold', margin: 0, lineHeight: 1.2 }}>{atleta.nome.toUpperCase()}</p>
                      <p style={{ color: accentColor, fontSize: '5.5px', fontWeight: 'bold', margin: '1px 0 0', letterSpacing: '0.3px' }}>{atleta.posicao || 'Atleta'}</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5mm' }}>
                      {nascimento && (
                        <div>
                          <p style={{ color: mutedColor, fontSize: '4px', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Nascimento</p>
                          <p style={{ color: textColor, fontSize: '5px', margin: '0.5mm 0 0', fontWeight: '600' }}>{nascimento}</p>
                        </div>
                      )}
                      {atleta.cpf && (
                        <div>
                          <p style={{ color: mutedColor, fontSize: '4px', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>CPF</p>
                          <p style={{ color: textColor, fontSize: '5px', margin: '0.5mm 0 0', fontWeight: '600' }}>{atleta.cpf}</p>
                        </div>
                      )}
                      {turma && (
                        <div>
                          <p style={{ color: mutedColor, fontSize: '4px', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Turma</p>
                          <p style={{ color: '#FFD700', fontSize: '5px', margin: '0.5mm 0 0', fontWeight: '700' }}>{turma}</p>
                        </div>
                      )}
                      <div>
                        <p style={{ color: mutedColor, fontSize: '4px', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Validade</p>
                        <p style={{ color: textColor, fontSize: '5px', margin: '0.5mm 0 0', fontWeight: '600' }}>{validadeStr}</p>
                      </div>
                    </div>
                  </div>

                  {qrCodeUrl && (
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1mm' }}>
                      <div style={{ background: '#fff', borderRadius: 2, padding: 2 }}>
                        <img src={qrCodeUrl} alt="QR" style={{ width: '13mm', height: '13mm', display: 'block' }} />
                      </div>
                      <p style={{ color: mutedColor, fontSize: '3.5px', textAlign: 'center', margin: 0 }}>Área dos Pais</p>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: `0.5px solid ${textColor}15`, paddingTop: '1.5mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                  <p style={{ color: mutedColor, fontSize: '3.5px', margin: 0 }}>{cidadeEstado} · gestaofc.com.br</p>
                  <p style={{ color: accentColor, fontSize: '4.5px', fontWeight: 'bold', margin: 0, letterSpacing: '0.5px' }}>ATLETA OFICIAL</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ color: 'rgba(240,244,255,0.25)', fontSize: 11, textAlign: 'center', padding: '0 24px' }}>
        No diálogo de impressão, escolha A4 e ajuste a margem se necessário. Cada carteirinha sai no tamanho CNH (85.6 × 54mm) e pode ser recortada.
      </p>
    </div>
  )
}
