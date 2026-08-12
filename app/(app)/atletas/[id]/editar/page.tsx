'use client'
import { useEffect, useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAtletaParaEditar, salvarAtleta, toggleAtivoAtleta, excluirAtleta } from './actions'

const T = { bg:'#0A0E1A', surface:'#0D1220', surface2:'#121A2E', primary:'#4169E1', accent:'#00BFFF', text:'#F0F4FF', muted:'rgba(240,244,255,0.4)', border:'rgba(240,244,255,0.08)', green:'#00D67A', red:'#FF4444', gold:'#FFD700' }
const SYNE = 'Syne, sans-serif'
const INP: React.CSSProperties = { width:'100%', background:'#080C15', border:`1px solid rgba(240,244,255,0.1)`, borderRadius:8, padding:'11px 14px', color:T.text, fontFamily:'Inter,sans-serif', fontSize:13, boxSizing:'border-box' }
const LBL: React.CSSProperties = { fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:4 }
const SEC: React.CSSProperties = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:16, marginBottom:12 }
const SEC_TITLE: React.CSSProperties = { fontFamily:SYNE, fontWeight:700, fontSize:11, color:T.primary, textTransform:'uppercase', letterSpacing:1, marginBottom:14 }

const POSICOES = ['Goleiro','Zagueiro','Lateral Direito','Lateral Esquerdo','Volante','Meia','Meia-atacante','Atacante','Centroavante']
const DIAS_VCTO = Array.from({length:31},(_,i)=>String(i+1))

type Turma = { id: string; nome: string }

export default function EditarAtleta() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, startLoad] = useTransition()
  const [salvando, startSave] = useTransition()
  const [sucesso, setSucesso] = useState(false)
  const [ativo, setAtivo] = useState(true)
  const [bolsista, setBolsista] = useState(false)
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [form, setForm] = useState({ nome:'', dataNascimento:'', cpf:'', rg:'', posicao:'', telefone:'', valorMensalidade:'', diaVencimento:'10', motivoBolsa:'', turmaId:'', cep:'', endereco:'', numero:'', bairro:'', cidade:'', estado:'' })

  useEffect(() => {
    startLoad(async () => {
      const d = await getAtletaParaEditar(id)
      const a = d.atleta as Record<string, unknown>
      if (!a) { router.push('/atletas'); return }
      setAtivo(Boolean(a.ativo))
      setBolsista(Boolean(a.bolsista))
      setTurmas(d.turmas as Turma[])
      setForm({
        nome: String(a.nome || ''), dataNascimento: a.dataNascimento ? String(a.dataNascimento).split('T')[0] : '',
        cpf: String(a.cpf || ''), rg: String(a.rg || ''), posicao: String(a.posicao || ''),
        telefone: String(a.telefone || ''), valorMensalidade: a.valorMensalidade != null ? String(a.valorMensalidade) : '',
        diaVencimento: String(a.diaVencimento || '10'), motivoBolsa: String(a.motivoBolsa || ''),
        turmaId: String(a.turmaId || ''), cep: String(a.cep || ''), endereco: String(a.endereco || ''),
        numero: String(a.numero || ''), bairro: String(a.bairro || ''), cidade: String(a.cidade || ''), estado: String(a.estado || ''),
      })
    })
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function buscarCep(cep: string) {
    const c = cep.replace(/\D/g, '')
    if (c.length !== 8) return
    try {
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`)
      const d = await r.json()
      if (!d.erro) setForm(p => ({ ...p, endereco: d.logradouro || '', bairro: d.bairro || '', cidade: d.localidade || '', estado: d.uf || '' }))
    } catch {}
  }

  function salvar() {
    startSave(async () => {
      const resultado = await salvarAtleta(id, {
        nome: form.nome, dataNascimento: form.dataNascimento || null, cpf: form.cpf || null, rg: form.rg || null,
        posicao: form.posicao || null, telefone: form.telefone || null,
        valorMensalidade: bolsista ? 0 : (form.valorMensalidade ? Number(form.valorMensalidade) : null),
        diaVencimento: Number(form.diaVencimento), bolsista, motivoBolsa: bolsista ? form.motivoBolsa : null,
        turmaId: form.turmaId || null, cep: form.cep || null, endereco: form.endereco || null,
        numero: form.numero || null, bairro: form.bairro || null, cidade: form.cidade || null, estado: form.estado || null,
      })
      if (resultado && 'avisosMensalidade' in resultado && resultado.avisosMensalidade) {
        alert('Atleta salvo, mas houve avisos ao atualizar cobranças futuras:\n' + resultado.avisosMensalidade.join('\n'))
      }
      setSucesso(true)
      setTimeout(() => { router.push(`/atletas/${id}`) }, 1200)
    })
  }

  function toggleAtivo() {
    startSave(async () => {
      const novo = !ativo
      await toggleAtivoAtleta(id, novo)
      setAtivo(novo)
    })
  }

  function deletar() {
    if (!confirm('EXCLUIR permanentemente este atleta e todos os seus dados?')) return
    startSave(async () => {
      try {
        await excluirAtleta(id)
        router.push('/atletas')
      } catch (e) {
        alert((e as Error).message || 'Nao foi possivel excluir o atleta.')
      }
    })
  }

  const sel = { ...INP } as React.CSSProperties

  if (loading) return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:T.muted, fontFamily:'Inter,sans-serif' }}>Carregando...</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'Inter,sans-serif', paddingBottom:80 }}>

      {/* HEADER */}
      <div style={{ background:T.primary, padding:'20px 20px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <a href={`/atletas/${id}`} style={{ color:'rgba(240,244,255,0.7)', textDecoration:'none', fontSize:16 }}>←</a>
            <div>
              <div style={{ fontSize:10, color:'rgba(240,244,255,0.65)', textTransform:'uppercase', letterSpacing:2, fontWeight:700, marginBottom:2 }}>Atleta</div>
              <div style={{ fontFamily:SYNE, fontWeight:900, fontSize:20, color:T.text, letterSpacing:-0.5, textTransform:'uppercase' }}>✏️ Editar</div>
            </div>
          </div>
          <button onClick={salvar} disabled={salvando} style={{ background:T.text, color:T.primary, borderRadius:8, padding:'10px 16px', fontFamily:SYNE, fontWeight:800, fontSize:12, border:'none', cursor:'pointer', textTransform:'uppercase', letterSpacing:0.5, opacity:salvando?0.6:1 }}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div style={{ padding:'14px 16px' }}>

        {sucesso && <div style={{ background:`${T.green}15`, border:`1px solid ${T.green}30`, borderRadius:10, padding:12, marginBottom:12, textAlign:'center' }}><p style={{ color:T.green, fontWeight:700, fontFamily:SYNE }}>✅ Salvo! Redirecionando...</p></div>}
        {!ativo && <div style={{ background:`${T.red}10`, border:`1px solid ${T.red}25`, borderRadius:10, padding:12, marginBottom:12, textAlign:'center' }}><p style={{ color:T.red, fontWeight:700, fontFamily:SYNE }}>⛔ Atleta inativo</p></div>}

        {/* DADOS DO ATLETA */}
        <div style={SEC}>
          <p style={SEC_TITLE}>🙋 Dados do Atleta</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div><label style={LBL}>Nome completo *</label><input name="nome" value={form.nome} onChange={handleChange} style={INP} placeholder="Nome completo" /></div>
            <div><label style={LBL}>Data de nascimento</label><input type="date" name="dataNascimento" value={form.dataNascimento} onChange={handleChange} style={INP} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={LBL}>CPF</label><input name="cpf" value={form.cpf} onChange={handleChange} style={INP} placeholder="000.000.000-00" /></div>
              <div><label style={LBL}>RG</label><input name="rg" value={form.rg} onChange={handleChange} style={INP} placeholder="RG" /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={LBL}>Posição</label>
                <select name="posicao" value={form.posicao} onChange={handleChange} style={sel}>
                  <option value="">Selecionar</option>
                  {POSICOES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div><label style={LBL}>Telefone</label><input name="telefone" value={form.telefone} onChange={handleChange} style={INP} placeholder="(34) 99999-9999" /></div>
            </div>
            <div><label style={LBL}>Turma</label>
              <select name="turmaId" value={form.turmaId} onChange={handleChange} style={sel}>
                <option value="">Sem turma</option>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* PLANO & PAGAMENTO */}
        <div style={SEC}>
          <p style={SEC_TITLE}>💰 Plano & Pagamento</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:bolsista?`${T.green}10`:'#080C15', border:`1px solid ${bolsista?T.green+'30':T.border}`, borderRadius:8, padding:'12px 14px' }}>
              <div>
                <p style={{ fontFamily:SYNE, fontWeight:700, fontSize:12, color:bolsista?T.green:T.text, margin:'0 0 2px' }}>🎓 Aluno Bolsista</p>
                <p style={{ fontSize:11, color:T.muted, margin:0 }}>Mensalidade 100% gratuita</p>
              </div>
              <button onClick={() => setBolsista(!bolsista)} style={{ width:44, height:24, borderRadius:12, background:bolsista?T.green:'rgba(240,244,255,0.15)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
                <div style={{ position:'absolute', top:3, left:bolsista?22:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
              </button>
            </div>
            {bolsista && <div><label style={LBL}>Motivo da bolsa</label><input name="motivoBolsa" value={form.motivoBolsa} onChange={handleChange} style={INP} placeholder="Ex: Projeto social, Destaque esportivo..." /></div>}
            {!bolsista && (
              <>
                <div>
                  <label style={LBL}>Valor da mensalidade (R$)</label>
                  <input name="valorMensalidade" value={form.valorMensalidade} onChange={handleChange} type="number" step="0.01" min="0" style={INP} placeholder="Ex: 175.00 (soma de várias modalidades)" />
                  <p style={{ fontSize:10, color:T.muted, marginTop:4 }}>Ao mudar, as mensalidades futuras já geradas são atualizadas automaticamente.</p>
                </div>
                <div><label style={LBL}>Dia de vencimento</label>
                  <select name="diaVencimento" value={form.diaVencimento} onChange={handleChange} style={sel}>
                    {DIAS_VCTO.map(d => <option key={d} value={d}>Dia {d}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ENDEREÇO */}
        <div style={SEC}>
          <p style={SEC_TITLE}>📍 Endereço</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div><label style={LBL}>CEP</label><input name="cep" value={form.cep} onChange={handleChange} onBlur={e => buscarCep(e.target.value)} style={INP} placeholder="00000-000" /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10 }}>
              <div><label style={LBL}>Endereço</label><input name="endereco" value={form.endereco} onChange={handleChange} style={INP} placeholder="Rua, Av..." /></div>
              <div><label style={LBL}>Nº</label><input name="numero" value={form.numero} onChange={handleChange} style={{ ...INP, width:70 }} placeholder="Nº" /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={LBL}>Bairro</label><input name="bairro" value={form.bairro} onChange={handleChange} style={INP} /></div>
              <div><label style={LBL}>Cidade</label><input name="cidade" value={form.cidade} onChange={handleChange} style={INP} /></div>
            </div>
            <div><label style={LBL}>Estado</label><input name="estado" value={form.estado} onChange={handleChange} style={{ ...INP, width:80 }} placeholder="MG" /></div>
          </div>
        </div>

        {/* AÇÕES PERIGOSAS */}
        <div style={{ ...SEC, borderColor:`${T.red}20` }}>
          <p style={{ ...SEC_TITLE, color:T.red }}>⚠️ Ações</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button onClick={toggleAtivo} style={{ background:ativo?'rgba(255,68,68,0.08)':'rgba(0,214,122,0.08)', border:`1px solid ${ativo?T.red+'25':T.green+'25'}`, color:ativo?T.red:T.green, padding:'12px', borderRadius:8, fontFamily:SYNE, fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'uppercase' }}>
              {ativo ? 'Desativar atleta' : 'Reativar atleta'}
            </button>
            <button onClick={deletar} style={{ background:'rgba(255,68,68,0.06)', border:`1px solid ${T.red}20`, color:T.red, padding:'12px', borderRadius:8, fontFamily:SYNE, fontWeight:700, fontSize:12, cursor:'pointer', textTransform:'uppercase' }}>
              Excluir permanentemente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
