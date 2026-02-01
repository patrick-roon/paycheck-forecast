'use client'

import { useState } from 'react'

interface BillFormProps {
  billSet: 1 | 2
  onAdd: (billSet: 1 | 2, name: string, amount: number) => void
}

export default function BillForm({ billSet, onAdd }: BillFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')

  const handleAdd = () => {
    if (name && amount) {
      onAdd(billSet, name, parseFloat(amount))
      setName('')
      setAmount('')
      setShowForm(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + Add Bill
      </button>
    )
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <input
        type="text"
        placeholder="Bill name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded text-gray-900"
      />
      <button
        onClick={handleAdd}
        className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
      >
        Add
      </button>
      <button
        onClick={() => {
          setShowForm(false)
          setName('')
          setAmount('')
        }}
        className="px-2 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  )
}
