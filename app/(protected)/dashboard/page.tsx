import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user config
  const { data: configData } = await supabase
    .from('user_configs')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch bills
  const { data: billsData } = await supabase
    .from('bills')
    .select('*')
    .eq('user_id', user.id)
    .order('bill_set', { ascending: true })

  // Fetch expenses
  const { data: expensesData } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('paycheck_date', { ascending: true })

  // Fetch recurring expenses
  const { data: recurringExpensesData } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Fetch bill overrides
  const { data: billOverridesData } = await supabase
    .from('bill_overrides')
    .select('*')
    .eq('user_id', user.id)

  return (
    <DashboardClient
      initialConfig={configData}
      initialBills={billsData || []}
      initialExpenses={expensesData || []}
      initialRecurringExpenses={recurringExpensesData || []}
      initialBillOverrides={billOverridesData || []}
    />
  )
}
