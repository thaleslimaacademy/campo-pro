'use client'

interface Turma {
  nome: string
}

interface Atleta {
  id: string
  nome: string
  dataNascimento: string | null
  foto: string | null
  turmaId: string | null
  Turma: Turma | null
}

interface Vinculo {
  atletaId: string
  relacao: string
  principal: boolean
  Atleta: Atleta
}

const RELACAO_LABEL: Record<string, string> = {
  pai: 'Pai',
  mae: 'Mae',
  avo: 'Avo/Avo',
  responsavel_legal: 'Responsavel Legal',
  outro: 'Responsavel',
}

function calcularIdade(dataNascimento: string | null): string {
  if (!dataNascimento) return '--'
  const diff = Date.now() - new Date(dataNascimento).getTime()
  return String(Math.floor(diff / (1000 * 60 * 60 * 24 * 365))) + ' anos'
}

export default function PaisDashboardClient({ atletas }: { atletas: Vinculo[] }) {
  return (
    <div className="min-h-screen bg-[#0F0F1A] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Meus Atletas</h1>
          <p className="text-gray-400 text-sm mt-1">Acompanhe o desenvolvimento dos seus filhos</p>
        </div>
        <div className="flex flex-col gap-4">
          {atletas.map((vinculo) => (
            <div
              key={vinculo.atletaId}
              className="bg-[#1A1A2E] rounded-2xl p-5 border border-white/5 flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-[#FF6B00]/20 flex items-center justify-center overflow-hidden shrink-0">
                {vinculo.Atleta.foto ? (
                  <img src={vinculo.Atleta.foto} alt={vinculo.Atleta.nome} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">⚽</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-lg truncate">{vinculo.Atleta.nome}</p>
                <p className="text-gray-400 text-sm">{calcularIdade(vinculo.Atleta.dataNascimento)}</p>
                {vinculo.Atleta.Turma && (
                  <p className="text-[#FF6B00] text-sm font-medium mt-1">{vinculo.Atleta.Turma.nome}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                  {RELACAO_LABEL[vinculo.relacao] ?? vinculo.relacao}
                </span>
                
                <a
                  href={'/pais/atleta/' + vinculo.atletaId}
                  className="text-xs text-[#FF6B00] font-medium hover:underline"
                >
                  Ver ficha →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
