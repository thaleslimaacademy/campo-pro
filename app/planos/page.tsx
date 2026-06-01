'use client'

import { useState } from 'react'

const planos = [
  {
    id: 'basico',
    nome: 'Básico',
    cor: 'border-gray-600',
    corBtn: 'bg-gray-700 hover:bg-gray-600',
    corBadge: 'bg-gray-700',
    precoMensal: 49,
    precoAnual: 39,
    atletasMax: 30,
    turmasMax: 2,
    usuarios: 1,
    recursos: [
      { nome: 'Até 30 atletas', ok: true },
      { nome: '2 turmas', ok: true },
      { nome: 'Financeiro e Pix', ok: true },
      { nome: 'Presença', ok: true },
      { nome: 'Matrículas online', ok: true },
      { nome: 'Área dos pais', ok: true },
      { nome: 'Relatórios PDF', ok: false },
      { nome: 'Avaliação física', ok: false },
      { nome: 'Campeonatos', ok: false },
      { nome: 'Convocações', ok: false },
      { nome: 'WhatsApp automático', ok: false },
      { nome: '1 usuário', ok: true },
      { nome: 'Suporte por email', ok: true },
    ]
  },
  {
    id: 'pro',
    nome: 'Pro',
    cor: 'border-green-500',
    corBtn: 'bg-green-600 hover:bg-green-500',
    corBadge: 'bg-green-600',
    popular: true,
    precoMensal: 99,
    precoAnual: 79,
    atletasMax: 100,
    turmasMax: 5,
    usuarios: 3,
    recursos: [
      { nome: 'Até 100 atletas', ok: true },
      { nome: '5 turmas', ok: true },
      { nome: 'Financeiro e Pix', ok: true },
      { nome: 'Presença', ok: true },
      { nome: 'Matrículas online', ok: true },
      { nome: 'Área dos pais', ok: true },
      { nome: 'Relatórios PDF', ok: true },
      { nome: 'Avaliação física', ok: true },
      { nome: 'Campeonatos', ok: true },
      { nome: 'Convocações', ok: true },
      { nome: 'WhatsApp automático', ok: false },
      { nome: '3 usuários', ok: true },
      { nome: 'Suporte WhatsApp', ok: true },
    ]
  },
  {
    id: 'elite',
    nome: 'Elite',
    cor: 'border-yellow-500',
    corBtn: 'bg-yellow-600 hover:bg-yellow-500',
    corBadge: 'bg-yellow-600',
    precoMensal: 197,
    precoAnual: 157,
    atletasMax: 999,
    turmasMax: 999,
    usuarios: 999,
    recursos: [
      { nome: 'Atletas ilimitados', ok: true },
      { nome: 'Turmas ilimitadas', ok: true },
      { nome: 'Financeiro e Pix', ok: true },
      { nome: 'Presença', ok: true },
      { nome: 'Matrículas online', ok: true },
      { nome: 'Área dos pais', ok: true },
      { nome: 'Relatórios PDF', ok: true },
      { nome: 'Avaliação física', ok: true },
      { nome: 'Campeonatos', ok: true },
      { nome: 'Convocações', ok: true },
      { nome: 'WhatsApp automático', ok: true },
      { nome: 'Usuários ilimitados', ok: true },
      { nome: 'Suporte prioritário', ok: true },
    ]
  }
]

export default function Planos() {
  const [periodo, setPeriodo] = useState<'mensal' | 'anual'>('mensal')

  function assinar(planoId: string) {
    const numero = '5534998168467'
    const preco = planos.find(p => p.id === planoId)
    const valor = periodo === 'mensal' ? preco?.precoMensal : preco?.precoAnual
    const msg = encodeURIComponent(
      'Ola! Quero assinar o plano ' + preco?.nome + ' do GestaoFC.\n\n' +
      'Plano: ' + preco?.nome + '\n' +
      'Periodo: ' + (periodo === 'mensal' ? 'Mensal' : 'Anual') + '\n' +
      'Valor: R$ ' + valor + (periodo === 'mensal' ? '/mes' : '/mes (cobrado anualmente)') + '\n\n' +
      'Aguardo as instrucoes de pagamento!'
    )
    window.open('https://wa.me/' + numero + '?text=' + msg, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="bg-green-700 py-12 px-6 text-center">
        <p className="text-4xl mb-3">⚽</p>
        <h1 className="text-3xl font-bold mb-2">GestaoFC</h1>
        <p className="text-green-200 text-lg">Gerencie sua escolinha de futebol com profissionalismo</p>
      </div>

      <div className="p-6">
        <div className="flex justify-center mb-8">
          <div className="bg-gray-900 rounded-xl p-1 flex gap-1">
            <button
              onClick={() => setPeriodo('mensal')}
              className={"px-6 py-2 rounded-lg text-sm font-bold transition " + (periodo === 'mensal' ? 'bg-green-600 text-white' : 'text-gray-400')}
            >
              Mensal
            </button>
            <button
              onClick={() => setPeriodo('anual')}
              className={"px-6 py-2 rounded-lg text-sm font-bold transition " + (periodo === 'anual' ? 'bg-green-600 text-white' : 'text-gray-400')}
            >
              Anual <span className="text-green-400 text-xs ml-1">-20%</span>
            </button>
          </div>
        </div>

        <div className="space-y-4 max-w-sm mx-auto">
          {planos.map(p => (
            <div key={p.id} className={"bg-gray-900 rounded-2xl p-5 border-2 relative " + p.cor}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-600 text-white text-xs font-bold px-4 py-1 rounded-full">MAIS POPULAR</span>
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{p.nome}</h2>
                  <p className="text-gray-400 text-sm">
                    {p.atletasMax >= 999 ? 'Atletas ilimitados' : 'Ate ' + p.atletasMax + ' atletas'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-400">
                    R$ {periodo === 'mensal' ? p.precoMensal : p.precoAnual}
                  </p>
                  <p className="text-gray-400 text-xs">/mes</p>
                  {periodo === 'anual' && (
                    <p className="text-green-400 text-xs">R$ {p.precoAnual * 12}/ano</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-5">
                {p.recursos.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={r.ok ? 'text-green-400' : 'text-gray-600'}>{r.ok ? '✓' : '✗'}</span>
                    <span className={"text-sm " + (r.ok ? 'text-gray-300' : 'text-gray-600')}>{r.nome}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => assinar(p.id)}
                className={"w-full py-3 rounded-xl font-bold text-white transition " + p.corBtn}
              >
                Assinar via WhatsApp
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gray-900 rounded-xl p-4 border border-gray-800 max-w-sm mx-auto">
          <p className="text-green-500 font-bold text-sm mb-2">Pagamento seguro</p>
          <div className="space-y-1">
            <p className="text-gray-400 text-xs">✅ Pix ou cartao de credito</p>
            <p className="text-gray-400 text-xs">✅ Cancele quando quiser</p>
            <p className="text-gray-400 text-xs">✅ Suporte em portugues</p>
            <p className="text-gray-400 text-xs">✅ Dados seguros e criptografados</p>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6 mb-4">
          Duvidas? Fale conosco pelo WhatsApp
        </p>
        <div className="flex justify-center mb-8">
          <a
            href="https://wa.me/5534998168467"
            target="_blank"
            rel="noreferrer"
            className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold"
          >
            Falar com suporte
          </a>
        </div>
      </div>
    </div>
  )
}
