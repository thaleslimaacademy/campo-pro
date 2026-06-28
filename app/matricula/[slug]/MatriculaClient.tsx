'use client'
import { useState, useRef } from 'react'

const INTER = 'Inter, sans-serif'
const SYNE  = 'Syne, sans-serif'

const CONTRATO = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESPORTIVOS

CLÁUSULA 1 — DO OBJETO
O presente contrato tem por objeto a prestação de serviços de treinamento e formação esportiva, oferecidos pela academia ao atleta identificado nesta ficha de matrícula.

CLÁUSULA 2 — DA MATRÍCULA E MENSALIDADE
2.1 A matrícula somente será confirmada após aprovação da ficha pelo responsável da academia.
2.2 O valor da mensalidade será informado no ato da matrícula e poderá ser reajustado anualmente com aviso prévio de 30 dias.
2.3 O vencimento da mensalidade ocorrerá todo dia 10 de cada mês.
2.4 Em caso de não pagamento: multa de 2% + juros de 1% ao mês.
2.5 Atraso superior a 90 dias implica cancelamento automático.

CLÁUSULA 3 — DO CANCELAMENTO
3.1 O cancelamento deverá ser comunicado por escrito com 30 dias de antecedência.
3.2 Não haverá devolução de mensalidades já pagas.

CLÁUSULA 4 — DAS OBRIGAÇÕES DO CONTRATANTE
4.1 Manter os dados cadastrais sempre atualizados.
4.2 Informar qualquer condição de saúde ou limitação física do atleta.
4.3 Responsabilizar-se pelo transporte do atleta até o local de treinamento.

CLÁUSULA 5 — DIREITO DE IMAGEM
5.1 O contratante autoriza o uso da imagem e nome do atleta pela academia para divulgação em redes sociais e materiais promocionais.

CLÁUSULA 6 — DO FORO
Fica eleito o foro da comarca onde a academia está situada para dirimir quaisquer controvérsias.`

const POSICOES = ['Goleiro','Zagueiro','Lateral Direito','Lateral Esquerdo','Volante','Meia','Meia-atacante','Atacante','Centroavante','Não definido']

interface Props {
  escolaId: string
  escolaNome: string
  escolaLogoUrl: string | null
  valorMatricula: number
  corPrimaria?: string
  corSecundaria?: string
}

export default function MatriculaClient({ escolaId, escolaNome, escolaLogoUrl, valorMatricula, corPrimaria = '#0A0E1A', corSecundaria = '#4169E1' }: Props) {
  const bg      = corPrimaria
  const accent  = corSecundaria
  const isDark  = bg === '#FFFFFF' || bg === '#F0F4FF' ? false : true
  const textCol = isDark ? '#F0F4FF' : '#0A0E1A'
  const mutedCol = isDark ? 'rgba(240,244,255,0.5)' : 'rgba(10,14,26,0.5)'
  const borderCol = isDark ? 'rgba(240,244,255,0.1)' : 'rgba(10,14,26,0.1)'
  const surfaceCol = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'

  const INP: React.CSSProperties = { width:'100%', background:surfaceCol, border:`1px solid ${borderCol}`, borderRadius:10, padding:'13px 14px', color:textCol, fontFamily:INTER, fontSize:14, boxSizing:'border-box', outline:'none' }
  const LBL: React.CSSProperties = { fontSize:11, color:mutedCol, textTransform:'uppercase', letterSpacing:'0.8px', display:'block', marginBottom:6 }
  const SEC: React.CSSProperties = { background:surfaceCol, border:`1px solid ${borderCol}`, borderRadius:16, padding:20, marginBottom:16 }

  const [step, setStep] = useState<'form' | 'contrato' | 'pagamento' | 'sucesso'>('form')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [contratoLido, setContratoLido] = useState(false)
  const [assinatura, setAssinatura] = useState('')
  const [matriculaId, setMatriculaId] = useState('')
  const contratoRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    nomeAtleta:'', dataNascimento:'', cpf:'', rg:'', posicao:'Goleiro', telefone:'',
    cep:'', endereco:'', numero:'', bairro:'', cidade:'', estado:'',
    nomeResponsavel:'', whatsappResponsavel:'', emailResponsavel:'',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setErro('')
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

  function validarForm() {
    if (!form.nomeAtleta)        return 'Nome do atleta é obrigatório.'
    if (!form.dataNascimento)    return 'Data de nascimento é obrigatória.'
    if (!form.cpf && !form.rg)   return 'Pelo menos CPF ou RG é obrigatório.'
    if (!form.nomeResponsavel)   return 'Nome do responsável é obrigatório.'
    if (!form.whatsappResponsavel) return 'WhatsApp do responsável é obrigatório.'
    return null
  }

  function avancarParaContrato() {
    const e = validarForm()
    if (e) { setErro(e); return }
    setStep('contrato')
    setErro('')
  }

  async function assinarEEnviar() {
    if (!assinatura.trim()) { setErro('Digite seu nome completo para assinar.'); return }
    if (!contratoLido)      { setErro('Role até o final do contrato para continuar.'); return }
    setEnviando(true); setErro('')
    try {
      const res = await fetch('/api/matricula/criar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escolaId, ...form, nomeAssinatura: assinatura, dataAssinatura: new Date().toISOString() }),
      })
      const data = await res.json()
      if (data.ok) {
        setMatriculaId(data.matriculaId || '')
        setStep(valorMatricula > 0 ? 'pagamento' : 'sucesso')
      } else {
        setErro(data.error || 'Erro ao enviar matrícula. Tente novamente.')
      }
    } catch { setErro('Erro de conexão. Tente novamente.') }
    setEnviando(false)
  }

  const STEPS = ['Dados', 'Contrato', valorMatricula > 0 ? 'Pagamento' : 'Confirmação']
  const stepIdx = step === 'form' ? 0 : step === 'contrato' ? 1 : 2

  return (
    <div style={{ minHeight:'100vh', background:bg, color:textCol, fontFamily:INTER }}>

      {/* HEADER */}
      <div style={{ background:`${accent}18`, borderBottom:`1px solid ${accent}30`, padding:'20px 20px 16px' }}>
        <div style={{ maxWidth:520, margin:'0 auto', textAlign:'center' }}>
          {escolaLogoUrl ? (
            <img src={escolaLogoUrl} alt={escolaNome} style={{ width:56, height:56, objectFit:'contain', borderRadius:10, background:'white', padding:4, display:'block', margin:'0 auto 12px' }} />
          ) : (
            <div style={{ width:56, height:56, background:`${accent}20`, border:`1px solid ${accent}40`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 12px' }}>⚽</div>
          )}
          <h1 style={{ fontFamily:SYNE, fontWeight:900, fontSize:20, color:accent, margin:'0 0 4px', letterSpacing:-0.3 }}>{escolaNome}</h1>
          <p style={{ fontSize:13, color:mutedCol, margin:0 }}>Ficha de Pré-matrícula</p>
        </div>
      </div>

      {/* STEPS */}
      {step !== 'sucesso' && (
        <div style={{ maxWidth:520, margin:'0 auto', padding:'16px 20px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:0 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length-1 ? 1 : 'none' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background: i <= stepIdx ? accent : borderCol, border: `2px solid ${i <= stepIdx ? accent : borderCol}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:SYNE, fontWeight:800, fontSize:12, color: i <= stepIdx ? '#fff' : mutedCol, transition:'all 0.2s' }}>
                    {i < stepIdx ? '✓' : i+1}
                  </div>
                  <span style={{ fontSize:10, color: i <= stepIdx ? accent : mutedCol, fontWeight: i === stepIdx ? 700 : 400, whiteSpace:'nowrap' }}>{s}</span>
                </div>
                {i < STEPS.length-1 && <div style={{ flex:1, height:2, background: i < stepIdx ? accent : borderCol, margin:'0 8px', marginBottom:16, transition:'background 0.2s' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth:520, margin:'0 auto', padding:'16px 20px 40px' }}>

        {erro && (
          <div style={{ background:'rgba(255,68,68,0.1)', border:'1px solid rgba(255,68,68,0.3)', borderRadius:10, padding:'11px 14px', marginBottom:16 }}>
            <p style={{ color:'#FF4444', fontSize:13, margin:0 }}>❌ {erro}</p>
          </div>
        )}

        {/* STEP 1 — FORMULÁRIO */}
        {step === 'form' && (
          <>
            <div style={SEC}>
              <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:13, color:accent, margin:'0 0 16px', textTransform:'uppercase', letterSpacing:0.5 }}>👤 Dados do Atleta</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div><label style={LBL}>Nome completo *</label><input name="nomeAtleta" value={form.nomeAtleta} onChange={handleChange} placeholder="Nome completo do atleta" style={INP} /></div>
                <div><label style={LBL}>Data de nascimento *</label><input type="date" name="dataNascimento" value={form.dataNascimento} onChange={handleChange} style={INP} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div><label style={LBL}>CPF</label><input name="cpf" value={form.cpf} onChange={handleChange} placeholder="000.000.000-00" style={INP} /></div>
                  <div><label style={LBL}>RG</label><input name="rg" value={form.rg} onChange={handleChange} placeholder="0000000" style={INP} /></div>
                </div>
                <p style={{ fontSize:11, color:mutedCol, margin:'-8px 0 0', fontStyle:'italic' }}>⚠️ Pelo menos CPF ou RG é obrigatório</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div><label style={LBL}>Posição</label>
                    <select name="posicao" value={form.posicao} onChange={handleChange} style={INP}>
                      {POSICOES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div><label style={LBL}>Telefone</label><input name="telefone" value={form.telefone} onChange={handleChange} placeholder="(34) 99999-9999" style={INP} /></div>
                </div>
              </div>
            </div>

            <div style={SEC}>
              <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:13, color:accent, margin:'0 0 16px', textTransform:'uppercase', letterSpacing:0.5 }}>📍 Endereço</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div><label style={LBL}>CEP</label><input name="cep" value={form.cep} onChange={handleChange} onBlur={e => buscarCep(e.target.value)} placeholder="00000-000" style={INP} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:10 }}>
                  <div><label style={LBL}>Endereço</label><input name="endereco" value={form.endereco} onChange={handleChange} placeholder="Rua, Avenida..." style={INP} /></div>
                  <div><label style={LBL}>Nº</label><input name="numero" value={form.numero} onChange={handleChange} style={INP} /></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div><label style={LBL}>Bairro</label><input name="bairro" value={form.bairro} onChange={handleChange} style={INP} /></div>
                  <div><label style={LBL}>Cidade</label><input name="cidade" value={form.cidade} onChange={handleChange} style={INP} /></div>
                </div>
                <div style={{ width:80 }}><label style={LBL}>Estado</label><input name="estado" value={form.estado} onChange={handleChange} placeholder="MG" style={INP} /></div>
              </div>
            </div>

            <div style={SEC}>
              <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:13, color:accent, margin:'0 0 16px', textTransform:'uppercase', letterSpacing:0.5 }}>👨‍👩‍👦 Responsável</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div><label style={LBL}>Nome completo *</label><input name="nomeResponsavel" value={form.nomeResponsavel} onChange={handleChange} placeholder="Nome do responsável" style={INP} /></div>
                <div><label style={LBL}>WhatsApp *</label><input name="whatsappResponsavel" value={form.whatsappResponsavel} onChange={handleChange} type="tel" placeholder="(34) 99999-9999" style={INP} /></div>
                <div><label style={LBL}>E-mail</label><input name="emailResponsavel" value={form.emailResponsavel} onChange={handleChange} type="email" placeholder="email@exemplo.com" style={INP} /></div>
              </div>
            </div>

            <button onClick={avancarParaContrato} style={{ width:'100%', background:accent, color:'#fff', padding:'16px', borderRadius:12, fontFamily:SYNE, fontWeight:800, fontSize:15, border:'none', cursor:'pointer', textTransform:'uppercase', letterSpacing:0.5 }}>
              Continuar para o contrato →
            </button>
          </>
        )}

        {/* STEP 2 — CONTRATO */}
        {step === 'contrato' && (
          <>
            <div style={{ ...SEC, padding:0, overflow:'hidden' }}>
              <div style={{ background:`${accent}10`, padding:'14px 20px', borderBottom:`1px solid ${borderCol}` }}>
                <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:13, color:accent, margin:0, textTransform:'uppercase' }}>📄 Contrato de Prestação de Serviços</p>
              </div>
              <div ref={contratoRef} onScroll={e => { const el = e.currentTarget; if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) setContratoLido(true) }}
                style={{ height:280, overflowY:'auto', padding:'16px 20px', fontSize:12, lineHeight:1.7, color:mutedCol, whiteSpace:'pre-line' }}>
                {CONTRATO.replace(/ACADEMY/g, escolaNome)}
                <div style={{ height:20 }} />
              </div>
              {!contratoLido && (
                <div style={{ background:`${accent}08`, padding:'10px 16px', borderTop:`1px solid ${borderCol}` }}>
                  <p style={{ fontSize:11, color:mutedCol, margin:0, textAlign:'center' }}>⬇️ Role até o final para continuar</p>
                </div>
              )}
            </div>

            <div style={SEC}>
              <p style={{ fontFamily:SYNE, fontWeight:800, fontSize:13, color:accent, margin:'0 0 12px', textTransform:'uppercase' }}>✍️ Assinatura digital</p>
              <p style={{ fontSize:12, color:mutedCol, margin:'0 0 12px' }}>Ao digitar seu nome abaixo, você confirma que leu e concorda com os termos do contrato.</p>
              <div><label style={LBL}>Nome completo do responsável *</label>
                <input value={assinatura} onChange={e => setAssinatura(e.target.value)} placeholder="Digite seu nome completo" disabled={!contratoLido}
                  style={{ ...INP, opacity: contratoLido ? 1 : 0.5, fontStyle:'italic', fontSize:15 }} />
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setStep('form'); setErro('') }} style={{ flex:1, background:'transparent', border:`1px solid ${borderCol}`, color:mutedCol, padding:'14px', borderRadius:12, fontFamily:SYNE, fontWeight:700, fontSize:13, cursor:'pointer' }}>← Voltar</button>
              <button onClick={assinarEEnviar} disabled={enviando || !contratoLido || !assinatura.trim()}
                style={{ flex:2, background:enviando||!contratoLido||!assinatura.trim()?borderCol:accent, color:'#fff', padding:'14px', borderRadius:12, fontFamily:SYNE, fontWeight:800, fontSize:14, border:'none', cursor:enviando?'not-allowed':'pointer', textTransform:'uppercase', letterSpacing:0.5, opacity:!contratoLido||!assinatura.trim()?0.5:1 }}>
                {enviando ? 'Enviando...' : '✅ Assinar e enviar'}
              </button>
            </div>
          </>
        )}

        {/* STEP 3 — SUCESSO */}
        {step === 'sucesso' && (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ fontSize:64, marginBottom:20 }}>🎉</div>
            <h2 style={{ fontFamily:SYNE, fontWeight:900, fontSize:24, color:accent, marginBottom:12 }}>Pré-matrícula enviada!</h2>
            <p style={{ fontSize:14, color:mutedCol, lineHeight:1.7, maxWidth:360, margin:'0 auto 24px' }}>
              Recebemos sua ficha com sucesso. Em breve nossa equipe entrará em contato pelo WhatsApp para confirmar a matrícula.
            </p>
            <div style={{ background:`${accent}10`, border:`1px solid ${accent}25`, borderRadius:14, padding:'16px 20px', display:'inline-block' }}>
              <p style={{ fontSize:13, color:textCol, margin:0 }}>
                📲 Fique de olho no seu WhatsApp<br />
                <span style={{ color:mutedCol, fontSize:12 }}>{form.whatsappResponsavel}</span>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
