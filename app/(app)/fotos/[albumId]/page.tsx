'use client'

import { use, useEffect, useState, useRef } from 'react'
import { ArrowLeft, Upload, Trash2, Loader2, DollarSign, Link } from 'lucide-react'
import { listarFotos, uploadFoto, excluirFoto, atualizarValorFoto } from '../actions'

const C = { bg: '#0F0F1A', surface: '#1A1A2E', orange: '#FF6B00', gold: '#FFD700', text: '#F0F0F0', muted: 'rgba(240,240,240,0.45)', border: 'rgba(255,255,255,0.08)' }
const SYNE = 'Syne, sans-serif'

type Foto = { id: string; urlWatermark: string; valor: number }

async function adicionarMarcaDagua(file: File): Promise<{ watermark: string; original: string; nome: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const original = e.target!.result as string
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const fontSize = Math.max(Math.floor(img.width / 10), 28)
        ctx.save()
        ctx.globalAlpha = 0.4
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = '#000'
        ctx.shadowBlur = 4
        ctx.font = `bold ${fontSize}px Arial`
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate(-Math.PI / 4)
        const text = '© GESTÃO FC'
        const tw = ctx.measureText(text).width + 40
        const th = fontSize * 2.5
        for (let r = -6; r <= 6; r++) {
          for (let c = -6; c <= 6; c++) {
            ctx.fillText(text, c * tw, r * th)
          }
        }
        ctx.restore()
        resolve({ watermark: canvas.toDataURL('image/jpeg', 0.82), original, nome: file.name })
      }
      img.onerror = reject
      img.src = original
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AlbumAdminPage({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = use(params)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState(false)
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 })
  const [valorPadrao, setValorPadrao] = useState(10)
  const inputRef = useRef<HTMLInputElement>(null)

  const carregar = async () => {
    setLoading(true)
    try { setFotos(await listarFotos(albumId) as Foto[]) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (albumId) carregar() }, [albumId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setProcessando(true)
    setProgresso({ atual: 0, total: files.length })
    for (let i = 0; i < files.length; i++) {
      try {
        setProgresso({ atual: i + 1, total: files.length })
        const { watermark, original, nome } = await adicionarMarcaDagua(files[i])
        await uploadFoto({ albumId, nomeArquivo: nome, conteudoWatermark: watermark, conteudoOriginal: original, valor: valorPadrao })
      } catch (err) {
        console.error('Erro foto', i, err)
      }
    }
    setProcessando(false)
    await carregar()
    if (inputRef.current) inputRef.current.value = ''
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir esta foto?')) return
    await excluirFoto(id); await carregar()
  }

  const atualizarValor = async (id: string, valor: number) => {
    await atualizarValorFoto(id, valor)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: 20 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <a href="/fotos" style={{ color: C.muted, display: 'flex' }}><ArrowLeft size={20} /></a>
          <h1 style={{ fontFamily: SYNE, fontSize: 22, fontWeight: 800, color: C.orange, margin: 0 }}>Gerenciar Fotos</h1>
          <a href={`/galeria/${albumId}`} target="_blank" rel="noreferrer"
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: C.gold, fontSize: 12, textDecoration: 'none', border: `1px solid ${C.gold}44`, borderRadius: 8, padding: '6px 12px' }}>
            <Link size={13} /> Ver galeria pública
          </a>
        </div>

        <div style={{ background: C.surface, border: `2px dashed ${C.orange}44`, borderRadius: 16, padding: 24, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
            <DollarSign size={16} color={C.gold} />
            <span style={{ fontSize: 13, color: C.muted }}>Valor padrão por foto:</span>
            <span style={{ color: C.muted, fontSize: 13 }}>R$</span>
            <input type="number" value={valorPadrao} onChange={e => setValorPadrao(Number(e.target.value))} min={1} step={0.5}
              style={{ width: 70, background: '#0F0F1A', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', color: C.text, fontSize: 13, textAlign: 'center' }} />
          </div>

          {processando ? (
            <div>
              <Loader2 size={32} color={C.orange} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
              <p style={{ color: C.muted, fontSize: 13 }}>Aplicando marca d'água e enviando... {progresso.atual}/{progresso.total}</p>
              <div style={{ height: 4, background: C.border, borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: C.orange, width: `${(progresso.atual / progresso.total) * 100}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          ) : (
            <>
              <Upload size={32} color={C.orange} style={{ marginBottom: 8 }} />
              <p style={{ color: C.text, fontFamily: SYNE, fontWeight: 700, marginBottom: 4 }}>Clique para fazer upload</p>
              <p style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>Marca d'água aplicada automaticamente · Fotos até 15MB</p>
              <button onClick={() => inputRef.current?.click()}
                style={{ background: C.orange, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontFamily: SYNE, fontWeight: 700, cursor: 'pointer' }}>
                Selecionar fotos
              </button>
              <input ref={inputRef} type="file" multiple accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
            </>
          )}
        </div>

        {loading ? (
          <p style={{ color: C.muted, textAlign: 'center', padding: 40 }}>Carregando...</p>
        ) : fotos.length === 0 ? (
          <p style={{ color: C.muted, textAlign: 'center', padding: 40 }}>Nenhuma foto ainda.</p>
        ) : (
          <>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>{fotos.length} foto{fotos.length > 1 ? 's' : ''} · Clique no valor para editar</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {fotos.map(f => (
                <div key={f.id} style={{ background: C.surface, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                  <div style={{ position: 'relative' }}>
                    <img src={f.urlWatermark} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} alt="" />
                    <button onClick={() => excluir(f.id)}
                      style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 8, padding: 6, color: '#FF4757', cursor: 'pointer', display: 'flex' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: C.muted, fontSize: 11 }}>R$</span>
                    <input type="number" defaultValue={f.valor} min={1} step={0.5}
                      onBlur={e => atualizarValor(f.id, Number(e.target.value))}
                      style={{ flex: 1, background: 'transparent', border: 'none', color: C.gold, fontFamily: SYNE, fontWeight: 700, fontSize: 13, outline: 'none', width: '100%' }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}