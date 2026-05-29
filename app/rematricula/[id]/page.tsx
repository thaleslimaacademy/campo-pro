'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CONTRATO = `CONTRATO DE RENOVAÇÃO DE SERVIÇOS ESPORTIVOS
ASSOCIAÇÃO ESPORTIVA THALES LIMA FOOTBALL ACADEMY

CLÁUSULA 1 — DO OBJETO
O presente contrato tem por objeto a renovação dos serviços de treinamento e formação esportiva na modalidade futebol, oferecidos pela Associação Esportiva Thales Lima Football Academy, doravante denominada ACADEMY, ao atleta identificado nesta ficha de rematrícula.

CLÁUSULA 2 — DA RENOVAÇÃO E MENSALIDADE
2.1 A renovação da matrícula do ATLETA somente será confirmada após a assinatura deste contrato e aprovação pelo responsável da ACADEMY.
2.2 O valor da mensalidade será informado no ato da renovação e poderá ser reajustado anualmente, mediante aviso prévio de 30 (trinta) dias.
2.3 O vencimento da mensalidade ocorrerá todo dia 10 de cada mês.
2.4 Em caso de não pagamento até a data de vencimento, incidirão:
- Multa de 2% (dois por cento) sobre o valor da mensalidade
- Juros de mora de 1% (um por cento) ao mês, calculados pro rata die
2.5 O atraso superior a 60 (sessenta) dias poderá acarretar a suspensão do ATLETA das atividades.
2.6 O atraso superior a 90 (noventa) dias implicará no cancelamento automático da matrícula.

CLÁUSULA 3 — DO CANCELAMENTO E DESISTÊNCIA
3.1 O cancelamento deverá ser comunicado por escrito com antecedência mínima de 30 (trinta) dias.
3.2 Não haverá devolução de mensalidades já pagas.

CLÁUSULA 4 — DAS OBRIGAÇÕES DO CONTRATANTE
4.1 Manter os dados cadastrais sempre atualizados.
4.2 Informar qualquer condição de saúde ou limitação física do ATLETA.
4.3 Responsabilizar-se pelo transporte do ATLETA até o local de treinamento.
4.4 Tratar com respeito todos os treinadores, funcionários e demais atletas.

CLÁUSULA 5 — DO DIREITO DE IMAGEM E VOZ
5.1 O CONTRATANTE autoriza, em caráter gratuito, irrevogável e por prazo indeterminado, o uso da imagem e nome do ATLETA pela ACADEMY para fins de divulgação nas redes sociais e material promocional.

CLÁUSULA 6 — DO FORO
As partes elegem o foro da Comarca de Iturama - MG para dirimir quaisquer dúvidas ou litígios.

CLÁUSULA 7 — DA ASSINATURA DIGITAL
Este contrato é celebrado em meio digital, tendo plena validade jurídica nos termos da MP nº 2.200-2/2001 e do Marco Civil da Internet (Lei nº 12.965/2014).`

function PainelAssinatura({ onAssinar, disabled }: { onAssinar: (img: string) => void, disabled: boolean }) {
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
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY }
  }

  function iniciar(e: React.TouchEvent | React.MouseEvent) {
    if (disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    desenhando.current = true
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function desenhar(e: React.TouchEvent | React.MouseEvent) {
    if (!desenhando.current || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setTemAssinatura(true)
  }

  function parar() { desenhando.current = false }

  function limpar() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setTemAssinatura(false)
  }

  function confirmar() {
    const canvas = canvasRef.current
    if (!canvas) return
    onAssinar(canvas.toDataURL('image/png'))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm text-gray-400">Assine com o dedo *</label>
        {temAssinatura && <button onClick={limpar} type="button" className="text-xs text-red-400 underline">Limpar</button>}
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        className="w-full rounded-xl border-2 border-dashed border-gray-600 touch-none"
        style={{ background: '#1f2937' }}
        onMouseDown={iniciar}
        onMouseMove={desenhar}
        onMouseUp={parar}
        onMouseLeave={parar}
        onTouchStart={iniciar}
        onTouchMove={desenhar}
        onTouchEnd={parar}
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

export default function Rematricula() {
  const params = useParams()
  const id = params.id as string

  const [atleta, setAtleta] = useState<any>(null)
  const [responsavel, setResponsavel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [etapa, setEtapa] = useState<'form' | 'contrato' | 'sucesso'>('form')
  const [salvando, setSalvando] = useState(false)
  const [contratoLido, setContratoLido] = useState(false)
  const [aceito, setAceito] = useState(false)
  const [assinaturaImg, setAssinaturaImg] = useState<string | null>(null)
  const [nomeAssinatura, setNomeAssinatura] = useState('')
  const [erros, setErros] = useState<string[]>([])
  const [form, setForm] = useState({
    nomeResponsavel: '',
    cpfResponsavel: '',
    whatsapp: '',
    email: '',
    telefoneAtleta: '',
    posicao: '',
  })

  useEffect(() => {
    async function carregar() {
      const { data: at } = await supabase
        .from('Atleta')
        .select('*')
        .eq('id', id)
        .single()
      setAtleta(at)

      if (at) {
        const { data: resp } = await supabase
          .from('Responsavel')
          .select('*')
          .eq('atletaId', id)
          .single()
        setResponsavel(resp)
        setForm({
          nomeResponsavel: resp?.nome || '',
          cpfResponsavel: '',
          whatsapp: resp?.whatsapp || '',
          email: '',
          telefoneAtleta: at.telefone || '',
          posicao: at.posicao || 'Goleiro',
        })
        setNomeAssinatura(resp?.nome || '')
      }
      setLoading(false)
    }
    carregar()
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErros([])
  }

  function avancarContrato(e: React.FormEvent) {
    e.preventDefault()
    const novosErros: string[] = []
    if (!form.nomeResponsavel.trim()) novosErros.push('Nome do responsável é obrigatório.')
    if (!form.cpfResponsavel.trim()) novosErros.push('CPF do responsável é obrigatório.')
    if (!form.whatsapp.trim()) novosErros.push('WhatsApp é obrigatório.')
    if (novosErros.length > 0) { setErros(novosErros); return }
    setErros([])
    setEtapa('contrato')
    window.scrollTo(0, 0)
  }

  async function confirmarRematricula() {
    if (!aceito || !assinaturaImg || !nomeAssinatura.trim()) return
    setSalvando(true)

    await supabase.from('Matricula').insert({
      escolaId: 'escola-demo',
      nomeAtleta: atleta.nome,
      dataNascimento: atleta.dataNascimento,
      cpf: atleta.cpf || null,
      rg: atleta.rg || null,
      posicao: form.posicao,
      telefone: form.telefoneAtleta || null,
      nomeResponsavel: form.nomeResponsavel,
      whatsappResponsavel: form.whatsapp,
      emailResponsavel: form.email || null,
      cpfResponsavel: form.cpfResponsavel,
      contratoAceito: true,
      nomeAssinatura: nomeAssinatura.trim(),
      dataAssinatura: new Date().toISOString(),
      status: 'PENDENTE',
      tipo: 'rematricula',
      atletaId_rematricula: atleta.id,
    })

    setEtapa('sucesso')
    setSalvando(false)
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

  if (etapa === 'sucesso') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-7xl mb-4">🎉</p>
        <h2 className="text-2xl font-bold mb-2">Rematrícula enviada!</h2>
        <p className="text-gray-400 mb-2">Recebemos a solicitação de renovação.</p>
        <p className="text-gray-400 text-sm">A equipe da <span className="text-green-400 font-bold">Thales Lima Football Academy</span> irá confirmar em breve.</p>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mt-6 text-left w-full max-w-sm">
          <p className="text-green-500 font-bold text-sm mb-2">Próximos passos</p>
          <p className="text-gray-400 text-sm">1. Nossa equipe analisa a renovação</p>
          <p className="text-gray-400 text-sm">2. Você recebe confirmação via WhatsApp</p>
          <p className="text-gray-400 text-sm">3. Matrícula renovada para próximo período</p>
        </div>
      </div>
    )
  }

  if (etapa === 'contrato') {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setEtapa('form')} className="text-gray-400">← Voltar</button>
          <h1 className="text-xl font-bold">Contrato de Renovação</h1>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4 text-center">
          <p className="text-green-500 font-bold">Renovação de Matrícula</p>
          <p className="text-white font-bold text-lg">{atleta.nome}</p>
          <p className="text-gray-400 text-sm">Thales Lima Football Academy</p>
        </div>

        <div
          className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4 h-72 overflow-y-auto text-sm text-gray-300 leading-relaxed"
          onScroll={e => {
            const el = e.currentTarget
            if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) setContratoLido(true)
          }}
        >
          <pre className="whitespace-pre-wrap font-sans">{CONTRATO}</pre>
          {contratoLido && <p className="text-green-500 text-center mt-4 font-bold">Contrato lido!</p>}
        </div>

        {!contratoLido && <p className="text-yellow-500 text-xs text-center mb-4">Role até o final para habilitar a assinatura</p>}

        <div className={`bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4 transition-opacity ${contratoLido ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <p className="text-green-500 font-bold text-sm mb-4">Assinatura Digital</p>
          <div className="mb-4">
            <label className="text-sm text-gray-400">Nome completo do responsável *</label>
            <input
              value={nomeAssinatura}
              onChange={e => setNomeAssinatura(e.target.value)}
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white"
            />
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
            <span className="text-sm text-gray-300">Li e concordo com todos os termos do contrato de renovação.</span>
          </label>
          {assinaturaImg && aceito && nomeAssinatura && (
            <div className="mt-4 border-t border-gray-700 pt-3">
              <p className="text-xs text-gray-500">Assinado por: <span className="text-white font-bold">{nomeAssinatura}</span></p>
              <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          )}
        </div>

        <button
          onClick={confirmarRematricula}
          disabled={!aceito || !assinaturaImg || !nomeAssinatura.trim() || salvando}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-40"
        >
          {salvando ? 'Enviando...' : 'Confirmar Rematrícula'}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="text-center mb-6">
        <p className="text-4xl mb-2">🔄</p>
        <h1 className="text-xl font-bold text-green-500">Thales Lima Football Academy</h1>
        <p className="text-gray-400 text-sm">Renovação de Matrícula</p>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-1">Atleta</p>
        <p className="text-white font-bold text-lg">{atleta.nome}</p>
        {atleta.dataNascimento && (
          <p className="text-gray-400 text-sm">
            {new Date(atleta.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')}
          </p>
        )}
        {atleta.cpf && <p className="text-gray-400 text-xs">CPF: {atleta.cpf}</p>}
        {atleta.rg && <p className="text-gray-400 text-xs">RG: {atleta.rg}</p>}
      </div>

      {erros.length > 0 && (
        <div className="bg-red-600/20 border border-red-600/40 rounded-xl p-4 mb-4">
          {erros.map((erro, i) => (
            <p key={i} className="text-red-400 text-sm font-bold">❌ {erro}</p>
          ))}
        </div>
      )}

      <form onSubmit={avancarContrato} className="space-y-4">
        <p className="text-green-500 font-bold text-sm uppercase">Confirme os dados</p>

        <div>
          <label className="text-sm text-gray-400">Posição</label>
          <select name="posicao" value={form.posicao} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white">
            <option>Goleiro</option>
            <option>Zagueiro</option>
            <option>Lateral</option>
            <option>Volante</option>
            <option>Meia</option>
            <option>Atacante</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-400">Telefone do atleta</label>
          <input name="telefoneAtleta" value={form.telefoneAtleta} onChange={handleChange} type="tel" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="(34) 99999-9999" />
        </div>

        <p className="text-green-500 font-bold text-sm uppercase pt-2">Responsável</p>

        <div>
          <label className="text-sm text-gray-400">Nome do responsável *</label>
          <input name="nomeResponsavel" value={form.nomeResponsavel} onChange={handleChange} type="text" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Nome completo" />
        </div>

        <div>
          <label className="text-sm text-gray-400">
            CPF do responsável * <span className="text-yellow-400 text-xs">(obrigatório para boletos)</span>
          </label>
          <input
            name="cpfResponsavel"
            value={form.cpfResponsavel}
            onChange={handleChange}
            type="text"
            className={"w-full bg-gray-900 border rounded-lg p-3 mt-1 text-white " + (erros.some(e => e.includes('CPF')) ? 'border-red-500' : 'border-gray-700')}
            placeholder="000.000.000-00"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">WhatsApp *</label>
          <input name="whatsapp" value={form.whatsapp} onChange={handleChange} type="tel" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="(34) 99999-9999" />
        </div>

        <div>
          <label className="text-sm text-gray-400">E-mail</label>
          <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="email@exemplo.com" />
        </div>

        <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg mt-4">
          Avançar para o Contrato →
        </button>
      </form>
    </div>
  )
}