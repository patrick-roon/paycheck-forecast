'use client'

import { useState } from 'react'

interface RecurringExpenseFormProps {
  onAdd: (name: string, amount: number) => void
}

export default function RecurringExpenseForm({ onAdd }: RecurringExpenseFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')

  const handleAdd = () => {
    if (name && amount) {
      onAdd(name, parseFloat(amount))
      setName('')
      setAmount('')
      setShowForm(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        + Add Recurring Expense
      </button>
    )
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Name (e.g., Groceries)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded text-gray-900"
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-32 px-3 py-2 border border-gray-300 rounded text-gray-900"
      />
      <button
        onClick={handleAdd}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Add
      </button>
      <button
        onClick={() => {
          setShowForm(false)
          setName('')
          setAmount('')
        }}
        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  )
}
