import { redirect } from 'next/navigation'

// Painel financeiro virou parte da Gestao Financeira (tudo num lugar so).
export default function DashboardFinanceiro() { redirect('/financeiro/gestao') }
