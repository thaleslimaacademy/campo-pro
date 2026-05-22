export default function Presenca() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <h1 className="text-xl font-bold mb-2">✅ Presença</h1>
      <p className="text-gray-400 text-sm mb-6">Hoje — {new Date().toLocaleDateString('pt-BR')}</p>
      <div className="text-center text-gray-500 mt-20">
        <p className="text-5xl mb-4">📋</p>
        <p className="text-lg">Nenhum atleta ativo</p>
        <p className="text-sm mt-2">Cadastre atletas para fazer a chamada</p>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around p-4">
        <a href="/dashboard" className="text-gray-400 text-xs text-center">🏠<br/>Início</a>
        <a href="/atletas" className="text-gray-400 text-xs text-center">👥<br/>Atletas</a>
        <a href="/presenca" className="text-green-500 text-xs text-center">✅<br/>Presença</a>
        <a href="/financeiro" className="text-gray-400 text-xs text-center">💰<br/>Financeiro</a>
      </nav>
    </div>
  )
}