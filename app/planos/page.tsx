"use client";

import { useState } from "react";
import Link from "next/link";

const plans = [
  {
    id: "basico",
    name: "Básico",
    color: "border-gray-600",
    badge: null,
    monthly: 79,
    annual: 65,
    description: "Ideal para academias em fase inicial",
    limits: "Até 50 atletas",
    features: [
      { label: "Até 50 atletas", ok: true },
      { label: "1 usuário", ok: true },
      { label: "Até 3 turmas", ok: true },
      { label: "Só futebol", ok: true },
      { label: "WhatsApp automático", ok: false },
      { label: "Relatórios PDF", ok: false },
      { label: "Avaliação física", ok: false },
      { label: "Campeonatos", ok: false },
      { label: "App dos pais", ok: false },
      { label: "IA + automações", ok: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    color: "border-orange-500",
    badge: "MAIS POPULAR",
    monthly: 129,
    annual: 107,
    description: "Para academias em crescimento",
    limits: "Até 150 atletas",
    features: [
      { label: "Até 150 atletas", ok: true },
      { label: "3 usuários", ok: true },
      { label: "Até 10 turmas", ok: true },
      { label: "Até 3 modalidades", ok: true },
      { label: "WhatsApp automático", ok: true },
      { label: "Relatórios PDF", ok: true },
      { label: "Avaliação física", ok: true },
      { label: "Campeonatos", ok: true },
      { label: "App dos pais", ok: false },
      { label: "IA + automações", ok: false },
    ],
  },
  {
    id: "elite",
    name: "Elite",
    color: "border-yellow-400",
    badge: "COMPLETO",
    monthly: 199,
    annual: 165,
    description: "Para clubes e academias consolidadas",
    limits: "Atletas ilimitados",
    features: [
      { label: "Atletas ilimitados", ok: true },
      { label: "Usuários ilimitados", ok: true },
      { label: "Turmas ilimitadas", ok: true },
      { label: "Modalidades ilimitadas", ok: true },
      { label: "WhatsApp automático", ok: true },
      { label: "Relatórios PDF", ok: true },
      { label: "Avaliação física", ok: true },
      { label: "Campeonatos", ok: true },
      { label: "App dos pais", ok: true },
      { label: "IA + automações", ok: true },
    ],
  },
];

export default function PlanosPage() {
  const [anual, setAnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white font-[Inter,sans-serif]">

      {/* Header */}
      <div className="pt-16 pb-10 text-center px-4">
        <div className="inline-block bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
          Planos e Preços
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-[Syne,sans-serif] mb-4">
          Escolha o plano{" "}
          <span className="text-[#FF6B00]">certo para sua academia</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Tudo que você precisa para gerenciar, crescer e profissionalizar sua academia de futebol.
        </p>

        {/* Toggle mensal/anual */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={`text-sm font-medium ${!anual ? "text-white" : "text-gray-500"}`}>Mensal</span>
          <button
            onClick={() => setAnual(!anual)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${anual ? "bg-[#FF6B00]" : "bg-gray-700"}`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${anual ? "translate-x-7" : "translate-x-0"}`}
            />
          </button>
          <span className={`text-sm font-medium ${anual ? "text-white" : "text-gray-500"}`}>
            Anual{" "}
            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full ml-1">-18%</span>
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 ${plan.color} bg-[#1A1A2E] p-6 flex flex-col transition-transform hover:-translate-y-1 duration-200 ${plan.id === "pro" ? "shadow-[0_0_40px_rgba(255,107,0,0.15)]" : ""}`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full ${plan.id === "pro" ? "bg-[#FF6B00] text-white" : "bg-[#FFD700] text-[#0F0F1A]"}`}>
                  {plan.badge}
                </div>
              )}

              {/* Nome + desc */}
              <div className="mb-6">
                <h2 className={`text-2xl font-bold font-[Syne,sans-serif] mb-1 ${plan.id === "elite" ? "text-[#FFD700]" : plan.id === "pro" ? "text-[#FF6B00]" : "text-white"}`}>
                  {plan.name}
                </h2>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              {/* Preço */}
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-gray-400 text-sm self-start mt-1">R$</span>
                  <span className="text-5xl font-bold font-[Syne,sans-serif] leading-none">
                    {anual ? plan.annual : plan.monthly}
                  </span>
                  <span className="text-gray-400 text-sm self-end mb-1">/mês</span>
                </div>
                {anual && (
                  <p className="text-gray-500 text-xs mt-1">
                    Cobrado anualmente — R$ {plan.annual * 12}/ano
                  </p>
                )}
              </div>

              {/* CTA */}
              <Link
                href={`/cadastro?plano=${plan.id}${anual ? "&periodo=anual" : ""}`}
                className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all duration-200 mb-6 ${
                  plan.id === "pro"
                    ? "bg-[#FF6B00] text-white hover:bg-orange-600"
                    : plan.id === "elite"
                    ? "bg-[#FFD700] text-[#0F0F1A] hover:bg-yellow-300"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                }`}
              >
                Começar agora
              </Link>

              {/* Limite destaque */}
              <p className="text-xs text-center text-gray-500 mb-4 -mt-3">{plan.limits}</p>

              {/* Divisor */}
              <div className="border-t border-white/10 mb-4"></div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    {f.ok ? (
                      <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-green-400" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-red-400" viewBox="0 0 12 12" fill="none">
                          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </span>
                    )}
                    <span className={`text-sm ${f.ok ? "text-gray-200" : "text-gray-600"}`}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trial note */}
        <p className="text-center text-gray-500 text-sm mt-10">
          Sem fidelidade no plano mensal · Cancele quando quiser ·{" "}
          <Link href="/contato" className="text-orange-400 hover:underline">Falar com vendas</Link>
        </p>
      </div>
    </div>
  );
}