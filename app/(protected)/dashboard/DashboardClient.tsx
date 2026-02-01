'use client'

import { useState, useTransition } from 'react'
import { format, addMonths } from 'date-fns'
import {
  generatePaychecks,
  PayScheduleConfig,
  PayFrequency,
} from '@/lib/paycheckGenerator'
import { Bill, Expense, RecurringExpense, PaycheckSummary } from '@/types'
import PaycheckCard from '@/components/PaycheckCard'
import RecurringExpenseForm from '@/components/RecurringExpenseForm'
import BillForm from '@/components/BillForm'
import {
  addBill,
  removeBill,
  updateBillAmount as updateBillAmountAction,
  addExpense as addExpenseAction,
  updateExpense as updateExpenseAction,
  removeExpense as removeExpenseAction,
  addRecurringExpense as addRecurringExpenseAction,
  updateRecurringExpense as updateRecurringExpenseAction,
  removeRecurringExpense as removeRecurringExpenseAction,
  updateUserConfig,
} from './actions'

interface DashboardClientProps {
  initialConfig: any
  initialBills: any[]
  initialExpenses: any[]
  initialRecurringExpenses: any[]
  initialBillOverrides: any[]
}

export default function DashboardClient({
  initialConfig,
  initialBills,
  initialExpenses,
  initialRecurringExpenses,
  initialBillOverrides,
}: DashboardClientProps) {
  const [isPending, startTransition] = useTransition()

  // Initialize config with defaults if not set
  const defaultConfig: PayScheduleConfig = {
    frequency: (initialConfig?.frequency as PayFrequency) || 'semi-monthly',
    startDate: initialConfig?.start_date
      ? new Date(initialConfig.start_date)
      : new Date(),
    dayOfWeek: initialConfig?.day_of_week,
    semiMonthlyDays: initialConfig?.semi_monthly_days || [15, 0],
    adjustToNearestWeekday: initialConfig?.adjust_to_nearest_weekday ?? true,
    defaultAmount: initialConfig?.default_amount || 2000,
  }

  const [payScheduleConfig, setPayScheduleConfig] =
    useState<PayScheduleConfig>(defaultConfig)
  const [startDate, setStartDate] = useState(defaultConfig.startDate)
  const [endDate, setEndDate] = useState(addMonths(new Date(), 3))

  // Convert database bills to app format
  const billSet1: Bill[] = initialBills
    .filter((b) => b.bill_set === 1)
    .map((b) => ({ name: b.name, amount: b.amount, billSet: 1 }))

  const billSet2: Bill[] = initialBills
    .filter((b) => b.bill_set === 2)
    .map((b) => ({ name: b.name, amount: b.amount, billSet: 2 }))

  // Convert database expenses to app format
  const expenses: Expense[] = initialExpenses.map((e) => ({
    id: e.id,
    name: e.name,
    amount: e.amount,
    paycheckDate: e.paycheck_date,
  }))

  // Convert database recurring expenses to app format
  const recurringExpenses: RecurringExpense[] = initialRecurringExpenses.map(
    (e) => ({
      id: e.id,
      name: e.name,
      amount: e.amount,
    })
  )

  // Build bill overrides map
  const billOverrides: Record<string, number> = {}
  initialBillOverrides.forEach((override) => {
    const key = `${override.paycheck_date}_${override.bill_name}`
    billOverrides[key] = override.amount
  })

  // Sync payScheduleConfig.startDate with startDate
  const configWithStartDate = { ...payScheduleConfig, startDate }

  // Generate paychecks based on configuration
  const paychecks = generatePaychecks(startDate, endDate, configWithStartDate)

  const getBillAmountKey = (paycheckDate: Date, billName: string) => {
    return `${paycheckDate.toISOString().split('T')[0]}_${billName}`
  }

  const getBillAmount = (paycheckDate: Date, bill: Bill): number => {
    const key = getBillAmountKey(paycheckDate, bill.name)
    return billOverrides[key] ?? bill.amount
  }

  const handleUpdateBillAmount = (
    paycheckDate: Date,
    billName: string,
    amount: number
  ) => {
    startTransition(async () => {
      await updateBillAmountAction(
        billName,
        paycheckDate.toISOString().split('T')[0],
        amount
      )
    })
  }

  const handleAddExpense = (
    paycheckDate: Date,
    name: string,
    amount: number
  ) => {
    startTransition(async () => {
      await addExpenseAction(paycheckDate.toISOString().split('T')[0], name, amount)
    })
  }

  const handleRemoveExpense = (expenseId: string) => {
    startTransition(async () => {
      await removeExpenseAction(expenseId)
    })
  }

  const handleUpdateExpense = (
    expenseId: string,
    name: string,
    amount: number
  ) => {
    startTransition(async () => {
      await updateExpenseAction(expenseId, name, amount)
    })
  }

  const handleAddRecurringExpense = (name: string, amount: number) => {
    startTransition(async () => {
      await addRecurringExpenseAction(name, amount)
    })
  }

  const handleRemoveRecurringExpense = (expenseId: string) => {
    startTransition(async () => {
      await removeRecurringExpenseAction(expenseId)
    })
  }

  const handleUpdateRecurringExpense = (
    expenseId: string,
    name: string,
    amount: number
  ) => {
    startTransition(async () => {
      await updateRecurringExpenseAction(expenseId, name, amount)
    })
  }

  const handleAddBillToSet = (
    billSet: 1 | 2,
    name: string,
    amount: number
  ) => {
    startTransition(async () => {
      await addBill(billSet, name, amount)
    })
  }

  const handleRemoveBillFromSet = (billId: string) => {
    startTransition(async () => {
      await removeBill(billId)
    })
  }

  const handleConfigChange = async (newConfig: Partial<PayScheduleConfig>) => {
    const updated = { ...payScheduleConfig, ...newConfig }
    setPayScheduleConfig(updated)

    startTransition(async () => {
      await updateUserConfig({
        frequency: updated.frequency,
        startDate: updated.startDate.toISOString().split('T')[0],
        dayOfWeek: updated.dayOfWeek,
        semiMonthlyDays: updated.semiMonthlyDays,
        adjustToNearestWeekday: updated.adjustToNearestWeekday,
        defaultAmount: updated.defaultAmount,
      })
    })
  }

  const getPaycheckExpenses = (paycheckDate: Date): Expense[] => {
    const dateStr = paycheckDate.toISOString().split('T')[0]
    return expenses.filter((e) => e.paycheckDate === dateStr)
  }

  const calculateSummaries = (): PaycheckSummary[] => {
    let cumulativeRemaining = 0

    return paychecks.map((paycheck) => {
      const defaultBills = paycheck.billSet === 1 ? billSet1 : billSet2
      const bills = defaultBills.map((bill) => ({
        ...bill,
        amount: getBillAmount(paycheck.date, bill),
      }))

      const paycheckExpenses = getPaycheckExpenses(paycheck.date)
      const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0)
      const totalOneTimeExpenses = paycheckExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      )
      const totalRecurringExpenses = recurringExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      )
      const totalExpenses = totalOneTimeExpenses + totalRecurringExpenses
      const remaining = paycheck.amount - totalBills - totalExpenses

      cumulativeRemaining += remaining

      return {
        paycheck,
        bills,
        expenses: paycheckExpenses,
        totalBills,
        totalExpenses,
        remaining,
        cumulativeRemaining,
      }
    })
  }

  const summaries = calculateSummaries()
  const totalSavings =
    summaries.length > 0 ? summaries[summaries.length - 1].cumulativeRemaining : 0
  const totalIncome = summaries.reduce((sum, s) => sum + s.paycheck.amount, 0)
  const totalBills = summaries.reduce((sum, s) => sum + s.totalBills, 0)
  const totalExpenses = summaries.reduce((sum, s) => sum + s.totalExpenses, 0)

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Income',
      'Bills',
      'Expenses',
      'Remaining',
      'Cumulative Savings',
    ]
    const rows = summaries.map((s) => [
      format(s.paycheck.date, 'yyyy-MM-dd'),
      s.paycheck.amount.toFixed(2),
      s.totalBills.toFixed(2),
      s.totalExpenses.toFixed(2),
      s.remaining.toFixed(2),
      s.cumulativeRemaining.toFixed(2),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paycheck-forecast-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Paycheck Forecast
          </h1>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <span>📊</span> Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <span>📄</span> Export PDF
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pay Frequency
              </label>
              <select
                value={payScheduleConfig.frequency}
                onChange={(e) =>
                  handleConfigChange({
                    frequency: e.target.value as PayFrequency,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="semi-monthly">Semi-Monthly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paycheck Amount
              </label>
              <input
                type="number"
                value={payScheduleConfig.defaultAmount}
                onChange={(e) =>
                  handleConfigChange({
                    defaultAmount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>
            {payScheduleConfig.frequency === 'semi-monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjust to Friday
                </label>
                <input
                  type="checkbox"
                  checked={payScheduleConfig.adjustToNearestWeekday}
                  onChange={(e) =>
                    handleConfigChange({
                      adjustToNearestWeekday: e.target.checked,
                    })
                  }
                  className="h-10 w-5"
                />
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forecast Start Date
              </label>
              <input
                type="date"
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forecast End Date
              </label>
              <input
                type="date"
                value={format(endDate, 'yyyy-MM-dd')}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>
          </div>

          {/* Period Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-4">
              {format(startDate, 'MMM d, yyyy')} -{' '}
              {format(endDate, 'MMM d, yyyy')}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Total Income
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  $
                  {totalIncome.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Total Bills
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  $
                  {totalBills.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Total Expenses
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  $
                  {totalExpenses.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Total Savings
                </div>
                <div
                  className={`text-2xl font-bold ${
                    totalSavings >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  $
                  {totalSavings.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recurring Expenses */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Recurring Expenses
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Applied to every paycheck (e.g., groceries, gas)
              </p>
            </div>
            <RecurringExpenseForm onAdd={handleAddRecurringExpense} />
          </div>

          {recurringExpenses.length > 0 ? (
            <div className="space-y-2">
              {recurringExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <span className="text-gray-700 font-medium">
                    {expense.name}
                  </span>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) =>
                        handleUpdateRecurringExpense(
                          expense.id,
                          expense.name,
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-32 px-3 py-1 text-right border border-gray-300 rounded text-gray-900"
                    />
                    <button
                      onClick={() => handleRemoveRecurringExpense(expense.id)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-200 flex justify-between font-semibold text-lg">
                <span>Total Per Paycheck</span>
                <span className="text-purple-600">
                  $
                  {recurringExpenses
                    .reduce((sum, e) => sum + e.amount, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No recurring expenses yet. Add expenses that happen every
              paycheck.
            </div>
          )}
        </div>

        {/* Bill Sets Management */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Bill Sets
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Customize which bills appear on alternating paychecks
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bill Set 1 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bill Set 1
                </h3>
                <BillForm billSet={1} onAdd={handleAddBillToSet} />
              </div>
              <div className="space-y-2">
                {billSet1.length === 0 ? (
                  <div className="text-gray-400 text-sm italic py-2">
                    No bills in this set
                  </div>
                ) : (
                  billSet1.map((bill) => {
                    const dbBill = initialBills.find(
                      (b) => b.name === bill.name && b.bill_set === 1
                    )
                    return (
                      <div
                        key={bill.name}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <span className="text-gray-700">{bill.name}</span>
                        <div className="flex gap-2 items-center">
                          <span className="text-gray-600">${bill.amount}</span>
                          <button
                            onClick={() =>
                              dbBill && handleRemoveBillFromSet(dbBill.id)
                            }
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Bill Set 2 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bill Set 2
                </h3>
                <BillForm billSet={2} onAdd={handleAddBillToSet} />
              </div>
              <div className="space-y-2">
                {billSet2.length === 0 ? (
                  <div className="text-gray-400 text-sm italic py-2">
                    No bills in this set
                  </div>
                ) : (
                  billSet2.map((bill) => {
                    const dbBill = initialBills.find(
                      (b) => b.name === bill.name && b.bill_set === 2
                    )
                    return (
                      <div
                        key={bill.name}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <span className="text-gray-700">{bill.name}</span>
                        <div className="flex gap-2 items-center">
                          <span className="text-gray-600">${bill.amount}</span>
                          <button
                            onClick={() =>
                              dbBill && handleRemoveBillFromSet(dbBill.id)
                            }
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Paycheck List */}
        <div className="space-y-6">
          {summaries.map((summary, index) => (
            <PaycheckCard
              key={`${summary.paycheck.date.toISOString()}_${index}`}
              summary={summary}
              index={index}
              recurringExpenses={recurringExpenses}
              onUpdateBill={handleUpdateBillAmount}
              onAddExpense={handleAddExpense}
              onRemoveExpense={handleRemoveExpense}
              onUpdateExpense={handleUpdateExpense}
            />
          ))}
        </div>

        {paychecks.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No paychecks in the selected date range.
          </div>
        )}
      </div>
    </div>
  )
}
