'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function calcularGordura(tricipal: number, subescapular: number, suprailiaca: number, abdominal: number) {
  const soma = tricipal + subescapular + suprailiaca + abdominal
  const percentual = Math.round((0.153 * soma + 5.783) * 10) / 10
  let classificacao = ''
  if (percentual < 6) classificacao = '⚠️ Abaixo do ideal'
  else if (percentual <= 10) classificacao = '🏆 Excelente'
  else if (percentual <= 15) classificacao = '✅ Bom'
  else if (percentual <= 20) classificacao = '⚠️ Aceitável'
  else classificacao = '❌ Alto'
  return { percentual, classificacao }
}

function calcularIMC(peso: number, altura: number) {
  const alturaM = altura / 100
  const imc = Math.round((peso / (alturaM * alturaM)) * 10) / 10
  let classificacao = ''
  if (imc < 18.5) classificacao = 'Abaixo do peso'
  else if (imc < 25) classificacao = '✅ Normal'
  else if (imc < 30) classificacao = '⚠️ Sobrepeso'
  else classificacao = '❌ Obesidade'
  return { imc, classificacao }
}

function NotaSelector({ label, name, value, onChange }: {
  label: string
  name: string
  value: number
  onChange: (name: string, val: number) => void
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-800">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(name, n)}
            className={`w-8 h-8 rounded-full text-xs font-bold transition ${
              value === n
                ? n <= 2 ? 'bg-red-500 text-white'
                  : n === 3 ? 'bg-yellow-500 text-black'
                  : 'bg-green-500 text-white'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function AvaliacaoAtleta() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [atletaNome, setAtletaNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [avaliacoes, setAvaliacoes] = useState<any[]>([])

  const [form, setForm] = useState({
    dataAvaliacao: new Date().toISOString().split('T')[0],
    peso: '', altura: '',
    dobraTricipal: '', dobraSubescapular: '', dobraSuprailiaca: '',
    dobraAbdominal: '', dobraPeitoral: '', dobraCoxa: '',
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

  useEffect(() => {
    async function carregar() {
      const { data: atleta } = await supabase.from('Atleta').select('nome').eq('id', id).single()
      if (atleta) setAtletaNome(atleta.nome)
      const { data } = await supabase.from('Avaliacao').select('*').eq('atletaId', id).order('dataAvaliacao', { ascending: false }).limit(3)
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
      atletaId: id,
      escolaId: 'escola-demo',
      dataAvaliacao: form.dataAvaliacao,
      peso: form.peso ? parseFloat(form.peso) : null,
      altura: form.altura ? parseFloat(form.altura) : null,
      imc: imc?.imc || null,
      dobraTricipal: form.dobraTricipal ? parseFloat(form.dobraTricipal) : null,
      dobraSubescapular: form.dobraSubescapular ? parseFloat(form.dobraSubescapular) : null,
      'dobraSuprailíaca': form.dobraSuprailiaca ? parseFloat(form.dobraSuprailiaca) : null,
      dobraAbdominal: form.dobraAbdominal ? parseFloat(form.dobraAbdominal) : null,
      dobraPeitoral: form.dobraPeitoral ? parseFloat(form.dobraPeitoral) : null,
      dobraCoxa: form.dobraCoxa ? parseFloat(form.dobraCoxa) : null,
      percentualGordura: gordura?.percentual || null,
      massaGorda: massaGorda || null,
      massaMagra: massaMagra || null,
      notaPasse: form.notaPasse || null,
      notaChute: form.notaChute || null,
      notaDrible: form.notaDrible || null,
      notaControle: form.notaControle || null,
      notaCabecio: form.notaCabecio || null,
      notaVelocidade: form.notaVelocidade || null,
      notaResistencia: form.notaResistencia || null,
      notaForca: form.notaForca || null,
      notaAgilidade: form.notaAgilidade || null,
      notaSaltabilidade: form.notaSaltabilidade || null,
      notaPosicionamento: form.notaPosicionamento || null,
      notaVisaoJogo: form.notaVisaoJogo || null,
      notaMarcacao: form.notaMarcacao || null,
      notaLideranca: form.notaLideranca || null,
      notaConcentracao: form.notaConcentracao || null,
      historicoCirurgias: form.historicoCirurgias || null,
      historicoLesoes: form.historicoLesoes || null,
      medicamentosUso: form.medicamentosUso || null,
      doencasCronicas: form.doencasCronicas || null,
      praticaOutroEsporte: form.praticaOutroEsporte || null,
      observacoes: form.observacoes || null,
    })
    if (error) alert('Erro: ' + error.message)
    else { setSucesso(true); setTimeout(() => router.push(`/atletas/${id}`), 1500) }
    setSalvando(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <a href={`/atletas/${id}`} className="text-gray-400">← Voltar</a>
        <h1 className="text-xl font-bold">📋 Avaliação</h1>
      </div>

      <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 mb-4 flex justify-between items-center">
        <p className="font-bold text-green-400">{atletaNome}</p>
        <input name="dataAvaliacao" value={form.dataAvaliacao} onChange={handleChange} type="date" className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-sm" />
      </div>

      {sucesso && (
        <div className="bg-green-600/20 border border-green-600/30 rounded-xl p-3 mb-4 text-center">
          <p className="text-green-400 font-bold">✅ Avaliação salva!</p>
        </div>
      )}

      {/* Antropometria */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-green-500 font-bold text-sm mb-4">📏 Dados Antropométricos</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-400">Peso (kg)</label>
            <input name="peso" value={form.peso} onChange={handleChange} type="number" step="0.1" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="70.5" />
          </div>
          <div>
            <label className="text-xs text-gray-400">Altura (cm)</label>
            <input name="altura" value={form.altura} onChange={handleChange} type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" placeholder="175" />
          </div>
        </div>

        {imc && (
          <div className="bg-gray-800 rounded-xl p-3 mb-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">IMC</span>
              <span className="font-bold">{imc.imc} — {imc.classificacao}</span>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mb-2 mt-3">Dobras Cutâneas (mm) — Adipômetro</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'dobraTricipal', label: 'Tríceps' },
            { name: 'dobraSubescapular', label: 'Subescapular' },
            { name: 'dobraSuprailiaca', label: 'Suprailíaca' },
            { name: 'dobraAbdominal', label: 'Abdominal' },
            { name: 'dobraPeitoral', label: 'Peitoral' },
            { name: 'dobraCoxa', label: 'Coxa' },
          ].map(d => (
            <div key={d.name}>
              <label className="text-xs text-gray-400">{d.label}</label>
              <input name={d.name} value={(form as any)[d.name]} onChange={handleChange} type="number" step="0.1" className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 mt-1 text-white text-sm" placeholder="mm" />
            </div>
          ))}
        </div>

        {gordura && (
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 mt-4">
            <p className="text-blue-400 font-bold text-sm mb-2">📊 Composição Corporal (Faulkner)</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-300">% Gordura</span>
                <span className="font-bold">{gordura.percentual}% — {gordura.classificacao}</span>
              </div>
              {massaGorda && <div className="flex justify-between"><span className="text-sm text-gray-300">Massa Gorda</span><span className="font-bold text-red-400">{massaGorda} kg</span></div>}
              {massaMagra && <div className="flex justify-between"><span className="text-sm text-gray-300">Massa Magra</span><span className="font-bold text-green-400">{massaMagra} kg</span></div>}
              <div className="w-full bg-gray-700 rounded-full h-3 mt-2">
                <div className={`h-3 rounded-full ${gordura.percentual <= 10 ? 'bg-green-500' : gordura.percentual <= 15 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(gordura.percentual * 3, 100)}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Técnica */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-green-500 font-bold text-sm mb-3">⚽ Técnica</p>
        <NotaSelector label="Passe" name="notaPasse" value={form.notaPasse} onChange={handleNota} />
        <NotaSelector label="Chute" name="notaChute" value={form.notaChute} onChange={handleNota} />
        <NotaSelector label="Drible" name="notaDrible" value={form.notaDrible} onChange={handleNota} />
        <NotaSelector label="Controle de bola" name="notaControle" value={form.notaControle} onChange={handleNota} />
        <NotaSelector label="Cabeceio" name="notaCabecio" value={form.notaCabecio} onChange={handleNota} />
      </div>

      {/* Físico */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-green-500 font-bold text-sm mb-3">💪 Físico</p>
        <NotaSelector label="Velocidade" name="notaVelocidade" value={form.notaVelocidade} onChange={handleNota} />
        <NotaSelector label="Resistência" name="notaResistencia" value={form.notaResistencia} onChange={handleNota} />
        <NotaSelector label="Força" name="notaForca" value={form.notaForca} onChange={handleNota} />
        <NotaSelector label="Agilidade" name="notaAgilidade" value={form.notaAgilidade} onChange={handleNota} />
        <NotaSelector label="Saltabilidade" name="notaSaltabilidade" value={form.notaSaltabilidade} onChange={handleNota} />
      </div>

      {/* Tático */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-green-500 font-bold text-sm mb-3">🧠 Tático</p>
        <NotaSelector label="Posicionamento" name="notaPosicionamento" value={form.notaPosicionamento} onChange={handleNota} />
        <NotaSelector label="Visão de jogo" name="notaVisaoJogo" value={form.notaVisaoJogo} onChange={handleNota} />
        <NotaSelector label="Marcação" name="notaMarcacao" value={form.notaMarcacao} onChange={handleNota} />
        <NotaSelector label="Liderança" name="notaLideranca" value={form.notaLideranca} onChange={handleNota} />
        <NotaSelector label="Concentração" name="notaConcentracao" value={form.notaConcentracao} onChange={handleNota} />
      </div>

      {/* Anamnese */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
        <p className="text-green-500 font-bold text-sm mb-3">🩺 Anamnese</p>
        {[
          { name: 'historicoCirurgias', label: 'Histórico de cirurgias' },
          { name: 'historicoLesoes', label: 'Histórico de lesões' },
          { name: 'medicamentosUso', label: 'Medicamentos em uso' },
          { name: 'doencasCronicas', label: 'Doenças crônicas' },
          { name: 'praticaOutroEsporte', label: 'Pratica outro esporte?' },
          { name: 'observacoes', label: 'Observações gerais' },
        ].map(f => (
          <div key={f.name} className="mb-3">
            <label className="text-xs text-gray-400">{f.label}</label>
            <textarea name={f.name} value={(form as any)[f.name]} onChange={handleChange} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 mt-1 text-white text-sm resize-none" placeholder="Digite aqui..." />
          </div>
        ))}
      </div>

      <button onClick={salvar} disabled={salvando} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50">
        {salvando ? 'Salvando...' : '💾 Salvar Avaliação'}
      </button>

      {avaliacoes.length > 0 && (
        <div className="mt-6">
          <p className="font-bold text-sm mb-3 text-gray-400">📅 Avaliações anteriores</p>
          <div className="space-y-2">
            {avaliacoes.map(a => (
              <div key={a.id} className="bg-gray-900 rounded-xl p-3 border border-gray-800">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold">{new Date(a.dataAvaliacao + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  {a.percentualGordura && <span className="text-xs text-blue-400">{a.percentualGordura}% gordura</span>}
                </div>
                <div className="flex gap-4 mt-1">
                  {a.peso && <span className="text-xs text-gray-400">{a.peso}kg</span>}
                  {a.altura && <span className="text-xs text-gray-400">{a.altura}cm</span>}
                  {a.imc && <span className="text-xs text-gray-400">IMC {a.imc}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br/>Início</a>
        <a href="/atletas" className="text-green-500 text-xs text-center">👥<br/>Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br/>Presença</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br/>Financeiro</a>
      </nav>
    </div>
  )
}