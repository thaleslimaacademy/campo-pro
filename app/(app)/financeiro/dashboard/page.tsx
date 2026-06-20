import { getDashboardFinanceiro } from './actions'
import DashboardFinanceiroClient from './DashboardFinanceiroClient'

export default async function DashboardFinanceiroPage() {
  const data = await getDashboardFinanceiro()
  return <DashboardFinanceiroClient data={data} />
}
