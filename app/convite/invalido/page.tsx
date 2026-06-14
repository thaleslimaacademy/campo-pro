export default function ConviteInvalidoPage() {
  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#1A1A2E] rounded-2xl p-8 text-center border border-red-500/30">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-white mb-2">Convite inválido ou expirado</h1>
        <p className="text-gray-400 text-sm">
          Solicite um novo convite ao responsável da academia.
        </p>
      </div>
    </div>
  )
}
