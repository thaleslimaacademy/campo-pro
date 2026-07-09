'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { usePerfil } from '@/lib/usePerfil'
import BottomNav from '@/components/ui/BottomNav'

const POSICOES: Record<string, string[]> = {
  futebol: ['Goleiro','Zagueiro','Lateral','Volante','Meia','Atacante','Centroavante','Ponta'],
  futsal: ['Goleiro','Fixo','Ala','Pivô'],
  volei: ['Levantador','Oposto','Ponteiro','Central','Líbero'],
  basquete: ['Armador','Ala-Armador','Ala','Ala-Pivô','Pivô'],
  'artes-marciais': ['Faixa Branca','Faixa Azul','Faixa Roxa','Faixa Marrom','Faixa Preta'],
  outras: ['Atleta'],
}
const DIAS_VENC = [1,5,10,15,20,25,28]
const TURNOS = ['Matutino','Vespertino','Noturno','Integral']

const T = { bg:'#0A0E1A', surface:'#0D1220', primary:'#4169E1', text:'#F0F4FF', muted:'rgba(240,244,255,0.45)', border:'rgba(240,244,255,0.08)', green:'#00D67A', red:'#FF4444' }
const SYNE = 'Syne, sans-serif'
const INTER = 'Inter, sans-serif'
const INP: React.CSSProperties = { width:'100%', background:'#080C15', border:`1px solid rgba(240,244,255,0.1)`, borderRadius:8, padding:'12px 14px', color:T.text, fontFamily:INTER, fontSize:14, boxSizing:'border-box', outline:'none' }
const SEL: React.CSSProperties = { ...{}, width:'100%', background:'#080C15', border:`1px solid rgba(240,244,255,0.1)`, borderRadius:8, padding:'12px 14px', color:T.text, fontFamily:INTER, fontSize:14 }
const LBL: React.CSSProperties = { fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:4, fontFamily:SYNE, fontWeight:700 }
const SEC: React.CSSProperties = { background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:18, marginBottom:14 }
const SEC_TITLE = (cor: string) => ({ fontFamily:SYNE, fontWeight:800, fontSize:13, color:cor, textTransform:'uppercase' as const, letterSpacing:0.5, margin:'0 0 14px' })

type Turma = { id: string; nome: string }
type Plano = { id?: string; slug: string; nome: string; valor: string }

export default function NovoAtleta() {
  const { escolaId } = usePerfil()
  const [turmas, setTurmas]   = useState<Turma[]>([])
  const [planos, setPlanos]   = useState<Plano[]>([])
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro]       = useState('')

  const [form, setForm] = useState({
    nome:'', dataNascimento:'', cpf:'', rg:'', telefone:'',
    modalidade:'futebol', posicao:'Goleiro', turmaId:'',
    diaVencimento:'10', planoMensalidade:'', valorMensalidade:'',
    turnoEstuda:'', unidadeEscolar:'', serieEstuda:'',
    cep:'', endereco:'', numero:'', bairro:'', cidade:'', estado:'',
    nomeResponsavel:'', cpfResponsavel:'', whatsappResponsavel:'', emailResponsavel:'', parentescoResponsavel:'',
    nomeResponsavel2:'', cpfResponsavel2:'', whatsappResponsavel2:'', parentesco2:'',
  })

  useEffect(() => {
    if (!escolaId) return
    supabase.from('Turma').select('id, nome').eq('escolaId', escolaId).eq('ativa', true).order('nome')
      .then(({ data }) => setTurmas(data || []))
    supabase.from('PlanoMensalidade').select('slug, nome, valor').eq('escolaId', escolaId).order('valor')
      .then(({ data }) => setPlanos(data || []))
  }, [escolaId])

  async function buscarCep(cep: string) {
    const c = cep.replace(/\D/g,'')
    if (c.length !== 8) return
    try {
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`)
      const d = await r.json()
      if (!d.erro) setForm(p => ({ ...p, endereco:d.logradouro||'', bairro:d.bairro||'', cidade:d.localidade||'', estado:d.uf||'' }))
    } catch {}
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome) { setErro('Nome é obrigatório.'); return }
    if (!form.dataNascimento) { setErro('Data de nascimento é obrigatória.'); return }
    if (!form.nomeResponsavel) { setErro('Nome do responsável é obrigatório.'); return }
    if (!form.cpfResponsavel) { setErro('CPF do responsável é obrigatório.'); return }
    if (!form.whatsappResponsavel) { setErro('WhatsApp do responsável é obrigatório.'); return }
    setLoading(true); setErro('')
    try {
      const tokenPais = crypto.randomUUID()
      const { data: atleta, error: eAtl } = await supabase.from('Atleta').insert({
        escolaId, nome: form.nome,
        dataNascimento: form.dataNascimento,
        cpf: form.cpf || null, rg: form.rg || null,
        telefone: form.telefone || null,
        posicao: form.posicao, turmaId: form.turmaId || null,
        diaVencimento: Number(form.diaVencimento),
        planoMensalidade: form.planoMensalidade || null,
        valorMensalidade: form.valorMensalidade ? Number(form.valorMensalidade) : null,
        turnoEstuda: form.turnoEstuda || null,
        unidadeEscolar: form.unidadeEscolar || null,
        serieEstuda: form.serieEstuda || null,
        cep: form.cep || null, endereco: form.endereco || null,
        numero: form.numero || null, bairro: form.bairro || null,
        cidade: form.cidade || null, estado: form.estado || null,
        ativo: true, tokenPais,
      }).select('id').single()
      if (eAtl) throw eAtl
      // Responsável 1
      await supabase.from('Responsavel').insert({
        atletaId: atleta!.id, nome: form.nomeResponsavel,
        cpf: form.cpfResponsavel || null, whatsapp: form.whatsappResponsavel || null,
        email: form.emailResponsavel || null, telefone: form.whatsappResponsavel || null,
        parentesco: form.parentescoResponsavel || null, principal: true,
      })
      // Responsável 2 (se preenchido)
      if (form.nomeResponsavel2) {
        await supabase.from('Responsavel').insert({
          atletaId: atleta!.id, nome: form.nomeResponsavel2,
          cpf: form.cpfResponsavel2 || null, whatsapp: form.whatsappResponsavel2 || null,
          parentesco: form.parentesco2 || null, principal: false,
        })
      }
      setSucesso(true)
      setTimeout(() => { window.location.href = `/atletas/${atleta!.id}` }, 1000)
    } catch (err: unknown) {
      setErro('Erro ao salvar: ' + (err as Error).message)
    }
    setLoading(false)
  }

  if (sucesso) return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:52 }}>✅</div>
      <p style={{ fontFamily:SYNE, fontWeight:900, fontSize:20, color:T.green }}>Atleta cadastrado!</p>
      <p style={{ color:T.muted, fontSize:13 }}>Redirecionando...</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:INTER, paddingBottom:80 }}>

      {/* HEADER */}
      <div style={{ background:T.primary, padding:'20px 20px 20px' }}>
        <a href="/atletas" style={{ fontSize:12, color:'rgba(240,244,255,0.65)', textDecoration:'none', display:'block', marginBottom:8 }}>← Atletas</a>
        <h1 style={{ fontFamily:SYNE, fontWeight:900, fontSize:22, color:T.text, margin:0, textTransform:'uppercase', letterSpacing:-0.5 }}>Novo Atleta</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding:'16px 16px' }}>

        {/* DADOS PESSOAIS */}
        <div style={SEC}>
          <p style={SEC_TITLE(T.primary)}>👤 Dados Pessoais</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div><label style={LBL}>Nome completo *</label><input name="nome" value={form.nome} onChange={handleChange} placeholder="Nome completo do atleta" style={INP} /></div>
            <div><label style={LBL}>Data de nascimento *</label><input type="date" name="dataNascimento" value={form.dataNascimento} onChange={handleChange} style={INP} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={LBL}>CPF</label><input name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" style={INP} /></div>
              <div><label style={LBL}>RG</label><input name="rg" value={form.rg} onChange={handleChange} style={INP} /></div>
            </div>
            <div><label style={LBL}>Telefone</label><input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(34) 99999-9999" style={INP} /></div>
          </div>
        </div>

        {/* ESPORTE & TURMA */}
        <div style={SEC}>
          <p style={SEC_TITLE(T.primary)}>⚽ Esporte & Turma</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={LBL}>Modalidade</label>
                <select name="modalidade" value={form.modalidade} onChange={handleChange} style={SEL}>
                  {Object.keys(POSICOES).map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
                </select>
              </div>
              <div><label style={LBL}>Posição</label>
                <select name="posicao" value={form.posicao} onChange={handleChange} style={SEL}>
                  {(POSICOES[form.modalidade] || []).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div><label style={LBL}>Turma</label>
              <select name="turmaId" value={form.turmaId} onChange={handleChange} style={SEL}>
                <option value="">Sem turma</option>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={LBL}>Turno da escolinha</label>
                <select name="turnoEstuda" value={form.turnoEstuda} onChange={handleChange} style={SEL}>
                  <option value="">Não definido</option>
                  {TURNOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label style={LBL}>Dia de vencimento</label>
                <select name="diaVencimento" value={form.diaVencimento} onChange={handleChange} style={SEL}>
                  {DIAS_VENC.map(d => <option key={d} value={d}>Dia {d}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* PLANO & PAGAMENTO */}
        <div style={SEC}>
          <p style={SEC_TITLE(T.primary)}>💰 Plano & Pagamento</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div><label style={LBL}>Plano de mensalidade</label>
              <select name="planoMensalidade" value={form.planoMensalidade} onChange={e => {
                const plano = planos.find(p => p.slug === e.target.value)
                setForm(prev => ({ ...prev, planoMensalidade: e.target.value, valorMensalidade: plano ? String(plano.valor) : prev.valorMensalidade }))
              }} style={SEL}>
                <option value="">Selecionar plano</option>
                {planos.map(p => <option key={p.slug} value={p.slug}>{p.nome} — R$ {Number(p.valor).toFixed(2)}</option>)}
              </select>
            </div>
            <div><label style={LBL}>Valor da mensalidade (R$)</label>
              <input type="number" name="valorMensalidade" value={form.valorMensalidade} onChange={handleChange} placeholder="Ex: 135" style={INP} />
            </div>
          </div>
        </div>

        {/* ESCOLA QUE ESTUDA */}
        <div style={SEC}>
          <p style={SEC_TITLE(T.primary)}>🏫 Escola que Estuda</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div><label style={LBL}>Unidade escolar</label><input name="unidadeEscolar" value={form.unidadeEscolar} onChange={handleChange} placeholder="Nome da escola" style={INP} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={LBL}>Série/Ano</label><input name="serieEstuda" value={form.serieEstuda} onChange={handleChange} placeholder="Ex: 5º ano" style={INP} /></div>
              <div><label style={LBL}>Turno</label>
                <select name="turnoEstuda" value={form.turnoEstuda} onChange={handleChange} style={SEL}>
                  <option value="">Selecionar</option>
                  {TURNOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ENDEREÇO */}
        <div style={SEC}>
          <p style={SEC_TITLE(T.primary)}>📍 Endereço</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div><label style={LBL}>CEP</label><input name="cep" value={form.cep} onChange={handleChange} onBlur={e => buscarCep(e.target.value)} placeholder="00000-000" style={INP} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:10 }}>
              <div><label style={LBL}>Endereço</label><input name="endereco" value={form.endereco} onChange={handleChange} placeholder="Rua..." style={INP} /></div>
              <div><label style={LBL}>Nº</label><input name="numero" value={form.numero} onChange={handleChange} style={INP} /></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={LBL}>Bairro</label><input name="bairro" value={form.bairro} onChange={handleChange} style={INP} /></div>
              <div><label style={LBL}>Cidade</label><input name="cidade" value={form.cidade} onChange={handleChange} style={INP} /></div>
            </div>
            <div style={{ width:80 }}><label style={LBL}>Estado</label><input name="estado" value={form.estado} onChange={handleChange} placeholder="MG" style={INP} /></div>
          </div>
        </div>

        {/* RESPONSÁVEL 1 */}
        <div style={SEC}>
          <p style={SEC_TITLE(T.primary)}>👨‍👩‍👦 Responsável 1</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div><label style={LBL}>Nome completo *</label><input name="nomeResponsavel" value={form.nomeResponsavel} onChange={handleChange} placeholder="Nome do responsável" style={INP} /></div>
            <div><label style={LBL}>CPF *</label><input name="cpfResponsavel" value={form.cpfResponsavel} onChange={handleChange} placeholder="000.000.000-00" style={INP} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={LBL}>WhatsApp *</label><input name="whatsappResponsavel" value={form.whatsappResponsavel} onChange={handleChange} placeholder="(34) 99999-9999" style={INP} /></div>
              <div><label style={LBL}>Parentesco</label>
                <select name="parentescoResponsavel" value={form.parentescoResponsavel} onChange={handleChange} style={SEL}>
                  <option value="">Selecionar</option>
                  {['Pai','Mãe','Avô/Avó','Tio/Tia','Responsável Legal'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div><label style={LBL}>E-mail</label><input type="email" name="emailResponsavel" value={form.emailResponsavel} onChange={handleChange} placeholder="email@exemplo.com" style={INP} /></div>
          </div>
        </div>

        {/* RESPONSÁVEL 2 */}
        <div style={SEC}>
          <p style={SEC_TITLE(T.muted)}>👤 Responsável 2 (opcional)</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div><label style={LBL}>Nome completo</label><input name="nomeResponsavel2" value={form.nomeResponsavel2} onChange={handleChange} placeholder="Nome do 2º responsável" style={INP} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={LBL}>CPF</label><input name="cpfResponsavel2" value={form.cpfResponsavel2} onChange={handleChange} placeholder="000.000.000-00" style={INP} /></div>
              <div><label style={LBL}>WhatsApp</label><input name="whatsappResponsavel2" value={form.whatsappResponsavel2} onChange={handleChange} placeholder="(34) 99999-9999" style={INP} /></div>
            </div>
            <div><label style={LBL}>Parentesco</label>
              <select name="parentesco2" value={form.parentesco2} onChange={handleChange} style={SEL}>
                <option value="">Selecionar</option>
                {['Pai','Mãe','Avô/Avó','Tio/Tia','Irmão/Irmã','Outro'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {erro && <div style={{ background:'rgba(255,68,68,0.1)', border:'1px solid rgba(255,68,68,0.3)', borderRadius:10, padding:'12px 14px', marginBottom:14 }}><p style={{ color:T.red, fontSize:13, margin:0 }}>❌ {erro}</p></div>}

        <button type="submit" disabled={loading}
          style={{ width:'100%', background:T.primary, color:T.text, padding:'16px', borderRadius:12, fontFamily:SYNE, fontWeight:900, fontSize:15, border:'none', cursor:loading?'not-allowed':'pointer', textTransform:'uppercase', letterSpacing:0.5, opacity:loading?0.6:1 }}>
          {loading ? 'Salvando...' : '✅ Cadastrar Atleta'}
        </button>
      </form>

      <BottomNav />
    </div>
  )
}
