'use client'

interface Atleta {
  id: string
  nome: string
  dataNascimento: string | null
  foto: string | null
  posicao: string | null
  Turma: { nome: string } | null
}

interface Mensalidade {
  mes: string
  valor: number
  status: string
  vencimento: string
}

interface Avaliacao {
  data: string
  peso: number | null
  altura: number | null
  imc: number | null
  gordura: number | null
  observacoes: string | null
}

interface Convocacao {
  titulo: string
  data: string
  local: string | null
  tipo: string | null
}

interface Premiacao {
  titulo: string
  descricao: string | null
  icone: string
  dataConquista: string
}

interface Props {
  atleta: Atleta
  relacao: string
  frequencia: number | null
  totalAulas: number
  presentes: number
  mensalidades: Mensalidade[]
  avaliacoes: Avaliacao[]
  convocacoes: Convocacao[]
  premiacoes: Premiacao[]
}

const STATUS_LABEL: Record<string, { label: string; cor: string }> = {
  pago:     { label: 'Pago',     cor: 'text-green-400 bg-green-400/10' },
  pendente: { label: 'Pendente', cor: 'text-yellow-400 bg-yellow-400/10' },
  atrasado: { label: 'Atrasado', cor: 'text-red-400 bg-red-400/10' },
}

function calcularIdade(dataNascimento: string | null): string {
  if (!dataNascimento) return '--'
  const diff = Date.now() - new Date(dataNascimento).getTime()
  return String(Math.floor(diff / (1000 * 60 * 60 * 24 * 365))) + ' anos'
}

function formatarData(data: string): string {
  return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1A1A2E] rounded-2xl p-5 border border-white/5">
      <h2 className="text-white font-bold text-base mb-4">{titulo}</h2>
      {children}
    </div>
  )
}

export default function FichaAtletaClient({
  atleta, relacao, frequencia, totalAulas, presentes,
  mensalidades, avaliacoes, convocacoes, premiacoes,
}: Props) {
  return (
    <div className="min-h-screen bg-[#0F0F1A] p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="bg-[#1A1A2E] rounded-2xl p-6 border border-[#FF6B00]/20 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[#FF6B00]/20 flex items-center justify-center overflow-hidden shrink-0">
            {atleta.foto ? (
              <img src={atleta.foto} alt={atleta.nome} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">⚽</span>
            )}
          </div>
          <div>
            <p className="text-white font-bold text-xl">{atleta.nome}</p>
            <p className="text-gray-400 text-sm">{calcularIdade(atleta.dataNascimento)}</p>
            {atleta.Turma && <p className="text-[#FF6B00] text-sm font-medium mt-1">{atleta.Turma.nome}</p>}
            {atleta.posicao && <p className="text-gray-500 text-xs mt-1">{atleta.posicao}</p>}
          </div>
        </div>

        {/* Frequencia */}
        <Secao titulo="Frequência do Mês">
          {frequencia === null ? (
            <p className="text-gray-500 text-sm">Sem registros este mês.</p>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">{presentes} de {totalAulas} aulas</span>
                <span className={`text-lg font-bold ${frequencia >= 75 ? 'text-green-400' : frequencia >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {frequencia}%
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${frequencia >= 75 ? 'bg-green-400' : frequencia >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: frequencia + '%' }}
                />
              </div>
            </div>
          )}
        </Secao>

        {/* Mensalidades */}
        <Secao titulo="Mensalidades">
          {mensalidades.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma mensalidade encontrada.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {mensalidades.map((m, i) => {
                const s = STATUS_LABEL[m.status] ?? { label: m.status, cor: 'text-gray-400 bg-white/5' }
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">{m.mes}</p>
                      <p className="text-gray-500 text-xs">Venc. {formatarData(m.vencimento)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white text-sm">R$ {Number(m.valor).toFixed(2)}</span>
                      <span className={'text-xs px-2 py-1 rounded-full font-medium ' + s.cor}>{s.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Secao>

        {/* Avaliacoes */}
        <Secao titulo="Avaliações Físicas">
          {avaliacoes.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma avaliação registrada.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {avaliacoes.map((a, i) => (
                <div key={i} className="bg-[#0F0F1A] rounded-xl p-4 border border-white/5">
                  <p className="text-[#FF6B00] text-xs font-medium mb-3">{formatarData(a.data)}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {a.peso && <div><p className="text-gray-500 text-xs">Peso</p><p className="text-white text-sm font-medium">{a.peso} kg</p></div>}
                    {a.altura && <div><p className="text-gray-500 text-xs">Altura</p><p className="text-white text-sm font-medium">{a.altura} cm</p></div>}
                    {a.imc && <div><p className="text-gray-500 text-xs">IMC</p><p className="text-white text-sm font-medium">{a.imc}</p></div>}
                    {a.gordura && <div><p className="text-gray-500 text-xs">Gordura</p><p className="text-white text-sm font-medium">{a.gordura}%</p></div>}
                  </div>
                  {a.observacoes && <p className="text-gray-400 text-xs mt-3 italic">{a.observacoes}</p>}
                </div>
              ))}
            </div>
          )}
        </Secao>

        {/* Convocacoes */}
        <Secao titulo="Próximas Convocações">
          {convocacoes.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma convocação agendada.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {convocacoes.map((c, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-xl mt-0.5">📋</span>
                  <div>
                    <p className="text-white text-sm font-medium">{c.titulo}</p>
                    <p className="text-gray-400 text-xs">{formatarData(c.data)}{c.local ? ' · ' + c.local : ''}</p>
                    {c.tipo && <span className="text-xs text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-full mt-1 inline-block">{c.tipo}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Secao>

        {/* Premiacoes */}
        <Secao titulo="Premiações">
          {premiacoes.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma premiação registrada ainda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {premiacoes.map((p, i) => (
                <div key={i} className="bg-[#0F0F1A] rounded-xl p-4 border border-[#FFD700]/20 text-center">
                  <span className="text-3xl">{p.icone}</span>
                  <p className="text-white text-sm font-bold mt-2">{p.titulo}</p>
                  {p.descricao && <p className="text-gray-400 text-xs mt-1">{p.descricao}</p>}
                  <p className="text-[#FFD700] text-xs mt-2">{formatarData(p.dataConquista)}</p>
                </div>
              ))}
            </div>
          )}
        </Secao>

      </div>
    </div>
  )
}
