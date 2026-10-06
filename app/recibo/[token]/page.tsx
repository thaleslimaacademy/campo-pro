import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { referenciaCobranca } from '@/lib/avisoPagamento'
import BotaoBaixarRecibo from './BotaoBaixarRecibo'

// Pagina publica do recibo. O acesso e pelo token (16 caracteres aleatorios),
// enviado so ao responsavel no aviso de pagamento. Nao aparece no Google.
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Recibo de pagamento',
  robots: { index: false, follow: false },
}

const C = {
  bg: '#F6F8F7', surface: '#FFFFFF', text: '#1F2937', muted: '#6B7280', border: '#E3E8E5',
  green: '#2EA866', greenDark: '#23874F', greenSoft: '#E7F5ED', blue: '#4169E1',
}
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

const FORMA: Record<string, string> = {
  PIX: 'Pix', DINHEIRO: 'Dinheiro', CARTAO: 'Cartão', CARTAO_CREDITO: 'Cartão de crédito',
  CARTAO_DEBITO: 'Cartão de débito', CARTAO_RECORRENTE: 'Cartão (débito automático)',
  BOLETO: 'Boleto', TRANSFERENCIA: 'Transferência', FAMILIA: 'Pix (família)', MANUAL: 'Recebido na escolinha',
}

const brl = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

/** pagoEm vem como data pura (webhook) ou timestamp UTC sem fuso (baixa manual). */
function dataPagamento(v: string | null): { iso: string; texto: string } {
  if (!v) return { iso: new Date().toISOString().slice(0, 10), texto: '—' }
  const s = String(v).replace(' ', 'T')
  const soData = s.length <= 10 || /T00:00:00(\.0+)?$/.test(s)
  const d = soData ? new Date(s.slice(0, 10) + 'T12:00:00Z') : new Date(s.endsWith('Z') ? s : s + 'Z')
  const iso = d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const texto = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'long', year: 'numeric' })
    + (soData ? '' : ' às ' + d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }))
  return { iso, texto }
}

function Indisponivel() {
  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: INTER, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, maxWidth: 360, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>🧾</div>
        <h1 style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 18, color: C.text, margin: '10px 0 6px' }}>Recibo indisponível</h1>
        <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.5 }}>Este link não é válido ou o pagamento foi estornado. Fale com a escolinha.</p>
      </div>
    </main>
  )
}

export default async function ReciboPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[A-Za-z0-9_-]{12,40}$/.test(token)) return <Indisponivel />

  const { data: c } = await supabaseAdmin.from('Cobranca')
    .select('id, escolaId, atletaId, atletaNome, valor, valorPago, descricao, competencia, vencimento, pagoEm, status, tipo, excluidaEm')
    .eq('reciboToken', token).maybeSingle()
  if (!c || c.status !== 'PAGO' || c.excluidaEm) return <Indisponivel />

  const [{ data: escola }, { data: atleta }, { data: resp }] = await Promise.all([
    supabaseAdmin.from('Escola').select('nome, logoUrl, cidade, estado, corPrimaria, corSecundaria, whatsapp, telefone').eq('id', c.escolaId).maybeSingle(),
    c.atletaId ? supabaseAdmin.from('Atleta').select('nome').eq('id', c.atletaId).maybeSingle() : Promise.resolve({ data: null }),
    c.atletaId ? supabaseAdmin.from('Responsavel').select('nome').eq('atletaId', c.atletaId).order('principal', { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null }),
  ])

  const nomeEscola = escola?.nome?.includes('—') ? escola.nome.split('—').pop()!.trim() : (escola?.nome || 'Escolinha')
  const nomeAtleta = (c.atletaNome as string)?.trim() || (atleta as { nome?: string } | null)?.nome || 'Atleta'
  const responsavel = (resp as { nome?: string } | null)?.nome || null
  const valor = Number(c.valorPago ?? c.valor ?? 0)
  const referencia = referenciaCobranca(c)
  const pago = dataPagamento(c.pagoEm as string | null)
  const venc = c.vencimento ? String(c.vencimento).slice(0, 10) : null
  const vencTexto = venc ? new Date(venc + 'T12:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'
  const numero = String(c.id).slice(0, 8).toUpperCase()
  const forma = FORMA[String(c.tipo || '').toUpperCase()] || 'Pagamento confirmado'

  const linha = (rotulo: string, valorTxt: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '11px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 13, color: C.muted }}>{rotulo}</span>
      <span style={{ fontSize: 14, color: C.text, fontWeight: 600, textAlign: 'right' }}>{valorTxt}</span>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: C.bg, fontFamily: INTER, padding: '0 0 32px' }}>
      <div style={{ background: C.blue, padding: '22px 16px 64px', textAlign: 'center' }}>
        {escola?.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={escola.logoUrl} alt="" width={64} height={64} style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 14, background: '#fff', padding: 6 }} />
        )}
        <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 16, color: '#fff', marginTop: 10 }}>{nomeEscola}</div>
      </div>

      <div style={{ maxWidth: 460, margin: '-44px auto 0', padding: '0 16px' }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '22px 20px', boxShadow: '0 8px 24px rgba(16,24,40,0.06)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.greenSoft, color: C.greenDark, fontWeight: 700, fontSize: 12, padding: '6px 12px', borderRadius: 999 }}>
              ✅ Pagamento confirmado
            </div>
            <div style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 34, color: C.text, margin: '14px 0 2px' }}>{brl(valor)}</div>
            <div style={{ fontSize: 13, color: C.muted }}>{referencia}</div>
          </div>

          <div style={{ marginTop: 18 }}>
            {linha('Atleta', nomeAtleta)}
            {responsavel && linha('Responsável', responsavel)}
            {linha('Pago em', pago.texto)}
            {linha('Vencimento', vencTexto)}
            {linha('Forma', forma)}
            {linha('Recibo nº', numero)}
          </div>

          <BotaoBaixarRecibo dados={{
            tipo: 'MENSALIDADE', nome: nomeAtleta, valor, descricao: referencia,
            vencimento: venc ?? undefined, dataPagamento: pago.iso, numero,
            escolaNome: escola?.nome ?? undefined, escolaCidade: escola?.cidade ?? undefined, escolaEstado: escola?.estado ?? undefined,
            escolaLogoUrl: escola?.logoUrl ?? undefined, corPrimaria: escola?.corPrimaria ?? undefined, corSecundaria: escola?.corSecundaria ?? undefined,
            responsavelNome: responsavel ?? undefined,
          }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 16, lineHeight: 1.5 }}>
          Guarde este link: ele é o seu comprovante.<br />Emitido via gestaofc.com.br
        </p>
      </div>
    </main>
  )
}
