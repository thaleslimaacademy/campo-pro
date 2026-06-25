'use client'
import { useState, useRef } from 'react'
import { importarAtletas, type AtletaImport } from './actions'
import Link from 'next/link'

const C = { bg: '#0A0E1A', surface: '#1A1A2E', orange: '#4169E1', gold: '#FFD700', green: '#00D67A', red: '#FF4B4B', muted: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.08)' }
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'

const CAMPOS: { key: keyof AtletaImport; label: string; required?: boolean }[] = [
  { key: 'nome', label: 'Nome', required: true },
  { key: 'dataNascimento', label: 'Data de Nascimento' },
  { key: 'posicao', label: 'Posição' },
  { key: 'cpf', label: 'CPF' },
  { key: 'rg', label: 'RG' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'cidade', label: 'Cidade' },
  { key: 'estado', label: 'Estado' },
  { key: 'nomeResponsavel', label: 'Nome do Responsável' },
  { key: 'whatsappResponsavel', label: 'WhatsApp do Responsável' },
  { key: 'emailResponsavel', label: 'E-mail do Responsável' },
]

const SINONIMOS: Record<string, keyof AtletaImport> = {
  nome: 'nome', name: 'nome', atleta: 'nome', aluno: 'nome', player: 'nome',
  nascimento: 'dataNascimento', 'data nascimento': 'dataNascimento', 'data de nascimento': 'dataNascimento', birth: 'dataNascimento',
  posicao: 'posicao', posição: 'posicao', position: 'posicao', pos: 'posicao',
  cpf: 'cpf', rg: 'rg',
  telefone: 'telefone', tel: 'telefone', fone: 'telefone', celular: 'telefone',
  cidade: 'cidade', city: 'cidade',
  estado: 'estado', uf: 'estado', state: 'estado',
  responsavel: 'nomeResponsavel', responsável: 'nomeResponsavel', pai: 'nomeResponsavel', mae: 'nomeResponsavel',
  whatsapp: 'whatsappResponsavel', whats: 'whatsappResponsavel',
  email: 'emailResponsavel', 'e-mail': 'emailResponsavel',
}

function detectarMapeamento(colunas: string[]): Record<string, keyof AtletaImport | ''> {
  const map: Record<string, keyof AtletaImport | ''> = {}
  colunas.forEach(col => {
    const key = col.toLowerCase().trim().replace(/[_-]/g, ' ')
    map[col] = SINONIMOS[key] || ''
  })
  return map
}

export default function ImportarPage() {
  const [step, setStep] = useState<'upload' | 'mapear' | 'preview' | 'resultado'>('upload')
  const [colunas, setColunas] = useState<string[]>([])
  const [linhas, setLinhas] = useState<Record<string, string>[]>([])
  const [mapeamento, setMapeamento] = useState<Record<string, keyof AtletaImport | ''>>({})
  const [importando, setImportando] = useState(false)
  const [resultados, setResultados] = useState<{ nome: string; ok: boolean; erro?: string }[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'csv') {
      const text = await file.text()
      const linhasRaw = text.split('\n').filter(l => l.trim())
      const sep = linhasRaw[0].includes(';') ? ';' : ','
      const cols = linhasRaw[0].split(sep).map(c => c.trim().replace(/"/g,''))
      const dados = linhasRaw.slice(1).map(l => {
        const vals = l.split(sep).map(v => v.trim().replace(/"/g,''))
        const obj: Record<string,string> = {}
        cols.forEach((c,i) => { obj[c] = vals[i] || '' })
        return obj
      })
      setColunas(cols); setLinhas(dados)
      setMapeamento(detectarMapeamento(cols))
      setStep('mapear')
    } else {
      const { read, utils } = await import('xlsx')
      const buf = await file.arrayBuffer()
      const wb = read(buf)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json: string[][] = utils.sheet_to_json(ws, { header: 1 })
      const cols = (json[0] || []).map(String)
      const dados = json.slice(1).filter(r => r.some(v => v)).map(r => {
        const obj: Record<string,string> = {}
        cols.forEach((c,i) => { obj[c] = String(r[i] ?? '') })
        return obj
      })
      setColunas(cols); setLinhas(dados)
      setMapeamento(detectarMapeamento(cols))
      setStep('mapear')
    }
  }

  const downloadTemplate = async () => {
    const { utils, writeFile } = await import('xlsx')
    const ws = utils.aoa_to_sheet([
      ['nome','dataNascimento','posicao','cpf','telefone','cidade','estado','nomeResponsavel','whatsappResponsavel','emailResponsavel'],
      ['João Silva','2012-03-15','Atacante','','(34) 99999-0001','Iturama','MG','Maria Silva','(34) 99999-0002','maria@email.com'],
    ])
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Atletas')
    writeFile(wb, 'template-importacao-gestaofc.xlsx')
  }

  const atletasParaImportar = (): AtletaImport[] =>
    linhas.map(linha => {
      const a: AtletaImport = { nome: '' }
      Object.entries(mapeamento).forEach(([col, campo]) => {
        if (campo) (a as Record<string, string>)[campo] = linha[col] || ''
      })
      return a
    }).filter(a => a.nome?.trim())

  const importar = async () => {
    setImportando(true)
    const res = await importarAtletas(atletasParaImportar())
    setResultados(res)
    setStep('resultado')
    setImportando(false)
  }

  const ok = resultados.filter(r => r.ok).length
  const erros = resultados.filter(r => !r.ok).length

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: '#F0F4FF', fontFamily: INTER, padding: '0 0 80px' }}>

      <div style={{ padding: '20px 20px 16px' }}>
        <p style={{ color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Atletas</p>
        <h1 style={{ fontFamily: SYNE, fontSize: 26, fontWeight: 800, color: C.orange, margin: 0 }}>Importar Atletas</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Migre atletas de qualquer sistema via planilha Excel ou CSV</p>
      </div>

      {/* STEP: UPLOAD */}
      {step === 'upload' && (
        <div style={{ padding: '0 20px' }}>
          <button onClick={downloadTemplate}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surface, border: `1px solid ${C.border}`, color: C.gold, padding: '12px 18px', borderRadius: 12, cursor: 'pointer', fontFamily: SYNE, fontWeight: 700, fontSize: 13, marginBottom: 20 }}>
            📥 Baixar Template Excel
          </button>

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) handleFile(f) }}
            style={{ border: `2px dashed ${C.border}`, borderRadius: 16, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: C.surface, transition: 'border-color 0.2s' }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
            <p style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 8 }}>Arraste ou clique para enviar</p>
            <p style={{ color: C.muted, fontSize: 13 }}>Excel (.xlsx, .xls) ou CSV (.csv)</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if(f) handleFile(f) }} />
          </div>

          <div style={{ marginTop: 20, background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 13, color: C.orange, marginBottom: 8 }}>💡 Dica de migração</p>
            <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
              Exporte os atletas do seu sistema atual como Excel ou CSV. Qualquer coluna funciona — você vai mapear os campos na próxima etapa. Baixe o template acima para ver o formato ideal.
            </p>
          </div>
        </div>
      )}

      {/* STEP: MAPEAR */}
      {step === 'mapear' && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ background: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}`, marginBottom: 16 }}>
            <p style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 4 }}>
              {linhas.length} linhas encontradas
            </p>
            <p style={{ color: C.muted, fontSize: 12 }}>Confirme o mapeamento das colunas:</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {colunas.map(col => (
              <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.surface, borderRadius: 12, padding: '12px 16px', border: `1px solid ${C.border}` }}>
                <span style={{ flex: 1, fontSize: 13, color: '#fff', fontFamily: SYNE }}>{col}</span>
                <span style={{ color: C.muted, fontSize: 12 }}>→</span>
                <select
                  value={mapeamento[col] || ''}
                  onChange={e => setMapeamento(prev => ({ ...prev, [col]: e.target.value as keyof AtletaImport | '' }))}
                  style={{ background: '#0A0E1A', border: `1px solid ${C.border}`, color: mapeamento[col] ? C.orange : C.muted, padding: '6px 10px', borderRadius: 8, fontFamily: INTER, fontSize: 12 }}
                >
                  <option value="">— ignorar —</option>
                  {CAMPOS.map(c => <option key={c.key} value={c.key}>{c.label}{c.required ? ' *' : ''}</option>)}
                </select>
              </div>
            ))}
          </div>

          <button onClick={() => setStep('preview')}
            style={{ width: '100%', background: C.orange, color: '#fff', padding: '15px', borderRadius: 14, fontFamily: SYNE, fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer' }}>
            Ver Preview →
          </button>
        </div>
      )}

      {/* STEP: PREVIEW */}
      {step === 'preview' && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ background: C.surface, borderRadius: 12, padding: '12px 16px', marginBottom: 16, border: `1px solid ${C.border}` }}>
            <p style={{ color: '#fff', fontFamily: SYNE, fontWeight: 700, fontSize: 14 }}>
              {atletasParaImportar().length} atletas prontos para importar
            </p>
            <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Primeiros 5 registros:</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {atletasParaImportar().slice(0, 5).map((a, i) => (
              <div key={i} style={{ background: C.surface, borderRadius: 12, padding: '12px 16px', border: `1px solid ${C.border}` }}>
                <p style={{ fontFamily: SYNE, fontWeight: 700, color: '#fff', fontSize: 14, margin: '0 0 4px' }}>{a.nome}</p>
                <p style={{ color: C.muted, fontSize: 12 }}>
                  {[a.posicao, a.cidade, a.nomeResponsavel].filter(Boolean).join(' · ')}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep('mapear')}
              style={{ flex: 1, background: C.surface, color: C.muted, padding: '15px', borderRadius: 14, fontFamily: SYNE, fontWeight: 700, fontSize: 14, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
              ← Voltar
            </button>
            <button onClick={importar} disabled={importando}
              style={{ flex: 2, background: importando ? C.surface : C.green, color: '#fff', padding: '15px', borderRadius: 14, fontFamily: SYNE, fontWeight: 800, fontSize: 14, border: 'none', cursor: importando ? 'not-allowed' : 'pointer' }}>
              {importando ? 'Importando...' : `🚀 Importar ${atletasParaImportar().length} atletas`}
            </button>
          </div>
        </div>
      )}

      {/* STEP: RESULTADO */}
      {step === 'resultado' && (
        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: C.surface, borderRadius: 14, padding: 20, border: `1px solid ${C.green}33`, textAlign: 'center' }}>
              <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 32, color: C.green, margin: 0 }}>{ok}</p>
              <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Importados com sucesso</p>
            </div>
            <div style={{ background: C.surface, borderRadius: 14, padding: 20, border: `1px solid ${erros > 0 ? C.red : C.border}33`, textAlign: 'center' }}>
              <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 32, color: erros > 0 ? C.red : C.muted, margin: 0 }}>{erros}</p>
              <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Erros</p>
            </div>
          </div>

          {erros > 0 && (
            <div style={{ background: C.surface, borderRadius: 12, padding: 16, border: `1px solid ${C.border}`, marginBottom: 16 }}>
              <p style={{ fontFamily: SYNE, fontWeight: 700, color: C.red, fontSize: 13, marginBottom: 8 }}>Registros com erro:</p>
              {resultados.filter(r => !r.ok).map((r, i) => (
                <p key={i} style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>❌ {r.nome} — {r.erro}</p>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setStep('upload'); setColunas([]); setLinhas([]); setResultados([]) }}
              style={{ flex: 1, background: C.surface, color: C.muted, padding: '15px', borderRadius: 14, fontFamily: SYNE, fontWeight: 700, fontSize: 13, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
              Nova importação
            </button>
            <Link href="/atletas"
              style={{ flex: 2, background: C.orange, color: '#fff', padding: '15px', borderRadius: 14, fontFamily: SYNE, fontWeight: 800, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Ver atletas →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}