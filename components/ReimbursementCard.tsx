'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ReimbursementEntry } from '@/types'

interface ReimbursementCardProps {
  entry: ReimbursementEntry
  onUpdateDate?: (reimbursementId: string, newDate: Date) => void
  onAddExpense?: (reimbursementDate: Date, name: string, amount: number) => void
  onRemoveExpense?: (expenseId: string) => void
  onUpdateExpense?: (expenseId: string, name: string, amount: number) => void
}

export default function ReimbursementCard({
  entry,
  onUpdateDate,
  onAddExpense,
  onRemoveExpense,
  onUpdateExpense
}: ReimbursementCardProps) {
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpenseName, setNewExpenseName] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')

  const handleAddExpense = () => {
    if (newExpenseName && newExpenseAmount && onAddExpense) {
      onAddExpense(entry.reimbursement.date, newExpenseName, parseFloat(newExpenseAmount))
      setNewExpenseName('')
      setNewExpenseAmount('')
      setShowAddExpense(false)
    }
  }

  const totalExpenses = entry.oneTimeExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="reimbursement-card bg-white rounded-lg shadow overflow-hidden border-2 border-green-300">
      {/* Header - Green to distinguish from paychecks */}
      <div className="bg-green-600 text-white px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm opacity-90 mb-1">Reimbursement</div>
            {onUpdateDate ? (
              <input
                type="date"
                value={format(entry.reimbursement.date, 'yyyy-MM-dd')}
                onChange={(e) => onUpdateDate(entry.reimbursement.id, new Date(e.target.value))}
                className="text-lg font-bold bg-green-700 text-white border border-green-500 rounded px-2 py-1 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-300"
              />
            ) : (
              <div className="text-2xl font-bold">
                {format(entry.reimbursement.date, 'MMMM d, yyyy')}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Amount</div>
            <div className="text-2xl font-bold">
              ${entry.reimbursement.amount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Reimbursed Expenses */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Reimbursed Expenses
        </h3>
        <div className="space-y-2">
          {entry.linkedExpenses.map(expense => (
            <div key={expense.id} className="flex justify-between items-center">
              <span className="text-gray-700">{expense.name}</span>
              <span className="font-medium text-gray-900">
                ${expense.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* One-Time Expenses */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">One-Time Expenses</h3>
          {onAddExpense && (
            <button
              onClick={() => setShowAddExpense(true)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Add Expense
            </button>
          )}
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
          {entry.oneTimeExpenses.map(expense => (
            <div key={expense.id} className="flex justify-between items-center gap-2">
              <span className="text-gray-700 flex-1">{expense.name}</span>
              {onUpdateExpense && (
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
              )}
              {!onUpdateExpense && (
                <span className="font-medium text-gray-900">${expense.amount.toLocaleString()}</span>
              )}
              {onRemoveExpense && (
                <button
                  onClick={() => onRemoveExpense(expense.id)}
                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {entry.oneTimeExpenses.length === 0 && (
            <div className="text-gray-400 text-sm italic">No expenses</div>
          )}
          {entry.oneTimeExpenses.length > 0 && (
            <div className="pt-2 border-t border-gray-200 flex justify-between font-semibold">
              <span>Total Expenses</span>
              <span className="text-red-600">-${totalExpenses.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="space-y-2">
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Net Reimbursement</span>
            <span className={`font-bold ${(entry.reimbursement.amount - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(entry.reimbursement.amount - totalExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-lg border-t border-gray-300 pt-2">
            <span className="font-semibold">Cumulative Savings</span>
            <span className={`font-bold ${entry.cumulativeRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${entry.cumulativeRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
