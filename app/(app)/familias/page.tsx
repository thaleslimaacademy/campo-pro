'use client'
import { useEffect, useState, useTransition } from 'react'
import AdminGuard from '@/components/AdminGuard'
import BottomNav from '@/components/ui/BottomNav'
import { listarFamiliasPendentes, confirmarFamilia, rejeitarFamilia, desvincularAtleta } from './actions'

const T = { bg: '#0A0E1A', surface: '#0D1220', primary: '#4169E1', accent: '#00BFFF', text: '#F0F4FF', muted: 'rgba(240,244,255,0.4)', border: 'rgba(240,244,255,0.08)', green: '#00D67A', red: '#FF4444', gold: '#FFD700' }
const SYNE = 'Syne, sans-serif'

type Atleta = { id: string; nome: string; familiaId: string | null; valorMensalidade: number | null; diaVencimento: number | null }
type Familia = {
  id: string
  nomeResponsavel: string | null
  cpfResponsavel: string | null
  whatsappResponsavel: string | null
  status: string
  createdAt: string
  atletas: Atleta[]
}

function FamiliasInner() {
  const [familias, setFamilias] = useState<Familia[]>([])
  const [loading, startLoad] = useTransition()
  const [processando, startProcess] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  function carregar() {
    startLoad(async () => {
      const d = await listarFamiliasPendentes()
      setFamilias(d as Familia[])
    })
  }
  useEffect(() => { carregar() }, [])

  function confirmar(familiaId: string) {
    setErro(null)
    startProcess(async () => {
      const r = await confirmarFamilia(familiaId)
      if (!r.ok) { setErro(r.erro || 'Não foi possível confirmar.'); return }
      carregar()
    })
  }

  function rejeitar(familiaId: string) {
    startProcess(async () => {
      await rejeitarFamilia(familiaId)
      carregar()
    })
  }

  function remover(atletaId: string, familiaId: string) {
    startProcess(async () => {
      await desvincularAtleta(atletaId, familiaId)
      carregar()
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '0 0 80px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: T.primary, padding: '20px 20px 16px' }}>
        <div style={{ fontSize: 10, color: 'rgba(240,244,255,0.65)', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Financeiro</div>
        <div style={{ fontFamily: SYNE, fontWeight: 900, fontSize: 26, color: T.text, letterSpacing: -0.8, textTransform: 'uppercase' }}>
          Famílias <span style={{ color: '#7DD3FC', fontStyle: 'italic' }}>{familias.length}</span>
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>
          O sistema encontrou responsáveis com mais de um atleta cadastrado (mesmo CPF ou WhatsApp).
          Confirme só se forem de fato a mesma família — a partir da confirmação, a mensalidade dos
          filhos passa a ser cobrada junto, num PIX só.
        </p>

        {erro && (
          <div style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', borderRadius: 8, padding: 12, marginBottom: 16, color: T.red, fontSize: 13 }}>
            {erro}
          </div>
        )}

        {loading && <p style={{ color: T.muted, textAlign: 'center', padding: 40, fontSize: 13 }}>Carregando...</p>}

        {!loading && familias.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <i className="ti ti-users" style={{ fontSize: 48, color: T.border, display: 'block', marginBottom: 12 }} aria-hidden="true"></i>
            <p style={{ fontSize: 13, color: T.muted }}>Nenhuma família pendente de confirmação no momento.</p>
          </div>
        )}

        {familias.map((familia) => (
          <div key={familia.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 15, color: T.text, margin: '0 0 4px' }}>
              {familia.nomeResponsavel || 'Responsável sem nome cadastrado'}
            </p>
            <p style={{ fontSize: 12, color: T.muted, margin: '0 0 2px' }}>CPF: {familia.cpfResponsavel || '—'}</p>
            <p style={{ fontSize: 12, color: T.muted, margin: '0 0 14px' }}>WhatsApp: {familia.whatsappResponsavel || '—'}</p>

            {familia.atletas.map((a) => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${T.border}` }}>
                <div>
                  <p style={{ fontSize: 13, color: T.text, fontWeight: 600, margin: 0 }}>{a.nome}</p>
                  <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>
                    R$ {Number(a.valorMensalidade || 0).toFixed(2)} · vencimento dia {a.diaVencimento ?? '—'}
                  </p>
                </div>
                <button
                  onClick={() => remover(a.id, familia.id)}
                  disabled={processando}
                  style={{ background: 'none', border: 'none', color: T.muted, fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  remover
                </button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => confirmar(familia.id)}
                disabled={processando}
                style={{ flex: 1, background: T.green, color: '#001', padding: '11px', borderRadius: 8, fontFamily: SYNE, fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer', textTransform: 'uppercase', opacity: processando ? 0.6 : 1 }}
              >
                ✅ Confirmar
              </button>
              <button
                onClick={() => rejeitar(familia.id)}
                disabled={processando}
                style={{ flex: 1, background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', color: T.red, padding: '11px', borderRadius: 8, cursor: 'pointer', fontFamily: SYNE, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', opacity: processando ? 0.6 : 1 }}
              >
                ❌ Não é a mesma família
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}

export default function FamiliasPage() {
  return <AdminGuard><FamiliasInner /></AdminGuard>
}
