'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// User Config Actions
export async function updateUserConfig(config: {
  frequency: string
  startDate: string
  dayOfWeek?: number
  semiMonthlyDays?: number[]
  adjustToNearestWeekday?: boolean
  defaultAmount: number
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('user_configs')
    .upsert(
      {
        user_id: user.id,
        frequency: config.frequency,
        start_date: config.startDate,
        day_of_week: config.dayOfWeek,
        semi_monthly_days: config.semiMonthlyDays,
        adjust_to_nearest_weekday: config.adjustToNearestWeekday,
        default_amount: config.defaultAmount,
      },
      {
        onConflict: 'user_id',
      }
    )

  if (error) throw error

  revalidatePath('/dashboard')
}

// Bill Actions
export async function addBill(billSet: 1 | 2, name: string, amount: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('bills').insert({
    user_id: user.id,
    name,
    amount,
    bill_set: billSet,
  })

  if (error) throw error

  revalidatePath('/dashboard')
}

export async function removeBill(billId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('bills').delete().eq('id', billId)

  if (error) throw error

  revalidatePath('/dashboard')
}

export async function updateBillAmount(
  billName: string,
  paycheckDate: string,
  amount: number
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Upsert: Insert if doesn't exist, update if exists
  const { error } = await supabase.from('bill_overrides').upsert(
    {
      user_id: user.id,
      bill_name: billName,
      paycheck_date: paycheckDate,
      amount: amount,
    },
    {
      onConflict: 'user_id,bill_name,paycheck_date',
    }
  )

  if (error) throw error

  revalidatePath('/dashboard')
}

// Expense Actions
export async function addExpense(
  paycheckDate: string,
  name: string,
  amount: number
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('expenses').insert({
    user_id: user.id,
    name,
    amount,
    paycheck_date: paycheckDate,
  })

  if (error) throw error

  revalidatePath('/dashboard')
}

export async function updateExpense(
  expenseId: string,
  name: string,
  amount: number
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('expenses')
    .update({ name, amount })
    .eq('id', expenseId)

  if (error) throw error

  revalidatePath('/dashboard')
}

export async function removeExpense(expenseId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('expenses').delete().eq('id', expenseId)

  if (error) throw error

  revalidatePath('/dashboard')
}

// Recurring Expense Actions
export async function addRecurringExpense(name: string, amount: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('recurring_expenses').insert({
    user_id: user.id,
    name,
    amount,
  })

  if (error) throw error

  revalidatePath('/dashboard')
}

export async function updateRecurringExpense(
  expenseId: string,
  name: string,
  amount: number
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('recurring_expenses')
    .update({ name, amount })
    .eq('id', expenseId)

  if (error) throw error

  revalidatePath('/dashboard')
}

export async function removeRecurringExpense(expenseId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('recurring_expenses')
    .delete()
    .eq('id', expenseId)

  if (error) throw error

  revalidatePath('/dashboard')
}
