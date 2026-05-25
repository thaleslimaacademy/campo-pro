'use client'

type Dado = {
  mes: string
  presentes: number
  total: number
  percentual: number
}

export default function GraficoPresenca({ dados }: { dados: Dado[] }) {
  const maxTotal = Math.max(...dados.map(d => d.total), 1)

  return (
    <div className="space-y-3">
      {dados.map(d => (
        <div key={d.mes}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400 w-14">{d.mes}</span>
            <div className="flex-1 mx-2 relative">
              {/* Barra total */}
              <div className="w-full bg-gray-700 rounded-full h-5">
                {/* Barra presentes */}
                <div
                  className={`h-5 rounded-full transition-all ${
                    d.percentual >= 75 ? 'bg-green-500' :
                    d.percentual >= 50 ? 'bg-yellow-500' :
                    d.total === 0 ? 'bg-gray-600' : 'bg-red-500'
                  }`}
                  style={{ width: d.total === 0 ? '0%' : `${(d.presentes / maxTotal) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right w-16">
              {d.total === 0 ? (
                <span className="text-xs text-gray-500">—</span>
              ) : (
                <span className={`text-xs font-bold ${
                  d.percentual >= 75 ? 'text-green-400' :
                  d.percentual >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {d.percentual}%
                </span>
              )}
            </div>
          </div>
          {d.total > 0 && (
            <p className="text-xs text-gray-500 pl-16">{d.presentes} de {d.total} treinos</p>
          )}
        </div>
      ))}
    </div>
  )
}