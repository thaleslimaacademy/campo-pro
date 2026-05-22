export default function AreaPais({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="text-center mb-8">
        <p className="text-4xl mb-2">⚽</p>
        <h1 className="text-xl font-bold text-green-500">Campo Pro</h1>
        <p className="text-gray-400 text-sm">Área do Responsável</p>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-1">Atleta</p>
        <p className="text-lg font-bold">Carregando...</p>
        <p className="text-green-500 text-sm">Sub-11</p>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-3">Presença este mês</p>
        <div className="flex gap-2 flex-wrap">
          {Array.from({length: 12}).map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-xs">
              {i+1}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <p className="text-gray-400 text-sm mb-1">Mensalidade</p>
        <p className="text-2xl font-bold text-green-400">R$ 150,00</p>
        <p className="text-gray-400 text-sm">Vencimento: 10/06/2026</p>
        <button className="w-full bg-green-600 text-white py-3 rounded-lg font-bold mt-3">
          📋 Copiar Pix
        </button>
      </div>
    </div>
  )
}