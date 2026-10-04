'use client'

import { useRouter } from 'next/navigation'

interface Props {
  token: string
  invalido: boolean
  status: string
  expirado: boolean
  atletaNome: string
  relacao: string
}

const RELACAO_LABEL: Record<string, string> = {
  pai: 'Pai',
  mae: 'Mãe',
  avo: 'Avó/Avô',
  responsavel_legal: 'Responsável Legal',
  outro: 'Responsável',
}

export default function ConviteClient({
  token,
  invalido,
  status,
  expirado,
  atletaNome,
  relacao,
}: Props) {
  const router = useRouter()

  if (invalido) {
    return (
      <div className="min-h-screen bg-[#F6F8F7] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center border border-red-500/30">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {expirado ? 'Convite expirado' : 'Convite inválido'}
          </h1>
          <p className="text-gray-500 text-sm">
            {expirado
              ? 'Este link expirou. Solicite um novo convite ao responsável da academia.'
              : status === 'aceito'
              ? 'Este convite já foi utilizado.'
              : 'Este link não é mais válido.'}
          </p>
        </div>
      </div>
    )
  }

  const handleAceitar = () => {
    const redirectUrl = encodeURIComponent(`/convite/${token}/aceitar`)
    router.push(`/sign-up?redirect_url=${redirectUrl}`)
  }

  const handleJaTenhoConta = () => {
    const redirectUrl = encodeURIComponent(`/convite/${token}/aceitar`)
    router.push(`/sign-in?redirect_url=${redirectUrl}`)
  }

  return (
    <div className="min-h-screen bg-[#F6F8F7] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-[#FF6B00]/30">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚽</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">GestãoFC</h1>
          <p className="text-gray-500 text-sm">Área dos Responsáveis</p>
        </div>

        <div className="bg-[#F6F8F7] rounded-xl p-5 mb-6 border border-gray-200">
          <p className="text-gray-500 text-sm mb-1">Você foi convidado como</p>
          <p className="text-[#FF6B00] font-bold text-lg">{RELACAO_LABEL[relacao] ?? 'Responsável'}</p>
          <p className="text-gray-500 text-sm mt-3 mb-1">Atleta</p>
          <p className="text-gray-900 font-semibold text-lg">{atletaNome}</p>
        </div>

        <p className="text-gray-500 text-sm text-center mb-6">
          Crie sua conta ou entre para acompanhar o desenvolvimento do atleta.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleAceitar}
            className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-gray-900 font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Criar conta
          </button>
          <button
            onClick={handleJaTenhoConta}
            className="w-full bg-transparent border border-gray-200 hover:border-white/40 text-gray-900 font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Já tenho conta — Entrar
          </button>
        </div>
      </div>
    </div>
  )
}
