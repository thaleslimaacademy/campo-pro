export default function Financeiro() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <h1 className="text-xl font-bold mb-6">💰 Financeiro</h1>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">Receita do Mês</p>
          <p className="text-2xl font-bold text-green-400">R$ 0</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm">Inadimplentes</p>
          <p className="text-2xl font-bold text-red-400">0</p>
        </div>
      </div>
      <div className="text-center text-gray-500 mt-10">
        <p className="text-5xl mb-4">💳</p>
        <p className="text-lg">Nenhuma cobrança gerada</p>
        <p className="text-sm mt-2">Cadastre atletas para gerar mensalidades</p>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br/>Início</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br/>Atletas</a>
        <a href="/presenca" className="text-gray-400 text-xs text-center">✅<br/>Presença</a>
        <a href="/financeiro" className="text-green-500 text-xs text-center">💰<br/>Financeiro</a>
      </nav>
    </div>
  )
}