'use client'

import { useState } from 'react'

export default function LinkMatricula() {
  const [copiado, setCopiado] = useState(false)
  const link = 'https://campo-pro.vercel.app/matricula'

  function copiar() {
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function enviarWhatsApp(whatsapp: string) {
    const numero = whatsapp.replace(/\D/g, '')
    const numeroFormatado = numero.startsWith('55') ? numero : `55${numero}`
    const mensagem = encodeURIComponent(
      `Olá! 👋\n\nAcesse o link abaixo para fazer a pré-matrícula do seu filho(a) na *Thales Lima Football Academy*:\n\n${link}\n\n_Preencha a ficha e assine o contrato digital. Nossa equipe analisará e confirmará a matrícula em breve!_ ⚽`
    )
    window.open(`https://wa.me/${numeroFormatado}?text=${mensagem}`, '_blank')
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
      <p className="text-gray-400 text-sm mb-3">📲 Link de Pré-matrícula</p>
      <p className="text-xs text-gray-500 break-all mb-3">{link}</p>
      <div className="flex gap-2">
        <button onClick={copiar} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-medium transition">
          {copiado ? '✅ Copiado!' : '📋 Copiar Link'}
        </button>
        <button
          onClick={() => {
            const whatsapp = prompt('Digite o WhatsApp do responsável:')
            if (whatsapp) enviarWhatsApp(whatsapp)
          }}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition"
        >
          📲 Enviar WhatsApp
        </button>
      </div>
    </div>
  )
}