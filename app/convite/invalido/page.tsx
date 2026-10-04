export default function ConviteInvalidoPage() {
  return (
    <div className="min-h-screen bg-[#F6F8F7] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center border border-red-500/30">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Convite inválido ou expirado</h1>
        <p className="text-gray-500 text-sm">
          Solicite um novo convite ao responsável da academia.
        </p>
      </div>
    </div>
  )
}
