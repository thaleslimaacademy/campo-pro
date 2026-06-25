import { redirect } from 'next/navigation'
import { podeFinanceiro } from '@/lib/auth'

export default async function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  if (!(await podeFinanceiro())) redirect('/dashboard')
  return <>{children}</>
}
