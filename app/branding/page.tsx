'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePerfil } from '@/lib/usePerfil'
import { salvarBranding } from './actions'

const PALETAS = [
  { nome: 'Verde (padrao)', primary: '#16a34a', secondary: '#15803d', texto: '#ffffff' },
  { nome: 'Azul Royal', primary: '#1d4ed8', secondary: '#1e40af', texto: '#ffffff' },
  { nome: 'Vermelho', primary: '#dc2626', secondary: '#b91c1c', texto: '#ffffff' },
  { nome: 'Laranja', primary: '#ea580c', secondary: '#c2410c', texto: '#ffffff' },
  { nome: 'Roxo', primary: '#7c3aed', secondary: '#6d28d9', texto: '#ffffff' },
  { nome: 'Preto & Dourado', primary: '#ca8a04', secondary: '#a16207', texto: '#000000' },
  { nome: 'Azul Marinho', primary: '#0f172a', secondary: '#1e293b', texto: '#ffffff' },
  { nome: 'Rosa', primary: '#db2777', secondary: '#be185d', texto: '#ffffff' },
]

export default function BrandingPage() {
  const { escolaId, isLoaded, isAdmin } = usePerfil()
  const [corPrimaria, setCorPrimaria] = useState('#16a34a')
  const [corSecundaria, setCorSecundaria] = useState('#15803d')
  const [corTexto, setCorTexto] = useState('#ffffff')
  const [logoUrl, setLogoUrl] = useState('')
  const [nomEscola, setNomEscola] = useState('Campo Pro')
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState('')

  useEffect(() => {
    if (!escolaId) return
    supabase.from('Escola')
      .select('nome, corPrimaria, corSecundaria, corTexto, logoUrl')
      .eq('id', escolaId).single()
      .then(({ data }) => {
        if (data) {
          setCorPrimaria(data.corPrimaria || '#16a34a')
          setCorSecundaria(data.corSecundaria || '#15803d')
          setCorTexto(data.corTexto || '#ffffff')
          setLogoUrl(data.logoUrl || '')
          setNomEscola(data.nome || 'Campo Pro')
        }
      })
  }, [escolaId])

  async function salvar() {
    setSalvando(true)
    setResultado('')
    const res = await salvarBranding({ corPrimaria, corSecundaria, corTexto, logoUrl })
    setResultado(res.ok ? 'Visual salvo! Recarregue o app para ver.' : res.message)
    setSalvando(false)
  }

  if (!isLoaded) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">Carregando...</p></div>
  if (!isAdmin) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">Acesso negado</p></div>

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="mb-6"><a href="/configuracoes" className="text-gray-400 text-sm">Configuracoes</a></div>
      <h1 className="text-xl font-bold mb-1" style={{ color: corPrimaria }}>Visual da Escola</h1>
      <p className="text-gray-400 text-sm mb-6">Personalize as cores e logo do seu app</p>

      <div className="rounded-xl p-4 mb-6 border border-gray-800" style={{ background: '#111827' }}>
        <p className="text-gray-500 text-xs mb-3">Preview</p>
        <div className="rounded-xl p-4" style={{ background: '#030712' }}>
          <div className="flex items-center gap-3 mb-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover" onError={() => setLogoUrl('')} />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: corPrimaria, color: corTexto }}>
                {nomEscola.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-bold" style={{ color: corPrimaria }}>{nomEscola}</p>
              <p className="text-gray-400 text-xs">segunda-feira, 1 de junho</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg p-3 bg-gray-900">
              <p className="text-gray-400 text-xs">Alunos Ativos</p>
              <p className="text-2xl font-bold text-white">42</p>
            </div>
            <div className="rounded-lg p-3 bg-gray-900">
              <p className="text-gray-400 text-xs">Receita</p>
              <p className="text-2xl font-bold" style={{ color: corPrimaria }}>R$6.720</p>
            </div>
          </div>
          <button className="w-full rounded-lg py-2 text-sm font-bold" style={{ background: corPrimaria, color: corTexto }}>
            Novo Atleta
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="font-bold text-sm mb-3">Paletas prontas</p>
        <div className="grid grid-cols-2 gap-2">
          {PALETAS.map(p => (
            <button key={p.nome} onClick={() => { setCorPrimaria(p.primary); setCorSecundaria(p.secondary); setCorTexto(p.texto) }}
              className="flex items-center gap-2 p-2 rounded-lg border border-gray-700 hover:border-gray-500 transition text-left">
              <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ background: p.primary }} />
              <span className="text-xs text-gray-300">{p.nome}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="font-bold text-sm mb-3">Cores personalizadas</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div><p className="text-sm">Cor principal</p><p className="text-gray-500 text-xs">Titulos e botoes</p></div>
            <input type="color" value={corPrimaria} onChange={e => setCorPrimaria(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm">Cor secundaria</p><p className="text-gray-500 text-xs">Hover e gradientes</p></div>
            <input type="color" value={corSecundaria} onChange={e => setCorSecundaria(e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-sm">Texto nos botoes</p></div>
            <div className="flex gap-2">
              <button onClick={() => setCorTexto('#ffffff')} className={`px-3 py-1 rounded text-xs border ${corTexto === '#ffffff' ? 'border-white bg-white text-black' : 'border-gray-600 text-gray-400'}`}>Claro</button>
              <button onClick={() => setCorTexto('#000000')} className={`px-3 py-1 rounded text-xs border ${corTexto === '#000000' ? 'border-gray-300 bg-black text-white' : 'border-gray-600 text-gray-400'}`}>Escuro</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="font-bold text-sm mb-1">Logo da escola</p>
        <p className="text-gray-500 text-xs mb-3">Cole o link de uma imagem (PNG ou JPG)</p>
        <input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
          placeholder="https://exemplo.com/logo.png"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm" />
        {logoUrl && (
          <div className="mt-2 flex items-center gap-2">
            <img src={logoUrl} alt="Preview" className="w-10 h-10 rounded-full object-cover border border-gray-700" onError={() => {}} />
            <span className="text-gray-400 text-xs">Preview da logo</span>
          </div>
        )}
      </div>

      {resultado && <p className="text-center text-sm py-2 mb-2 text-green-400">{resultado}</p>}

      <button onClick={salvar} disabled={salvando} className="w-full py-3 rounded-xl font-bold disabled:opacity-50"
        style={{ background: corPrimaria, color: corTexto }}>
        {salvando ? 'Salvando...' : 'Salvar Visual'}
      </button>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">Inicio</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">Presenca</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">Financeiro</a>
      </nav>
    </div>
  )
}
