
'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CONTRATO = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESPORTIVOS

CLÁUSULA 1 — DO OBJETO
O presente contrato tem por objeto a prestação de serviços de treinamento e formação esportiva na modalidade futebol, oferecidos pela academia denominada ACADEMY, ao atleta identificado na ficha de matrícula.

CLÁUSULA 2 — DA MATRÍCULA E MENSALIDADE
2.1 A matrícula do ATLETA somente será confirmada após a assinatura deste contrato e aprovação da ficha pelo responsável da ACADEMY.
2.2 O valor da mensalidade será informado no ato da matrícula e poderá ser reajustado anualmente, mediante aviso prévio de 30 (trinta) dias.
2.3 O vencimento da mensalidade ocorrerá todo dia 10 de cada mês.
2.4 Em caso de não pagamento até a data de vencimento, incidirão:
- Multa de 2% sobre o valor da mensalidade
- Juros de mora de 1% ao mês, calculados pro rata die
2.5 O atraso superior a 60 dias poderá acarretar a suspensão do ATLETA.
2.6 O atraso superior a 90 dias implicará no cancelamento automático da matrícula.

CLÁUSULA 3 — DO CANCELAMENTO
3.1 O cancelamento deverá ser comunicado por escrito com antecedência mínima de 30 dias.
3.2 Não haverá devolução de mensalidades já pagas.

CLÁUSULA 4 — DAS OBRIGAÇÕES DO CONTRATANTE
4.1 Manter os dados cadastrais sempre atualizados.
4.2 Informar qualquer condição de saúde ou limitação física do ATLETA.
4.3 Responsabilizar-se pelo transporte do ATLETA até o local de treinamento.

CLÁUSULA 5 — DO DIREITO DE IMAGEM E VOZ
5.1 O CONTRATANTE autoriza, em caráter gratuito e por prazo indeterminado, o uso da imagem e nome do ATLETA pela ACADEMY para divulgação em redes sociais e materiais promocionais.

CLÁUSULA 6 — DO FORO
As partes elegem o foro da Comarca de Iturama - MG.`

function PainelAssinatura({ onAssinar, disabled }: { onAssinar: (img: string) => void; disabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const desenhando = useRef(false)
  const [temAssinatura, setTemAssinatura] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY }
  }

  function iniciar(e: React.TouchEvent | React.MouseEvent) {
    if (disabled) return
    e.preventDefault()
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    desenhando.current = true
    const pos = getPos(e, canvas)
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
  }

  function desenhar(e: React.TouchEvent | React.MouseEvent) {
    if (!desenhando.current || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y); ctx.stroke()
    setTemAssinatura(true)
  }

  function parar() { desenhando.current = false }

  function limpar() {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.fillStyle = '#1f2937'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    setTemAssinatura(false)
  }

  function confirmar() {
    const canvas = canvasRef.current; if (!canvas) return
    onAssinar(canvas.toDataURL('image/png'))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm text-gray-400">Assine com o dedo abaixo *</label>
        {temAssinatura && <button onClick={limpar} type="button" className="text-xs text-red-400 underline">Limpar</button>}
      </div>
      <canvas ref={canvasRef} width={600} height={180}
        className="w-full rounded-xl border-2 border-dashed border-gray-600 touch-none"
        style={{ background: '#1f2937' }}
        onMouseDown={iniciar} onMouseMove={desenhar} onMouseUp={parar} onMouseLeave={parar}
        onTouchStart={iniciar} onTouchMove={desenhar} onTouchEnd={parar}
      />
      {!temAssinatura && <p className="text-xs text-gray-500 text-center mt-2">Use o dedo para assinar</p>}
      {temAssinatura && (
        <button type="button" onClick={confirmar} className="w-full mt-3 bg-green-600 text-white py-2 rounded-lg text-sm font-bold">
          Usar esta assinatura
        </button>
      )}
    </div>
  )
}

// ── Tela de pagamento pós matrícula ──────────────────────────────
function TelaPagamento({
  escolaId, matriculaId, valorMatricula, escolaNome,
  nomeAtleta, onFinalizar,
}: {
  escolaId: string; matriculaId: string; valorMatricula: number
  escolaNome: string; nomeAtleta: string; onFinalizar: () => void
}) {
  const [metodo, setMetodo] = useState<'PIX' | 'CARTAO' | 'DINHEIRO' | null>(null)
  const [loading, setLoading] = useState(false)
  const [pix, setPix] = useState<{ copiaCola: string; qrCode: string } | null>(null)
  const [linkCartao, setLinkCartao] = useState<string | null>(null)
  const [dinheiroConfirmado, setDinheiroConfirmado] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function pagar(m: 'PIX' | 'CARTAO' | 'DINHEIRO') {
    setMetodo(m)
    if (m === 'DINHEIRO') {
      setLoading(true)
      await fetch('/api/matricula/aviso-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matriculaId, escolaId }),
      })
      setDinheiroConfirmado(true)
      setLoading(false)
      return
    }
    setLoading(true)
    const res = await fetch('/api/matricula/cobranca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matriculaId, escolaId, metodoPagamento: m }),
    })
    const data = await res.json()
    setLoading(false)
    if (!data.ok) { alert('Erro: ' + (data.error || 'Tente novamente')); return }
    if (m === 'PIX') setPix({ copiaCola: data.pixCopiaCola, qrCode: data.pixQrCode })
    if (m === 'CARTAO') setLinkCartao(data.linkPagamento)
  }

  function copiarPix() {
    navigator.clipboard.writeText(pix!.copiaCola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // ── Estado: escolha do método ──
  if (!metodo) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col">
        <div className="text-center mb-8">
          <p className="text-5xl mb-3">🎉</p>
          <h2 className="text-2xl font-bold mb-1">Pré-matrícula enviada!</h2>
          <p className="text-gray-400 text-sm">Agora escolha como pagar a taxa de matrícula</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6 text-center">
          <p className="text-gray-400 text-sm">Atleta</p>
          <p className="text-white font-bold text-lg">{nomeAtleta}</p>
          <p className="text-gray-400 text-xs mt-1">Taxa de matrícula</p>
          <p className="text-green-400 font-bold text-3xl mt-1">{brl(valorMatricula)}</p>
        </div>

        <p className="text-gray-400 text-sm font-bold uppercase mb-3">Forma de pagamento</p>
        <div className="space-y-3">
          <button onClick={() => pagar('PIX')}
            className="w-full bg-green-600/10 border border-green-600/40 hover:border-green-500 text-white py-4 rounded-xl font-bold text-base transition flex items-center gap-4 px-5">
            <span className="text-3xl">⚡</span>
            <div className="text-left">
              <p className="font-bold">PIX</p>
              <p className="text-green-400 text-xs font-normal">Pagamento instantâneo</p>
            </div>
          </button>

          <button onClick={() => pagar('CARTAO')}
            className="w-full bg-blue-600/10 border border-blue-600/40 hover:border-blue-500 text-white py-4 rounded-xl font-bold text-base transition flex items-center gap-4 px-5">
            <span className="text-3xl">💳</span>
            <div className="text-left">
              <p className="font-bold">Cartão de crédito</p>
              <p className="text-blue-400 text-xs font-normal">Link de pagamento seguro</p>
            </div>
          </button>

          <button onClick={() => pagar('DINHEIRO')}
            className="w-full bg-yellow-600/10 border border-yellow-600/40 hover:border-yellow-500 text-white py-4 rounded-xl font-bold text-base transition flex items-center gap-4 px-5">
            <span className="text-3xl">💵</span>
            <div className="text-left">
              <p className="font-bold">Dinheiro</p>
              <p className="text-yellow-400 text-xs font-normal">Pagamento presencial</p>
            </div>
          </button>
        </div>

        {loading && <p className="text-center text-gray-400 text-sm mt-6 animate-pulse">Gerando cobrança...</p>}
      </div>
    )
  }

  // ── Estado: PIX ──
  if (metodo === 'PIX' && pix) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">⚡</p>
          <h2 className="text-xl font-bold">Pague com PIX</h2>
          <p className="text-gray-400 text-sm mt-1">Valor: <span className="text-green-400 font-bold">{brl(valorMatricula)}</span></p>
        </div>
        {pix.qrCode && (
          <div className="flex justify-center mb-4">
            <img src={`data:image/png;base64,${pix.qrCode}`} alt="QR Code PIX" className="w-52 h-52 rounded-xl border-4 border-gray-700" />
          </div>
        )}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <p className="text-xs text-gray-400 mb-2">PIX Copia e Cola</p>
          <p className="text-xs text-gray-300 break-all font-mono leading-relaxed">{pix.copiaCola}</p>
        </div>
        <button onClick={copiarPix}
          className={`w-full py-4 rounded-xl font-bold text-base mb-3 transition ${copiado ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {copiado ? '✅ Copiado!' : '📋 Copiar código PIX'}
        </button>
        <button onClick={onFinalizar} className="w-full bg-gray-800 text-gray-400 py-3 rounded-xl text-sm">
          Já paguei — Finalizar
        </button>
      </div>
    )
  }

  // ── Estado: Cartão ──
  if (metodo === 'CARTAO' && linkCartao) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center text-center">
        <p className="text-5xl mb-4">💳</p>
        <h2 className="text-xl font-bold mb-2">Pagamento com Cartão</h2>
        <p className="text-gray-400 text-sm mb-6">Valor: <span className="text-blue-400 font-bold">{brl(valorMatricula)}</span></p>
        <a href={linkCartao} target="_blank" rel="noreferrer"
          className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-base text-center block mb-4 transition">
          💳 Pagar agora
        </a>
        <button onClick={onFinalizar} className="text-sm text-gray-500 underline">Já paguei — Finalizar</button>
      </div>
    )
  }

  // ── Estado: Dinheiro ──
  if (metodo === 'DINHEIRO' && dinheiroConfirmado) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center text-center">
        <p className="text-5xl mb-4">💵</p>
        <h2 className="text-xl font-bold mb-2">Pagamento em dinheiro</h2>
        <p className="text-gray-400 text-sm mb-2">
          Valor: <span className="text-yellow-400 font-bold">{brl(valorMatricula)}</span>
        </p>
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4 mt-4 mb-6 max-w-sm text-left">
          <p className="text-yellow-400 font-bold text-sm mb-2">⚠️ Importante</p>
          <p className="text-gray-300 text-sm">O pagamento será realizado presencialmente. Nossa equipe já foi notificada e entrará em contato para combinar.</p>
        </div>
        <button onClick={onFinalizar} className="w-full max-w-sm bg-gray-800 text-white py-4 rounded-xl font-bold text-base">
          Entendido — Finalizar
        </button>
      </div>
    )
  }

  // loading intermediário
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">Processando...</p>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────
interface Props {
  escolaId: string
  escolaNome: string
  escolaLogoUrl?: string | null
  valorMatricula: number
}

export default function MatriculaClient({ escolaId, escolaNome, escolaLogoUrl, valorMatricula }: Props) {
  const [etapa, setEtapa] = useState<'form' | 'contrato' | 'pagamento' | 'sucesso'>('form')
  const [loading, setLoading] = useState(false)
  const [contratoLido, setContratoLido] = useState(false)
  const [aceito, setAceito] = useState(false)
  const [assinaturaImg, setAssinaturaImg] = useState<string | null>(null)
  const [nomeAssinatura, setNomeAssinatura] = useState('')
  const [dados, setDados] = useState<Record<string, string>>({})
  const [erros, setErros] = useState<string[]>([])
  const [matriculaId, setMatriculaId] = useState<string | null>(null)
  const [nomeAtleta, setNomeAtleta] = useState('')

  async function buscarCep(cep: string) {
    if (cep.replace(/\D/g, '').length !== 8) return
    const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`)
    const data = await res.json()
    if (!data.erro) setDados(prev => ({ ...prev, endereco: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setDados(prev => ({ ...prev, [name]: value }))
    if (name === 'cep') buscarCep(value)
    setErros([])
  }

  function avancarContrato(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const novosErros: string[] = []
    if (!dados.cpf?.trim() && !dados.rg?.trim()) novosErros.push('CPF ou RG do atleta é obrigatório.')
    if (!dados.cpfResponsavel?.trim()) novosErros.push('CPF do responsável é obrigatório para pagamento.')
    if (novosErros.length > 0) { setErros(novosErros); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    setEtapa('contrato'); window.scrollTo(0, 0)
  }

  async function confirmarMatricula() {
    if (!aceito || !assinaturaImg || !nomeAssinatura.trim()) return
    setLoading(true)
    const { data, error } = await supabase.from('Matricula').insert({
      escolaId,
      nomeAtleta: dados.nome,
      dataNascimento: dados.nascimento,
      cpf: dados.cpf || null,
      rg: dados.rg || null,
      posicao: dados.posicao || 'Goleiro',
      telefone: dados.telefone || null,
      cep: dados.cep || null,
      endereco: dados.endereco || null,
      numero: dados.numero || null,
      bairro: dados.bairro || null,
      cidade: dados.cidade || null,
      estado: dados.estado || null,
      nomeResponsavel: dados.responsavel,
      whatsappResponsavel: dados.whatsapp,
      emailResponsavel: dados.email || null,
      cpfResponsavel: dados.cpfResponsavel,
      contratoAceito: true,
      nomeAssinatura: nomeAssinatura.trim(),
      dataAssinatura: new Date().toISOString(),
      status: 'PENDENTE',
    }).select('id').single()

    if (error || !data) { alert('Erro ao enviar matrícula: ' + (error?.message || 'Tente novamente')); setLoading(false); return }
    setMatriculaId(data.id)
    setNomeAtleta(dados.nome)
    setLoading(false)

    // Se valor de matrícula configurado, vai para pagamento; senão, finaliza
    if (valorMatricula > 0) {
      setEtapa('pagamento')
    } else {
      setEtapa('sucesso')
    }
  }

  // ── Tela final ──
  if (etapa === 'sucesso') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-7xl mb-4">✅</p>
        <h2 className="text-2xl font-bold mb-2">Tudo certo!</h2>
        <p className="text-gray-400 mb-2">Pré-matrícula enviada com sucesso.</p>
        <p className="text-gray-400 text-sm">A equipe da <span className="text-green-400 font-bold">{escolaNome}</span> irá analisar e confirmar em breve.</p>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mt-6 text-left w-full max-w-sm">
          <p className="text-green-500 font-bold text-sm mb-2">Próximos passos</p>
          <p className="text-gray-400 text-sm">1. Nossa equipe analisa a ficha</p>
          <p className="text-gray-400 text-sm">2. Você recebe confirmação via WhatsApp</p>
          <p className="text-gray-400 text-sm">3. Atleta é incluído nos treinos</p>
        </div>
      </div>
    )
  }

  // ── Tela de pagamento ──
  if (etapa === 'pagamento' && matriculaId) {
    return (
      <TelaPagamento
        escolaId={escolaId}
        matriculaId={matriculaId}
        valorMatricula={valorMatricula}
        escolaNome={escolaNome}
        nomeAtleta={nomeAtleta}
        onFinalizar={() => setEtapa('sucesso')}
      />
    )
  }

  // ── Tela do contrato ──
  if (etapa === 'contrato') {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setEtapa('form')} className="text-gray-400">← Voltar</button>
          <h1 className="text-xl font-bold">Contrato</h1>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4 text-center">
          <p className="text-green-500 font-bold">Academia Esportiva</p>
          <p className="text-green-400 font-bold text-lg">{escolaNome}</p>
        </div>
        <div
          className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4 h-72 overflow-y-auto text-sm text-gray-300 leading-relaxed"
          onScroll={e => { const el = e.currentTarget; if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) setContratoLido(true) }}
        >
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">{CONTRATO}</pre>
          {contratoLido && <p className="text-green-500 text-center mt-4 font-bold">Contrato lido!</p>}
        </div>
        {!contratoLido && <p className="text-yellow-500 text-xs text-center mb-4">Role até o final para habilitar a assinatura</p>}
        <div className={`bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4 transition-opacity ${contratoLido ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <p className="text-green-500 font-bold text-sm mb-4">Assinatura Digital</p>
          <div className="mb-4">
            <label className="text-sm text-gray-400">Nome completo do responsável *</label>
            <input value={nomeAssinatura} onChange={e => setNomeAssinatura(e.target.value)} type="text" placeholder="Seu nome completo" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
          </div>
          <PainelAssinatura disabled={!contratoLido} onAssinar={(img) => setAssinaturaImg(img)} />
          {assinaturaImg && (
            <div className="mt-4 border border-green-600/30 rounded-xl p-3 bg-green-600/5">
              <p className="text-xs text-green-500 mb-2">Assinatura capturada</p>
              <img src={assinaturaImg} alt="Assinatura" className="w-full rounded-lg max-h-24 object-contain bg-gray-800" />
              <button onClick={() => setAssinaturaImg(null)} type="button" className="text-xs text-red-400 underline mt-2">Refazer</button>
            </div>
          )}
          <label className="flex items-start gap-3 cursor-pointer mt-4">
            <input type="checkbox" checked={aceito} onChange={e => setAceito(e.target.checked)} className="mt-1 w-5 h-5 accent-green-500" />
            <span className="text-sm text-gray-300">Li e concordo com o Contrato de Prestação de Serviços, incluindo mensalidade, direito de imagem e responsabilidade civil.</span>
          </label>
        </div>
        <button onClick={confirmarMatricula} disabled={!aceito || !assinaturaImg || !nomeAssinatura.trim() || loading}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-40">
          {loading ? 'Enviando...' : valorMatricula > 0 ? `Confirmar e pagar taxa →` : 'Confirmar Pré-matrícula'}
        </button>
      </div>
    )
  }

  // ── Formulário ──
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="text-center mb-6">
        {escolaLogoUrl ? <img src={escolaLogoUrl} alt={escolaNome} className="h-16 mx-auto mb-2 object-contain" /> : <p className="text-4xl mb-2">⚽</p>}
        <h1 className="text-xl font-bold text-green-500">{escolaNome}</h1>
        <p className="text-gray-400 text-sm">Ficha de Pré-matrícula</p>
        {valorMatricula > 0 && (
          <p className="text-xs text-yellow-400 mt-1">Taxa de matrícula: <span className="font-bold">{valorMatricula.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
        )}
      </div>
      {erros.length > 0 && (
        <div className="bg-red-600/20 border border-red-600/40 rounded-xl p-4 mb-4">
          {erros.map((erro, i) => <p key={i} className="text-red-400 text-sm font-bold">❌ {erro}</p>)}
        </div>
      )}
      <form onSubmit={avancarContrato} className="space-y-4">
        <p className="text-green-500 font-bold text-sm uppercase">Dados do Atleta</p>
        <div><label className="text-sm text-gray-400">Nome completo *</label><input name="nome" required type="text" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: João Silva" /></div>
        <div><label className="text-sm text-gray-400">Data de nascimento *</label><input name="nascimento" required type="date" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" /></div>
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-3">
          <p className="text-yellow-400 text-xs font-bold mb-2">⚠️ Pelo menos CPF ou RG do atleta é obrigatório</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm text-gray-400">CPF do atleta</label><input name="cpf" type="text" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="000.000.000-00" /></div>
            <div><label className="text-sm text-gray-400">RG do atleta</label><input name="rg" type="text" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="0000000" /></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm text-gray-400">Posição</label><select name="posicao" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white"><option>Goleiro</option><option>Zagueiro</option><option>Lateral</option><option>Volante</option><option>Meia</option><option>Atacante</option></select></div>
          <div><label className="text-sm text-gray-400">Telefone</label><input name="telefone" type="tel" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="(34) 99999-9999" /></div>
        </div>
        <p className="text-green-500 font-bold text-sm uppercase pt-2">Endereço</p>
        <div><label className="text-sm text-gray-400">CEP</label><input name="cep" type="text" maxLength={9} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="00000-000" /></div>
        <div><label className="text-sm text-gray-400">Endereço</label><input name="endereco" type="text" value={dados?.endereco || ''} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Rua, Avenida..." /></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-sm text-gray-400">Número</label><input name="numero" type="text" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="123" /></div>
          <div className="col-span-2"><label className="text-sm text-gray-400">Bairro</label><input name="bairro" type="text" value={dados?.bairro || ''} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Bairro" /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2"><label className="text-sm text-gray-400">Cidade</label><input name="cidade" type="text" value={dados?.cidade || ''} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Cidade" /></div>
          <div><label className="text-sm text-gray-400">Estado</label><input name="estado" type="text" maxLength={2} value={dados?.estado || ''} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="MG" /></div>
        </div>
        <p className="text-green-500 font-bold text-sm uppercase pt-2">Responsável</p>
        <div><label className="text-sm text-gray-400">Nome do responsável *</label><input name="responsavel" required type="text" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: Maria Silva" /></div>
        <div><label className="text-sm text-gray-400">CPF do responsável * <span className="text-yellow-400 text-xs">(obrigatório para pagamento)</span></label><input name="cpfResponsavel" type="text" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="000.000.000-00" /></div>
        <div><label className="text-sm text-gray-400">WhatsApp *</label><input name="whatsapp" required type="tel" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="(34) 99999-9999" /></div>
        <div><label className="text-sm text-gray-400">E-mail</label><input name="email" type="email" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="email@exemplo.com" /></div>
        <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg mt-4">
          Avançar para o Contrato →
        </button>
      </form>
    </div>
  )
}
