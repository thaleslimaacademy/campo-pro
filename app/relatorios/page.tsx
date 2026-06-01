'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Atleta { id: string; nome: string; posicao: string; turmaId: string }
interface Turma { id: string; nome: string }

export default function Relatorios() {
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [aba, setAba] = useState<'presenca' | 'financeiro' | 'atletas'>('presenca')
  const [atletaSelecionado, setAtletaSelecionado] = useState('')
  const [dataInicio, setDataInicio] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] })
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0])
  const [mesFinanceiro, setMesFinanceiro] = useState(() => new Date().toISOString().slice(0, 7))
  const [turmaSelecionada, setTurmaSelecionada] = useState('')

  useEffect(() => {
    async function carregar() {
      const { data: ats } = await supabase.from('Atleta').select('id, nome, posicao, turmaId').eq('escolaId', 'escola-demo').eq('ativo', true).order('nome')
      setAtletas(ats || [])
      const { data: tms } = await supabase.from('Turma').select('id, nome').eq('escolaId', 'escola-demo').order('nome')
      setTurmas(tms || [])
      setLoading(false)
    }
    carregar()
  }, [])

  async function gerarPresenca() {
    if (!atletaSelecionado) return alert('Selecione um atleta')
    setGerando(true)
    const atleta = atletas.find(a => a.id === atletaSelecionado)
    const { data: presencas } = await supabase.from('Presenca').select('status, criadoEm').eq('atletaId', atletaSelecionado).gte('criadoEm', dataInicio).lte('criadoEm', dataFim + 'T23:59:59').order('criadoEm', { ascending: true })
    const total = presencas?.length || 0
    const presentes = presencas?.filter(p => p.status === 'PRESENTE').length || 0
    const ausentes = total - presentes
    const percentual = total > 0 ? Math.round((presentes / total) * 100) : 0
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    doc.setFillColor(22, 163, 74); doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('THALES LIMA FOOTBALL ACADEMY', 105, 14, { align: 'center' })
    doc.setFontSize(11); doc.text('Relatorio de Presenca', 105, 26, { align: 'center' })
    doc.setTextColor(0, 0, 0); doc.setFontSize(11); doc.setFont('helvetica', 'normal')
    doc.text('Atleta: ' + (atleta?.nome || ''), 15, 48)
    doc.text('Periodo: ' + new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR') + ' a ' + new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR'), 15, 56)
    doc.setFillColor(240, 240, 240); doc.rect(15, 63, 180, 22, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text('Total: ' + total, 30, 76)
    doc.text('Presentes: ' + presentes, 80, 76)
    doc.text('Ausentes: ' + ausentes, 130, 76)
    const cor = percentual >= 75 ? [22, 163, 74] : percentual >= 50 ? [161, 118, 0] : [220, 38, 38]
    doc.setTextColor(cor[0], cor[1], cor[2]); doc.setFontSize(16)
    doc.text('Frequencia: ' + percentual + '%', 105, 100, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    if (presencas && presencas.length > 0) {
      autoTable(doc, {
        startY: 110,
        head: [['Data', 'Status']],
        body: presencas.map(p => [new Date(p.criadoEm).toLocaleDateString('pt-BR'), p.status === 'PRESENTE' ? 'Presente' : 'Ausente']),
        headStyles: { fillColor: [22, 163, 74] },
        didParseCell: (data: any) => { if (data.column.index === 1 && data.cell.raw === 'Ausente') data.cell.styles.textColor = [220, 38, 38] }
      })
    }
    doc.setFontSize(8); doc.setTextColor(150, 150, 150)
    doc.text('GestaoFC | gestaofc.com.br', 105, 290, { align: 'center' })
    doc.save('presenca-' + (atleta?.nome || 'atleta').replace(/ /g, '-') + '.pdf')
    setGerando(false)
  }

  async function gerarFinanceiro() {
    setGerando(true)
    const { data: cobrancas } = await supabase.from('Cobranca').select('id, valor, status, descricao, vencimento, atletaId').eq('escolaId', 'escola-demo').gte('vencimento', mesFinanceiro + '-01').lte('vencimento', mesFinanceiro + '-31').order('vencimento', { ascending: true })
    const pagas = cobrancas?.filter(c => c.status === 'PAGO') || []
    const pendentes = cobrancas?.filter(c => c.status === 'PENDENTE') || []
    const vencidas = cobrancas?.filter(c => c.status === 'VENCIDO') || []
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    doc.setFillColor(22, 163, 74); doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('THALES LIMA FOOTBALL ACADEMY', 105, 14, { align: 'center' })
    doc.setFontSize(11); doc.text('Relatorio Financeiro - ' + mesFinanceiro, 105, 26, { align: 'center' })
    doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
    doc.setFillColor(220, 255, 220); doc.rect(15, 43, 55, 20, 'F')
    doc.setTextColor(22, 163, 74); doc.setFont('helvetica', 'bold')
    doc.text('PAGO', 42, 51, { align: 'center' })
    doc.text('R$ ' + pagas.reduce((s, c) => s + Number(c.valor), 0).toFixed(2), 42, 60, { align: 'center' })
    doc.setFillColor(255, 255, 200); doc.rect(77, 43, 55, 20, 'F')
    doc.setTextColor(161, 118, 0)
    doc.text('PENDENTE', 104, 51, { align: 'center' })
    doc.text('R$ ' + pendentes.reduce((s, c) => s + Number(c.valor), 0).toFixed(2), 104, 60, { align: 'center' })
    doc.setFillColor(255, 220, 220); doc.rect(139, 43, 55, 20, 'F')
    doc.setTextColor(220, 38, 38)
    doc.text('VENCIDO', 166, 51, { align: 'center' })
    doc.text('R$ ' + vencidas.reduce((s, c) => s + Number(c.valor), 0).toFixed(2), 166, 60, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    if (cobrancas && cobrancas.length > 0) {
      const ids = [...new Set(cobrancas.map(c => c.atletaId))]
      const { data: ats } = await supabase.from('Atleta').select('id, nome').in('id', ids)
      const map: Record<string, string> = {}
      ats?.forEach(a => { map[a.id] = a.nome })
      autoTable(doc, {
        startY: 72,
        head: [['Atleta', 'Descricao', 'Vencimento', 'Valor', 'Status']],
        body: cobrancas.map(c => [map[c.atletaId] || 'N/A', c.descricao || 'Mensalidade', new Date(c.vencimento + 'T12:00:00').toLocaleDateString('pt-BR'), 'R$ ' + Number(c.valor).toFixed(2), c.status]),
        headStyles: { fillColor: [22, 163, 74] },
        styles: { fontSize: 9 },
        didParseCell: (data: any) => {
          if (data.column.index === 4) {
            if (data.cell.raw === 'PAGO') data.cell.styles.textColor = [22, 163, 74]
            if (data.cell.raw === 'VENCIDO') data.cell.styles.textColor = [220, 38, 38]
            if (data.cell.raw === 'PENDENTE') data.cell.styles.textColor = [161, 118, 0]
          }
        }
      })
    }
    doc.setFontSize(8); doc.setTextColor(150, 150, 150)
    doc.text('GestaoFC | gestaofc.com.br', 105, 290, { align: 'center' })
    doc.save('financeiro-' + mesFinanceiro + '.pdf')
    setGerando(false)
  }

  async function gerarAtletas() {
    setGerando(true)
    let query = supabase.from('Atleta').select('id, nome, posicao, dataNascimento, turmaId').eq('escolaId', 'escola-demo').eq('ativo', true).order('nome')
    if (turmaSelecionada) query = query.eq('turmaId', turmaSelecionada)
    const { data: ats } = await query
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    doc.setFillColor(22, 163, 74); doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('THALES LIMA FOOTBALL ACADEMY', 105, 14, { align: 'center' })
    const nomeTurma = turmaSelecionada ? turmas.find(t => t.id === turmaSelecionada)?.nome || 'Todos' : 'Todos'
    doc.setFontSize(11); doc.text('Relatorio de Atletas - ' + nomeTurma, 105, 26, { align: 'center' })
    doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
    doc.text('Total: ' + (ats?.length || 0) + ' atletas', 15, 45)
    doc.text('Data: ' + new Date().toLocaleDateString('pt-BR'), 155, 45)
    if (ats && ats.length > 0) {
      autoTable(doc, {
        startY: 52,
        head: [['#', 'Nome', 'Posicao', 'Nascimento', 'Turma']],
        body: ats.map((a, i) => [i + 1, a.nome, a.posicao || 'N/A', a.dataNascimento ? new Date(a.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A', turmas.find(t => t.id === a.turmaId)?.nome || 'Sem turma']),
        headStyles: { fillColor: [22, 163, 74] },
        styles: { fontSize: 10 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })
    }
    doc.setFontSize(8); doc.setTextColor(150, 150, 150)
    doc.text('GestaoFC | gestaofc.com.br', 105, 290, { align: 'center' })
    doc.save('atletas-' + new Date().toISOString().split('T')[0] + '.pdf')
    setGerando(false)
  }

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center"><p className="text-gray-400">Carregando...</p></div>

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <a href="/dashboard" className="text-gray-400">Voltar</a>
        <h1 className="text-xl font-bold">Relatorios</h1>
      </div>
      <div className="flex gap-2 mb-6">
        {(['presenca', 'financeiro', 'atletas'] as const).map(a => (
          <button key={a} onClick={() => setAba(a)} className={"px-4 py-2 rounded-xl text-sm font-bold " + (aba === a ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400')}>
            {a === 'presenca' ? 'Presenca' : a === 'financeiro' ? 'Financeiro' : 'Atletas'}
          </button>
        ))}
      </div>
      {aba === 'presenca' && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4">
          <p className="text-green-500 font-bold">Relatorio de Presenca por Atleta</p>
          <div>
            <label className="text-sm text-gray-400">Atleta *</label>
            <select value={atletaSelecionado} onChange={e => setAtletaSelecionado(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white">
              <option value="">Selecione um atleta</option>
              {atletas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400">Data inicio</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400">Data fim</label>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
            </div>
          </div>
          <button onClick={gerarPresenca} disabled={gerando || !atletaSelecionado} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
            {gerando ? 'Gerando...' : 'Gerar PDF de Presenca'}
          </button>
        </div>
      )}
      {aba === 'financeiro' && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4">
          <p className="text-green-500 font-bold">Relatorio Financeiro Mensal</p>
          <div>
            <label className="text-sm text-gray-400">Mes de referencia</label>
            <input type="month" value={mesFinanceiro} onChange={e => setMesFinanceiro(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white" />
          </div>
          <button onClick={gerarFinanceiro} disabled={gerando} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
            {gerando ? 'Gerando...' : 'Gerar PDF Financeiro'}
          </button>
        </div>
      )}
      {aba === 'atletas' && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4">
          <p className="text-green-500 font-bold">Relatorio de Atletas</p>
          <div>
            <label className="text-sm text-gray-400">Filtrar por turma (opcional)</label>
            <select value={turmaSelecionada} onChange={e => setTurmaSelecionada(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 mt-1 text-white">
              <option value="">Todas as turmas</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <button onClick={gerarAtletas} disabled={gerando} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
            {gerando ? 'Gerando...' : 'Gerar PDF de Atletas'}
          </button>
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">Inicio</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">Presenca</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">Financeiro</a>
      </nav>
    </div>
  )
}
