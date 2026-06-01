'use client'
import { usePerfil } from '@/lib/usePerfil'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function calcularGordura(tricipal: number, subescapular: number, suprailiaca: number, abdominal: number) {
  const soma = tricipal + subescapular + suprailiaca + abdominal
  const percentual = Math.round((0.153 * soma + 5.783) * 10) / 10
  let classificacao = ''
  if (percentual < 6) classificacao = 'Abaixo do ideal'
  else if (percentual <= 10) classificacao = 'Excelente'
  else if (percentual <= 15) classificacao = 'Bom'
  else if (percentual <= 20) classificacao = 'Aceitavel'
  else classificacao = 'Alto'
  return { percentual, classificacao }
}

function calcularIMC(peso: number, altura: number) {
  const alturaM = altura / 100
  const imc = Math.round((peso / (alturaM * alturaM)) * 10) / 10
  let classificacao = ''
  if (imc < 18.5) classificacao = 'Abaixo do peso'
  else if (imc < 25) classificacao = 'Normal'
  else if (imc < 30) classificacao = 'Sobrepeso'
  else classificacao = 'Obesidade'
  return { imc, classificacao }
}

function NotaSelector({ label, name, value, onChange }: { label: string; name: string; value: number; onChange: (name: string, val: number) => void }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-800">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(name, n)}
            className={"w-8 h-8 rounded-full text-xs font-bold transition " + (value === n ? (n <= 2 ? 'bg-red-500 text-white' : n === 3 ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white') : 'bg-gray-800 text-gray-400')}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function GraficoEvolucao({ avaliacoes }: { avaliacoes: any[] }) {
  if (avaliacoes.length < 2) return null
  const dados = [...avaliacoes].reverse()
  const maxPeso = Math.max(...dados.map(a => a.peso || 0))
  const minPeso = Math.min(...dados.filter(a => a.peso).map(a => a.peso))

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mt-4">
      <p className="text-green-500 font-bold text-sm mb-4">Evolucao do Atleta</p>
      <div className="space-y-4">
        {dados[0]?.peso && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Peso (kg)</p>
            <div className="flex items-end gap-2 h-16">
              {dados.map((a, i) => {
                const h = maxPeso > 0 ? Math.round((a.peso / maxPeso) * 100) : 50
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{a.peso}</span>
                    <div className="w-full bg-green-500 rounded-t" style={{ height: h + '%', minHeight: '8px' }} />
                    <span className="text-xs text-gray-500">{new Date(a.dataAvaliacao + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {dados[0]?.percentualGordura && (
          <div>
            <p className="text-xs text-gray-400 mb-2">% Gordura</p>
            <div className="flex items-end gap-2 h-16">
              {dados.map((a, i) => {
                const h = Math.round((a.percentualGordura / 30) * 100)
                const cor = a.percentualGordura <= 10 ? 'bg-green-500' : a.percentualGordura <= 15 ? 'bg-yellow-500' : 'bg-red-500'
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{a.percentualGordura}%</span>
                    <div className={"w-full rounded-t " + cor} style={{ height: h + '%', minHeight: '8px' }} />
                    <span className="text-xs text-gray-500">{new Date(a.dataAvaliacao + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {dados[0]?.notaGeral && (
          <div>
            <p className="text-xs text-gray-400 mb-2">Nota Geral</p>
            <div className="flex items-end gap-2 h-16">
              {dados.map((a, i) => {
                const h = Math.round((a.notaGeral / 10) * 100)
                const cor = a.notaGeral >= 7 ? 'bg-green-500' : a.notaGeral >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{a.notaGeral}</span>
                    <div className={"w-full rounded-t " + cor} style={{ height: h + '%', minHeight: '8px' }} />
                    <span className="text-xs text-gray-500">{new Date(a.dataAvaliacao + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AvaliacaoAtleta() {
  const { escolaId } = usePerfil()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [atletaNome, setAtletaNome] = useState('')
  const [atletaPos, setAtletaPos] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [avaliacoes, setAvaliacoes] = useState<any[]>([])
  const [aba, setAba] = useState<'form' | 'historico'>('form')

  const [form, setForm] = useState({
    dataAvaliacao: new Date().toISOString().split('T')[0],
    peso: '', altura: '',
    dobraTricipal: '', dobraSubescapular: '', dobraSuprailiaca: '',
    dobraAbdominal: '', dobraPeitoral: '', dobraCoxa: '',
    velocidade40m: '', cooper: '', saltoVertical: '', saltoHorizontal: '',
    notaPasse: 0, notaChute: 0, notaDrible: 0, notaControle: 0, notaCabecio: 0,
    notaVelocidade: 0, notaResistencia: 0, notaForca: 0, notaAgilidade: 0, notaSaltabilidade: 0,
    notaPosicionamento: 0, notaVisaoJogo: 0, notaMarcacao: 0, notaLideranca: 0, notaConcentracao: 0,
    historicoCirurgias: '', historicoLesoes: '', medicamentosUso: '',
    doencasCronicas: '', praticaOutroEsporte: '', observacoes: '',
  })

  const gordura = form.dobraTricipal && form.dobraSubescapular && form.dobraSuprailiaca && form.dobraAbdominal
    ? calcularGordura(parseFloat(form.dobraTricipal), parseFloat(form.dobraSubescapular), parseFloat(form.dobraSuprailiaca), parseFloat(form.dobraAbdominal))
    : null

  const imc = form.peso && form.altura ? calcularIMC(parseFloat(form.peso), parseFloat(form.altura)) : null
  const massaGorda = gordura && form.peso ? Math.round(parseFloat(form.peso) * gordura.percentual / 100 * 10) / 10 : null
  const massaMagra = massaGorda && form.peso ? Math.round((parseFloat(form.peso) - massaGorda) * 10) / 10 : null

  const notas = [form.notaPasse, form.notaChute, form.notaDrible, form.notaControle, form.notaCabecio,
    form.notaVelocidade, form.notaResistencia, form.notaForca, form.notaAgilidade, form.notaSaltabilidade,
    form.notaPosicionamento, form.notaVisaoJogo, form.notaMarcacao, form.notaLideranca, form.notaConcentracao].filter(n => n > 0)
  const notaGeral = notas.length > 0 ? Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 2 * 10) / 10 : 0

  useEffect(() => {
    async function carregar() {
      const { data: atleta } = await supabase.from('Atleta').select('nome, posicao').eq('id', id).single()
      if (atleta) { setAtletaNome(atleta.nome); setAtletaPos(atleta.posicao || '') }
      const { data } = await supabase.from('Avaliacao').select('*').eq('atletaId', id).order('dataAvaliacao', { ascending: false }).limit(6)
      setAvaliacoes(data || [])
    }
    carregar()
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleNota(name: string, val: number) {
    setForm(prev => ({ ...prev, [name]: val }))
  }

  async function salvar() {
    setSalvando(true)
    const { error } = await supabase.from('Avaliacao').insert({
      atletaId: id, escolaId: escolaId!,
      dataAvaliacao: form.dataAvaliacao,
      peso: form.peso ? parseFloat(form.peso) : null,
      altura: form.altura ? parseFloat(form.altura) : null,
      imc: imc?.imc || null,
      dobraTricipal: form.dobraTricipal ? parseFloat(form.dobraTricipal) : null,
      dobraSubescapular: form.dobraSubescapular ? parseFloat(form.dobraSubescapular) : null,
      dobraSuprailiaca: form.dobraSuprailiaca ? parseFloat(form.dobraSuprailiaca) : null,
      dobraAbdominal: form.dobraAbdominal ? parseFloat(form.dobraAbdominal) : null,
      dobraPeitoral: form.dobraPeitoral ? parseFloat(form.dobraPeitoral) : null,
      dobraCoxa: form.dobraCoxa ? parseFloat(form.dobraCoxa) : null,
      percentualGordura: gordura?.percentual || null,
      massaGorda: massaGorda || null,
      massaMagra: massaMagra || null,
      velocidade40m: form.velocidade40m ? parseFloat(form.velocidade40m) : null,
      cooper: form.cooper ? parseFloat(form.cooper) : null,
      saltoVertical: form.saltoVertical ? parseFloat(form.saltoVertical) : null,
      saltoHorizontal: form.saltoHorizontal ? parseFloat(form.saltoHorizontal) : null,
      notaPasse: form.notaPasse || null, notaChute: form.notaChute || null,
      notaDrible: form.notaDrible || null, notaControle: form.notaControle || null,
      notaCabecio: form.notaCabecio || null, notaVelocidade: form.notaVelocidade || null,
      notaResistencia: form.notaResistencia || null, notaForca: form.notaForca || null,
      notaAgilidade: form.notaAgilidade || null, notaSaltabilidade: form.notaSaltabilidade || null,
      notaPosicionamento: form.notaPosicionamento || null, notaVisaoJogo: form.notaVisaoJogo || null,
      notaMarcacao: form.notaMarcacao || null, notaLideranca: form.notaLideranca || null,
      notaConcentracao: form.notaConcentracao || null, notaGeral: notaGeral || null,
      historicoCirurgias: form.historicoCirurgias || null,
      historicoLesoes: form.historicoLesoes || null,
      medicamentosUso: form.medicamentosUso || null,
      doencasCronicas: form.doencasCronicas || null,
      praticaOutroEsporte: form.praticaOutroEsporte || null,
      observacoes: form.observacoes || null,
    })
    if (error) alert('Erro: ' + error.message)
    else {
      setSucesso(true)
      const { data } = await supabase.from('Avaliacao').select('*').eq('atletaId', id).order('dataAvaliacao', { ascending: false }).limit(6)
      setAvaliacoes(data || [])
      setTimeout(() => setSucesso(false), 3000)
    }
    setSalvando(false)
  }

  async function gerarPDF(avaliacao?: any) {
    setGerando(true)
    const av = avaliacao || { ...form, imc: imc?.imc, percentualGordura: gordura?.percentual, massaGorda, massaMagra, notaGeral }
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()

    doc.setFillColor(22, 163, 74); doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('THALES LIMA FOOTBALL ACADEMY', 105, 14, { align: 'center' })
    doc.setFontSize(11); doc.text('Relatorio de Avaliacao Fisica', 105, 26, { align: 'center' })

    doc.setTextColor(0, 0, 0); doc.setFontSize(11); doc.setFont('helvetica', 'normal')
    doc.text('Atleta: ' + atletaNome, 15, 45)
    doc.text('Posicao: ' + atletaPos, 15, 53)
    doc.text('Data: ' + new Date((av.dataAvaliacao || form.dataAvaliacao) + 'T12:00:00').toLocaleDateString('pt-BR'), 150, 45)

    if (av.notaGeral) {
      const cor = av.notaGeral >= 7 ? [22, 163, 74] : av.notaGeral >= 5 ? [161, 118, 0] : [220, 38, 38]
      doc.setFillColor(cor[0], cor[1], cor[2]); doc.circle(185, 55, 12, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold')
      doc.text(String(av.notaGeral), 185, 59, { align: 'center' })
      doc.setFontSize(7); doc.text('NOTA', 185, 65, { align: 'center' })
      doc.setTextColor(0, 0, 0)
    }

    let y = 68
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.text('DADOS ANTROPOMETRICOS', 15, y); y += 6
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    const antro = []
    if (av.peso) antro.push(['Peso', av.peso + ' kg'])
    if (av.altura) antro.push(['Altura', av.altura + ' cm'])
    if (av.imc) antro.push(['IMC', String(av.imc)])
    if (av.percentualGordura) antro.push(['% Gordura', av.percentualGordura + '%'])
    if (av.massaMagra) antro.push(['Massa Magra', av.massaMagra + ' kg'])
    if (av.massaGorda) antro.push(['Massa Gorda', av.massaGorda + ' kg'])

    autoTable(doc, {
      startY: y, body: antro,
      theme: 'grid', styles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      margin: { left: 15, right: 110 }
    })

    y = (doc as any).lastAutoTable.finalY + 5
    if (av.velocidade40m || av.cooper || av.saltoVertical || av.saltoHorizontal) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
      doc.text('TESTES FISICOS', 15, y); y += 6
      const testes = []
      if (av.velocidade40m) testes.push(['Velocidade 40m', av.velocidade40m + 's'])
      if (av.cooper) testes.push(['Teste de Cooper', av.cooper + 'm'])
      if (av.saltoVertical) testes.push(['Salto Vertical', av.saltoVertical + 'cm'])
      if (av.saltoHorizontal) testes.push(['Salto Horizontal', av.saltoHorizontal + 'cm'])
      autoTable(doc, {
        startY: y, body: testes,
        theme: 'grid', styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: 15, right: 110 }
      })
      y = (doc as any).lastAutoTable.finalY + 5
    }

    const notasData = [
      ['Tecnica', 'Fisico', 'Tatico'],
      [
        'Passe: ' + (av.notaPasse || '-') + '\nChute: ' + (av.notaChute || '-') + '\nDrible: ' + (av.notaDrible || '-') + '\nControle: ' + (av.notaControle || '-') + '\nCabecio: ' + (av.notaCabecio || '-'),
        'Velocidade: ' + (av.notaVelocidade || '-') + '\nResistencia: ' + (av.notaResistencia || '-') + '\nForca: ' + (av.notaForca || '-') + '\nAgilidade: ' + (av.notaAgilidade || '-') + '\nSaltabilidade: ' + (av.notaSaltabilidade || '-'),
        'Posicionamento: ' + (av.notaPosicionamento || '-') + '\nVisao: ' + (av.notaVisaoJogo || '-') + '\nMarcacao: ' + (av.notaMarcacao || '-') + '\nLideranca: ' + (av.notaLideranca || '-') + '\nConcentracao: ' + (av.notaConcentracao || '-'),
      ]
    ]
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.text('AVALIACAO TECNICA E FISICA', 15, y); y += 6
    autoTable(doc, {
      startY: y, head: [notasData[0]], body: [notasData[1]],
      headStyles: { fillColor: [22, 163, 74] },
      styles: { fontSize: 8 },
      margin: { left: 15 }
    })

    doc.setFontSize(8); doc.setTextColor(150, 150, 150)
    doc.text('GestaoFC | gestaofc.com.br', 105, 290, { align: 'center' })
    doc.save('avaliacao-' + atletaNome.replace(/ /g, '-') + '-' + (av.dataAvaliacao || form.dataAvaliacao) + '.pdf')
    setGerando(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <a href={"/atletas/" + id} className="text-gray-400">Voltar</a>
          <h1 className="text-xl font-bold">Avaliacao</h1>
        </div>
        {notaGeral > 0 && (
          <div className={"w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg " + (notaGeral >= 7 ? 'bg-green-600' : notaGeral >= 5 ? 'bg-yellow-500 text-black' : 'bg-red-600')}>
            {notaGeral}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setAba('form')} className={"flex-1 py-2 rounded-xl text-sm font-bold " + (aba === 'form' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400')}>Nova Avaliacao</button>
        <button onClick={() => setAba('historico')} className={"flex-1 py-2 rounded-xl text-sm font-bold " + (aba === 'historico' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400')}>
          Historico {avaliacoes.length > 0 ? '(' + avaliacoes.length + ')' : ''}
        </button>
      </div>

      {aba === 'historico' && (
        <div>
          <GraficoEvolucao avaliacoes={avaliacoes} />
          {avaliacoes.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-400">Nenhuma avaliacao registrada.</p></div>
          ) : (
            <div className="space-y-3 mt-4">
              {avaliacoes.map(a => (
                <div key={a.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold">{new Date(a.dataAvaliacao + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    <div className="flex items-center gap-2">
                      {a.notaGeral && (
                        <span className={"px-2 py-1 rounded-full text-xs font-bold " + (a.notaGeral >= 7 ? 'bg-green-600/20 text-green-400' : a.notaGeral >= 5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-600/20 text-red-400')}>
                          Nota: {a.notaGeral}
                        </span>
                      )}
                      <button onClick={() => gerarPDF(a)} disabled={gerando} className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-lg text-xs font-bold">
                        PDF
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                    {a.peso && <span>Peso: {a.peso}kg</span>}
                    {a.altura && <span>Altura: {a.altura}cm</span>}
                    {a.imc && <span>IMC: {a.imc}</span>}
                    {a.percentualGordura && <span>Gordura: {a.percentualGordura}%</span>}
                    {a.velocidade40m && <span>40m: {a.velocidade40m}s</span>}
                    {a.cooper && <span>Cooper: {a.cooper}m</span>}
                    {a.saltoVertical && <span>SV: {a.saltoVertical}cm</span>}
                    {a.saltoHorizontal && <span>SH: {a.saltoHorizontal}cm</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {aba === 'form' && (
        <div>
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 mb-4 flex justify-between items-center">
            <p className="font-bold text-green-400">{atletaNome}</p>
            <input name="dataAvaliacao" value={form.dataAvaliacao} onChange={handleChange} type="date" className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
          </div>

          {sucesso && (
            <div className="bg-green-600/20 border border-green-600/30 rounded-xl p-3 mb-4 text-center">
              <p className="text-green-400 font-bold">Avaliacao salva!</p>
            </div>
          )}

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
            <p className="text-green-500 font-bold text-sm mb-4">Dados Antropometricos</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="text-xs text-gray-400">Peso (kg)</label><input name="peso" value={form.peso} onChange={handleChange} type="number" step="0.1" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="70.5" /></div>
              <div><label className="text-xs text-gray-400">Altura (cm)</label><input name="altura" value={form.altura} onChange={handleChange} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="175" /></div>
            </div>
            {imc && <div className="bg-gray-800 rounded-xl p-3 mb-3"><div className="flex justify-between"><span className="text-sm text-gray-400">IMC</span><span className="font-bold">{imc.imc} - {imc.classificacao}</span></div></div>}
            <p className="text-xs text-gray-400 mb-2 mt-3">Dobras Cutaneas (mm)</p>
            <div className="grid grid-cols-2 gap-3">
              {[{name:'dobraTricipal',label:'Triceps'},{name:'dobraSubescapular',label:'Subescapular'},{name:'dobraSuprailiaca',label:'Suprailiaca'},{name:'dobraAbdominal',label:'Abdominal'},{name:'dobraPeitoral',label:'Peitoral'},{name:'dobraCoxa',label:'Coxa'}].map(d => (
                <div key={d.name}><label className="text-xs text-gray-400">{d.label}</label><input name={d.name} value={(form as any)[d.name]} onChange={handleChange} type="number" step="0.1" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 mt-1 text-white text-sm" placeholder="mm" /></div>
              ))}
            </div>
            {gordura && (
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 mt-4">
                <p className="text-blue-400 font-bold text-sm mb-2">Composicao Corporal (Faulkner)</p>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm text-gray-300">% Gordura</span><span className="font-bold">{gordura.percentual}% - {gordura.classificacao}</span></div>
                  {massaGorda && <div className="flex justify-between"><span className="text-sm text-gray-300">Massa Gorda</span><span className="font-bold text-red-400">{massaGorda} kg</span></div>}
                  {massaMagra && <div className="flex justify-between"><span className="text-sm text-gray-300">Massa Magra</span><span className="font-bold text-green-400">{massaMagra} kg</span></div>}
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
            <p className="text-green-500 font-bold text-sm mb-4">Testes Fisicos</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-400">Velocidade 40m (seg)</label><input name="velocidade40m" value={form.velocidade40m} onChange={handleChange} type="number" step="0.01" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="5.20" /></div>
              <div><label className="text-xs text-gray-400">Cooper (metros)</label><input name="cooper" value={form.cooper} onChange={handleChange} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="2800" /></div>
              <div><label className="text-xs text-gray-400">Salto Vertical (cm)</label><input name="saltoVertical" value={form.saltoVertical} onChange={handleChange} type="number" step="0.1" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="45" /></div>
              <div><label className="text-xs text-gray-400">Salto Horizontal (cm)</label><input name="saltoHorizontal" value={form.saltoHorizontal} onChange={handleChange} type="number" step="0.1" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="180" /></div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
            <p className="text-green-500 font-bold text-sm mb-3">Tecnica</p>
            <NotaSelector label="Passe" name="notaPasse" value={form.notaPasse} onChange={handleNota} />
            <NotaSelector label="Chute" name="notaChute" value={form.notaChute} onChange={handleNota} />
            <NotaSelector label="Drible" name="notaDrible" value={form.notaDrible} onChange={handleNota} />
            <NotaSelector label="Controle de bola" name="notaControle" value={form.notaControle} onChange={handleNota} />
            <NotaSelector label="Cabecio" name="notaCabecio" value={form.notaCabecio} onChange={handleNota} />
          </div>

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
            <p className="text-green-500 font-bold text-sm mb-3">Fisico</p>
            <NotaSelector label="Velocidade" name="notaVelocidade" value={form.notaVelocidade} onChange={handleNota} />
            <NotaSelector label="Resistencia" name="notaResistencia" value={form.notaResistencia} onChange={handleNota} />
            <NotaSelector label="Forca" name="notaForca" value={form.notaForca} onChange={handleNota} />
            <NotaSelector label="Agilidade" name="notaAgilidade" value={form.notaAgilidade} onChange={handleNota} />
            <NotaSelector label="Saltabilidade" name="notaSaltabilidade" value={form.notaSaltabilidade} onChange={handleNota} />
          </div>

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
            <p className="text-green-500 font-bold text-sm mb-3">Tatico</p>
            <NotaSelector label="Posicionamento" name="notaPosicionamento" value={form.notaPosicionamento} onChange={handleNota} />
            <NotaSelector label="Visao de jogo" name="notaVisaoJogo" value={form.notaVisaoJogo} onChange={handleNota} />
            <NotaSelector label="Marcacao" name="notaMarcacao" value={form.notaMarcacao} onChange={handleNota} />
            <NotaSelector label="Lideranca" name="notaLideranca" value={form.notaLideranca} onChange={handleNota} />
            <NotaSelector label="Concentracao" name="notaConcentracao" value={form.notaConcentracao} onChange={handleNota} />
          </div>

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
            <p className="text-green-500 font-bold text-sm mb-3">Anamnese</p>
            {[{name:'historicoCirurgias',label:'Historico de cirurgias'},{name:'historicoLesoes',label:'Historico de lesoes'},{name:'medicamentosUso',label:'Medicamentos em uso'},{name:'doencasCronicas',label:'Doencas cronicas'},{name:'praticaOutroEsporte',label:'Pratica outro esporte?'},{name:'observacoes',label:'Observacoes gerais'}].map(f => (
              <div key={f.name} className="mb-3">
                <label className="text-xs text-gray-400">{f.label}</label>
                <textarea name={f.name} value={(form as any)[f.name]} onChange={handleChange} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 mt-1 text-white text-sm resize-none" placeholder="Digite aqui..." />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={salvar} disabled={salvando} className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar Avaliacao'}
            </button>
            <button onClick={() => gerarPDF()} disabled={gerando} className="bg-blue-600 text-white px-4 py-4 rounded-xl font-bold disabled:opacity-50">
              {gerando ? '...' : 'PDF'}
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">Inicio</a>
        <a href="/atletas" className="text-green-500 text-xs text-center">Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">Presenca</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">Financeiro</a>
      </nav>
    </div>
  )
}
