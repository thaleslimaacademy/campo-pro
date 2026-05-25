'use client'

import { useEffect, useRef } from 'react'

export default function QRCodeMatricula() {
  const url = 'https://campo-pro.vercel.app/matricula'
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
    script.onload = () => {
      if (qrRef.current) {
        qrRef.current.innerHTML = ''
        new (window as any).QRCode(qrRef.current, {
          text: url,
          width: 256,
          height: 256,
          colorDark: '#000000',
          colorLight: '#ffffff',
        })
      }
    }
    document.body.appendChild(script)
  }, [])

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8">

      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <p className="text-4xl mb-3">⚽</p>
        <h1 className="text-2xl font-bold text-green-700">Thales Lima Football Academy</h1>
        <p className="text-gray-500 text-sm mt-1">Associação Esportiva — Iturama/MG</p>
      </div>

      {/* Card imprimível */}
      <div className="border-4 border-green-600 rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
        <p className="text-lg font-bold text-gray-800 mb-2">📋 Faça sua Pré-matrícula</p>
        <p className="text-gray-500 text-sm mb-6">
          Escaneie o QR Code com o celular para preencher a ficha e assinar o contrato
        </p>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div ref={qrRef} className="rounded-xl overflow-hidden border border-gray-200 p-2" />
        </div>

        {/* URL */}
        <div className="bg-gray-100 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-500 mb-1">ou acesse pelo navegador:</p>
          <p className="text-green-700 font-bold text-sm break-all">{url}</p>
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-1">
          <p className="text-xs text-gray-400">✅ Ficha completa online</p>
          <p className="text-xs text-gray-400">✅ Contrato com assinatura digital</p>
          <p className="text-xs text-gray-400">✅ Confirmação via WhatsApp</p>
        </div>
      </div>

      {/* Botão imprimir */}
      <button
        onClick={() => window.print()}
        className="mt-8 bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg print:hidden"
      >
        🖨️ Imprimir QR Code
      </button>

      <p className="text-gray-400 text-xs mt-4 print:hidden">
        Acesse esta página em: <span className="text-green-600">campo-pro.vercel.app/qrcode</span>
      </p>

      {/* Estilos de impressão */}
      <style>{`
        @media print {
          body { background: white; }
          button { display: none; }
        }
      `}</style>
    </div>
  )
}