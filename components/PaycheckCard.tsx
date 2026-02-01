'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { PaycheckSummary, RecurringExpense } from '@/types'

interface PaycheckCardProps {
  summary: PaycheckSummary
  index: number
  recurringExpenses: RecurringExpense[]
  onUpdateBill: (paycheckDate: Date, billName: string, amount: number) => void
  onAddExpense: (paycheckDate: Date, name: string, amount: number) => void
  onRemoveExpense: (expenseId: string) => void
  onUpdateExpense: (expenseId: string, name: string, amount: number) => void
  onToggleReimbursable: (expenseId: string, isReimbursable: boolean) => void
}

export default function PaycheckCard({
  summary,
  index,
  recurringExpenses,
  onUpdateBill,
  onAddExpense,
  onRemoveExpense,
  onUpdateExpense,
  onToggleReimbursable
}: PaycheckCardProps) {
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpenseName, setNewExpenseName] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')

  const handleAddExpense = () => {
    if (newExpenseName && newExpenseAmount) {
      onAddExpense(summary.paycheck.date, newExpenseName, parseFloat(newExpenseAmount))
      setNewExpenseName('')
      setNewExpenseAmount('')
      setShowAddExpense(false)
    }
  }

  return (
    <div className="paycheck-card bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm opacity-90">Paycheck #{index + 1}</div>
            <div className="text-2xl font-bold">
              {format(summary.paycheck.date, 'MMMM d, yyyy')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Income</div>
            <div className="text-2xl font-bold">
              ${summary.paycheck.amount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Bills */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Bills (Set {summary.paycheck.billSet})
        </h3>
        <div className="space-y-2">
          {summary.bills.map(bill => (
            <div key={bill.name} className="flex justify-between items-center">
              <span className="text-gray-700">{bill.name}</span>
              <input
                type="number"
                value={bill.amount}
                onChange={(e) => onUpdateBill(
                  summary.paycheck.date,
                  bill.name,
                  parseFloat(e.target.value) || 0
                )}
                className="w-32 px-3 py-1 text-right border border-gray-300 rounded text-gray-900"
              />
            </div>
          ))}
          <div className="pt-2 border-t border-gray-200 flex justify-between font-semibold">
            <span>Total Bills</span>
            <span>${summary.totalBills.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Recurring Expenses */}
      {recurringExpenses.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recurring Expenses</h3>
          <div className="space-y-2">
            {recurringExpenses.map(expense => (
              <div key={expense.id} className="flex justify-between items-center">
                <span className="text-gray-700">{expense.name}</span>
                <span className="font-medium text-gray-900">${expense.amount.toLocaleString()}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-purple-200 flex justify-between font-semibold">
              <span>Total Recurring</span>
              <span>${recurringExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* One-Time Expenses */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">One-Time Expenses</h3>
          <button
            onClick={() => setShowAddExpense(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + Add Expense
          </button>
        </div>

        {showAddExpense && (
          <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Expense name"
                value={newExpenseName}
                onChange={(e) => setNewExpenseName(e.target.value)}
                className="flex-1 px-3 py-1 border border-gray-300 rounded text-gray-900"
              />
              <input
                type="number"
                placeholder="Amount"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                className="w-32 px-3 py-1 border border-gray-300 rounded text-gray-900"
              />
              <button
                onClick={handleAddExpense}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddExpense(false)
                  setNewExpenseName('')
                  setNewExpenseAmount('')
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {summary.expenses.map(expense => (
            <div key={expense.id} className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="checkbox"
                  checked={expense.isReimbursable || false}
                  onChange={(e) => onToggleReimbursable(expense.id, e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                  title="Mark as reimbursable"
                />
                <span className="text-gray-700">{expense.name}</span>
                {expense.isReimbursable && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Reimbursable
                  </span>
                )}
              </div>
              <input
                type="number"
                value={expense.amount}
                onChange={(e) => onUpdateExpense(
                  expense.id,
                  expense.name,
                  parseFloat(e.target.value) || 0
                )}
                className="w-32 px-3 py-1 text-right border border-gray-300 rounded text-gray-900"
              />
              <button
                onClick={() => onRemoveExpense(expense.id)}
                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
              >
                ✕
              </button>
            </div>
          ))}
          {summary.expenses.length === 0 && (
            <div className="text-gray-400 text-sm italic">No additional expenses</div>
          )}
          {summary.expenses.length > 0 && (
            <div className="pt-2 border-t border-gray-200 flex justify-between font-semibold">
              <span>Total Expenses</span>
              <span>${summary.totalExpenses.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="space-y-2">
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Remaining This Paycheck</span>
            <span className={`font-bold ${summary.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${summary.remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-lg border-t border-gray-300 pt-2">
            <span className="font-semibold">Cumulative Savings</span>
            <span className={`font-bold ${summary.cumulativeRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${summary.cumulativeRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
