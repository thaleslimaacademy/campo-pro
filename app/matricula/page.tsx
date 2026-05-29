'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CONTRATO = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESPORTIVOS
ASSOCIAÇÃO ESPORTIVA THALES LIMA FOOTBALL ACADEMY

CLÁUSULA 1 — DO OBJETO
O presente contrato tem por objeto a prestação de serviços de treinamento e formação esportiva na modalidade futebol, oferecidos pela Associação Esportiva Thales Lima Football Academy, doravante denominada ACADEMY, ao atleta identificado na ficha de matrícula.

CLÁUSULA 2 — DA MATRÍCULA E MENSALIDADE
2.1 A matrícula do ATLETA somente será confirmada após a assinatura deste contrato e aprovação da ficha pelo responsável da ACADEMY.
2.2 O valor da mensalidade será informado no ato da matrícula e poderá ser reajustado anualmente, mediante aviso prévio de 30 (trinta) dias.
2.3 O vencimento da mensalidade ocorrerá todo dia 10 de cada mês.
2.4 Em caso de não pagamento até a data de vencimento, incidirão:
- Multa de 2% (dois por cento) sobre o valor da mensalidade
- Juros de mora de 1% (um por cento) ao mês, calculados pro rata die
- Correção monetária pelo IGPM/FGV ou índice substituto
2.5 O atraso superior a 60 (sessenta) dias poderá acarretar a suspensão do ATLETA das atividades.
2.6 O atraso superior a 90 (noventa) dias implicará no cancelamento automático da matrícula e inclusão do débito em cadastro de inadimplentes (SPC/Serasa).

CLÁUSULA 3 — DO CANCELAMENTO E DESISTÊNCIA
3.1 O cancelamento deverá ser comunicado por escrito com antecedência mínima de 30 (trinta) dias.
3.2 Não haverá devolução de mensalidades já pagas.
3.3 A ACADEMY reserva-se o direito de cancelar a matrícula em caso de conduta inadequada ou inadimplência superior a 90 dias.

CLÁUSULA 4 — DAS OBRIGAÇÕES DO CONTRATANTE
4.1 Manter os dados cadastrais sempre atualizados.
4.2 Informar qualquer condição de saúde ou limitação física do ATLETA.
4.3 Responsabilizar-se pelo transporte do ATLETA até o local de treinamento.
4.4 Respeitar os horários de início e término dos treinos.
4.5 Tratar com respeito todos os treinadores, funcionários e demais atletas.

CLÁUSULA 5 — DAS OBRIGAÇÕES DA ACADEMY
5.1 Disponibilizar profissionais qualificados para a condução dos treinamentos.
5.2 Oferecer ambiente seguro e adequado para a prática esportiva.
5.3 Comunicar previamente alterações de horário, local ou suspensão de atividades.
5.4 Manter sigilo sobre os dados pessoais conforme a LGPD (Lei nº 13.709/2018).

CLÁUSULA 6 — DO DIREITO DE IMAGEM E VOZ
6.1 O CONTRATANTE autoriza, em caráter gratuito, irrevogável e por prazo indeterminado, o uso da imagem, nome, voz e demais características do ATLETA pela ACADEMY para fins de:
- Divulgação nas redes sociais (Instagram, Facebook, YouTube, TikTok e outras)
- Material publicitário e promocional impresso ou digital
- Reportagens jornalísticas e cobertura de eventos esportivos
- Registros fotográficos e audiovisuais de treinos, jogos e eventos
6.2 O CONTRATANTE declara estar ciente de que não receberá remuneração pelo uso de imagem.
6.3 A revogação poderá ser solicitada a qualquer momento por escrito, sem efeito retroativo.

CLÁUSULA 7 — DA SAÚDE E RESPONSABILIDADE CIVIL
7.1 A ACADEMY não se responsabiliza por acidentes decorrentes de condutas inadequadas do ATLETA.
7.2 O CONTRATANTE declara que o ATLETA está em boas condições de saúde e apto para a prática esportiva.
7.3 Em caso de acidente ou mal-estar, a ACADEMY acionará os responsáveis imediatamente.
7.4 O CONTRATANTE autoriza a ACADEMY a tomar providências médicas de urgência caso não consiga contato com o responsável.

CLÁUSULA 8 — DO FORO
As partes elegem o foro da Comarca de Iturama - MG para dirimir quaisquer dúvidas ou litígios, com renúncia a qualquer outro, por mais privilegiado que seja.

CLÁUSULA 9 — DA ASSINATURA DIGITAL
Este contrato é celebrado em meio digital, tendo plena validade jurídica nos termos da MP nº 2.200-2/2001 e do Marco Civil da Internet (Lei nº 12.965/2014). A assinatura digital mediante confirmação eletrônica equivale à assinatura manuscrita para todos os fins legais. Os dados de aceite (nome, data, hora e IP) serão registrados como prova da concordância contratual.`

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
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    }
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
        <label className="text-sm text-gray-400">Assine com o dedo abaixo *</label>
        {temAssinatura && (
          <button onClick={limpar} type="button" className="text-xs text-red-400 underline">Limpar</button>
        )}
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

export default function Matricula() {
  const [etapa, setEtapa] = useState<'form' | 'contrato' | 'sucesso'>('form')
  const [loading, setLoading] = useState(false)
  const [contratoLido, setContratoLido] = useState(false)
  const [aceito, setAceito] = useState(false)
  const [assinaturaImg, setAssinaturaImg] = useState<string | null>(null)
  const [nomeAssinatura, setNomeAssinatura] = useState('')
  const [dados, setDados] = useState<Record<string, string>>({})
  const [erros, setErros] = useState<string[]>([])

  async function buscarCep(cep: string) {
    if (cep.replace(/\D/g, '').length !== 8) return
    const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`)
    const data = await res.json()
    if (!data.erro) {
      setDados(prev => ({
        ...prev,
        endereco: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      }))
    }
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

    if (!dados.cpf?.trim() && !dados.rg?.trim()) {
      novosErros.push('CPF ou RG do atleta é obrigatório. Informe pelo menos um.')
    }

    if (!dados.cpfResponsavel?.trim()) {
      novosErros.push('CPF do responsável é obrigatório para geração de boletos.')
    }

    if (novosErros.length > 0) {
      setErros(novosErros)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setErros([])
    setEtapa('contrato')
    window.scrollTo(0, 0)
  }

  async function confirmarMatricula() {
    if (!aceito || !assinaturaImg || !nomeAssinatura.trim()) return
    setLoading(true)

    await supabase.from('Matricula').insert({
      escolaId: 'escola-demo',
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
    })

    setEtapa('sucesso')
    setLoading(false)
  }

  if (etapa === 'sucesso') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-7xl mb-4">🎉</p>
        <h2 className="text-2xl font-bold mb-2">Pré-matrícula enviada!</h2>
        <p className="text-gray-400 mb-2">Recebemos os dados do atleta.</p>
        <p className="text-gray-400 text-sm">A equipe da <span className="text-green-400 font-bold">Thales Lima Football Academy</span> irá analisar e confirmar em breve.</p>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mt-6 text-left w-full max-w-sm">
          <p className="text-green-500 font-bold text-sm mb-2">Próximos passos</p>
          <p className="text-gray-400 text-sm">1. Nossa equipe analisa a ficha</p>
          <p className="text-gray-400 text-sm">2. Você recebe confirmação via WhatsApp</p>
          <p className="text-gray-400 text-sm">3. Atleta é incluído nos treinos</p>
        </div>
      </div>
    )
  }

  if (etapa === 'contrato') {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setEtapa('form')} className="text-gray-400">← Voltar</button>
          <h1 className="text-xl font-bold">Contrato</h1>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4 text-center">
          <p className="text-green-500 font-bold">Associação Esportiva</p>
          <p className="text-green-400 font-bold text-lg">Thales Lima Football Academy</p>
          <p className="text-gray-400 text-sm">Contrato de Prestação de Serviços Esportivos</p>
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
        {!contratoLido && (
          <p className="text-yellow-500 text-xs text-center mb-4">Role até o final para habilitar a assinatura</p>
        )}
        <div className={`bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4 transition-opacity ${contratoLido ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <p className="text-green-500 font-bold text-sm mb-4">Assinatura Digital</p>
          <div className="mb-4">
            <label className="text-sm text-gray-400">Nome completo do responsável *</label>
            <input
              value={nomeAssinatura}
              onChange={e => setNomeAssinatura(e.target.value)}
              type="text"
              placeholder="Seu nome completo"
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
            <span className="text-sm text-gray-300">
              Li e concordo com todos os termos do contrato, incluindo mensalidade, juros, direito de imagem e responsabilidade civil.
            </span>
          </label>
          {assinaturaImg && aceito && nomeAssinatura && (
            <div className="mt-4 border-t border-gray-700 pt-3">
              <p className="text-xs text-gray-500">Assinado por: <span className="text-white font-bold">{nomeAssinatura}</span></p>
              <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          )}
        </div>
        <button
          onClick={confirmarMatricula}
          disabled={!aceito || !assinaturaImg || !nomeAssinatura.trim() || loading}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-40"
        >
          {loading ? 'Enviando...' : 'Confirmar Pré-matrícula'}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="text-center mb-6">
        <p className="text-4xl mb-2">⚽</p>
        <h1 className="text-xl font-bold text-green-500">Thales Lima Football Academy</h1>
        <p className="text-gray-400 text-sm">Ficha de Pré-matrícula</p>
      </div>

      {erros.length > 0 && (
        <div className="bg-red-600/20 border border-red-600/40 rounded-xl p-4 mb-4">
          {erros.map((erro, i) => (
            <p key={i} className="text-red-400 text-sm font-bold">❌ {erro}</p>
          ))}
        </div>
      )}

      <form onSubmit={avancarContrato} className="space-y-4">
        <p className="text-green-500 font-bold text-sm uppercase">Dados do Atleta</p>
        <div>
          <label className="text-sm text-gray-400">Nome completo *</label>
          <input name="nome" required type="text" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: João Silva" />
        </div>
        <div>
          <label className="text-sm text-gray-400">Data de nascimento *</label>
          <input name="nascimento" required type="date" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
        </div>

        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-3">
          <p className="text-yellow-400 text-xs font-bold mb-2">⚠️ Pelo menos CPF ou RG do atleta é obrigatório</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400">CPF do atleta</label>
              <input
                name="cpf"
                type="text"
                onChange={handleChange}
                className={"w-full bg-gray-900 border rounded-lg p-3 mt-1 text-white " + (erros.some(e => e.includes('CPF ou RG')) ? 'border-red-500' : 'border-gray-700')}
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">RG do atleta</label>
              <input
                name="rg"
                type="text"
                onChange={handleChange}
                className={"w-full bg-gray-900 border rounded-lg p-3 mt-1 text-white " + (erros.some(e => e.includes('CPF ou RG')) ? 'border-red-500' : 'border-gray-700')}
                placeholder="0000000"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-400">Posição</label>
            <select name="posicao" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white">
              <option>Goleiro</option>
              <option>Zagueiro</option>
              <option>Lateral</option>
              <option>Volante</option>
              <option>Meia</option>
              <option>Atacante</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400">Telefone</label>
            <input name="telefone" type="tel" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="(34) 99999-9999" />
          </div>
        </div>

        <p className="text-green-500 font-bold text-sm uppercase pt-2">Endereço</p>
        <div>
          <label className="text-sm text-gray-400">CEP</label>
          <input name="cep" type="text" maxLength={9} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="00000-000" />
          <p className="text-xs text-gray-500 mt-1">Digite o CEP para preencher automaticamente</p>
        </div>
        <div>
          <label className="text-sm text-gray-400">Endereço</label>
          <input name="endereco" type="text" value={dados?.endereco || ''} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Rua, Avenida..." />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-400">Número</label>
            <input name="numero" type="text" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="123" />
          </div>
          <div className="col-span-2">
            <label className="text-sm text-gray-400">Bairro</label>
            <input name="bairro" type="text" value={dados?.bairro || ''} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Bairro" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-sm text-gray-400">Cidade</label>
            <input name="cidade" type="text" value={dados?.cidade || ''} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Cidade" />
          </div>
          <div>
            <label className="text-sm text-gray-400">Estado</label>
            <input name="estado" type="text" maxLength={2} value={dados?.estado || ''} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="MG" />
          </div>
        </div>

        <p className="text-green-500 font-bold text-sm uppercase pt-2">Responsável</p>
        <div>
          <label className="text-sm text-gray-400">Nome do responsável *</label>
          <input name="responsavel" required type="text" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="Ex: Maria Silva" />
        </div>
        <div>
          <label className="text-sm text-gray-400">
            CPF do responsável * <span className="text-yellow-400 text-xs">(obrigatório para boletos)</span>
          </label>
          <input
            name="cpfResponsavel"
            type="text"
            onChange={handleChange}
            className={"w-full bg-gray-900 border rounded-lg p-3 mt-1 text-white " + (erros.some(e => e.includes('CPF do responsável')) ? 'border-red-500' : 'border-gray-700')}
            placeholder="000.000.000-00"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400">WhatsApp *</label>
          <input name="whatsapp" required type="tel" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="(34) 99999-9999" />
        </div>
        <div>
          <label className="text-sm text-gray-400">E-mail</label>
          <input name="email" type="email" onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="email@exemplo.com" />
        </div>

        <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg mt-4">
          Avançar para o Contrato →
        </button>
      </form>
    </div>
  )
}