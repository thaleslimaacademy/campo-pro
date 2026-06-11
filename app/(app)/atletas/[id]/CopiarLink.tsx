'use client'

import { useState } from 'react'

export default function CopiarLink({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button onClick={copiar} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">
      {copiado ? '✅ Link copiado!' : '📋 Copiar Link dos Pais'}
    </button>
  )
}