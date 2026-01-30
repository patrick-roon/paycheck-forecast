'use client';

import { useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { fetchPaychecks, filterPaychecksByDateRange } from '@/lib/paycheckService';
import { getDefaultBillsForSet } from '@/lib/billsConfig';
import { Paycheck, Bill, Expense, RecurringExpense, PaycheckSummary } from '@/types';

export default function Home() {
  const [paychecks, setPaychecks] = useState<Paycheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addMonths(new Date(), 3));
  const [defaultPaycheckAmount, setDefaultPaycheckAmount] = useState(5235);

  // Store bill amounts per paycheck (key: ISO date + bill name)
  const [billAmounts, setBillAmounts] = useState<Record<string, number>>({});

  // Store expenses per paycheck
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Store recurring expenses (applied to every paycheck)
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

  // Store customizable bill sets
  const [billSet1, setBillSet1] = useState<Bill[]>(getDefaultBillsForSet(1));
  const [billSet2, setBillSet2] = useState<Bill[]>(getDefaultBillsForSet(2));

  useEffect(() => {
    loadPaychecks();
  }, []);

  const loadPaychecks = async () => {
    setLoading(true);
    const fetchedPaychecks = await fetchPaychecks();
    // Set default paycheck amounts
    const paychecksWithDefaults = fetchedPaychecks.map(pc => ({
      ...pc,
      amount: defaultPaycheckAmount
    }));
    setPaychecks(paychecksWithDefaults);
    setLoading(false);
  };

  const filteredPaychecks = filterPaychecksByDateRange(paychecks, startDate, endDate);

  const getBillAmountKey = (paycheckDate: Date, billName: string) => {
    return `${paycheckDate.toISOString()}_${billName}`;
  };

  const getBillAmount = (paycheckDate: Date, bill: Bill): number => {
    const key = getBillAmountKey(paycheckDate, bill.name);
    return billAmounts[key] ?? bill.amount;
  };

  const updateBillAmount = (paycheckDate: Date, billName: string, amount: number) => {
    const key = getBillAmountKey(paycheckDate, billName);
    setBillAmounts(prev => ({ ...prev, [key]: amount }));
  };

  const addExpense = (paycheckDate: Date, name: string, amount: number) => {
    const expense: Expense = {
      id: Date.now().toString(),
      name,
      amount,
      paycheckDate: paycheckDate.toISOString(),
    };
    setExpenses(prev => [...prev, expense]);
  };

  const removeExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  const updateExpense = (expenseId: string, name: string, amount: number) => {
    setExpenses(prev => prev.map(e =>
      e.id === expenseId ? { ...e, name, amount } : e
    ));
  };

  const addRecurringExpense = (name: string, amount: number) => {
    const expense: RecurringExpense = {
      id: Date.now().toString(),
      name,
      amount,
    };
    setRecurringExpenses(prev => [...prev, expense]);
  };

  const removeRecurringExpense = (expenseId: string) => {
    setRecurringExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  const updateRecurringExpense = (expenseId: string, name: string, amount: number) => {
    setRecurringExpenses(prev => prev.map(e =>
      e.id === expenseId ? { ...e, name, amount } : e
    ));
  };

  const addBillToSet = (billSet: 1 | 2, name: string, amount: number) => {
    const newBill: Bill = { name, amount, billSet };
    if (billSet === 1) {
      setBillSet1(prev => [...prev, newBill]);
    } else {
      setBillSet2(prev => [...prev, newBill]);
    }
  };

  const removeBillFromSet = (billSet: 1 | 2, billName: string) => {
    if (billSet === 1) {
      setBillSet1(prev => prev.filter(b => b.name !== billName));
    } else {
      setBillSet2(prev => prev.filter(b => b.name !== billName));
    }
  };

  const getPaycheckExpenses = (paycheckDate: Date): Expense[] => {
    return expenses.filter(e => e.paycheckDate === paycheckDate.toISOString());
  };

  const calculateSummaries = (): PaycheckSummary[] => {
    let cumulativeRemaining = 0;

    return filteredPaychecks.map(paycheck => {
      const defaultBills = paycheck.billSet === 1 ? billSet1 : billSet2;
      const bills = defaultBills.map(bill => ({
        ...bill,
        amount: getBillAmount(paycheck.date, bill),
      }));

      const paycheckExpenses = getPaycheckExpenses(paycheck.date);
      const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
      const totalOneTimeExpenses = paycheckExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalRecurringExpenses = recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalExpenses = totalOneTimeExpenses + totalRecurringExpenses;
      const remaining = paycheck.amount - totalBills - totalExpenses;

      cumulativeRemaining += remaining;

      return {
        paycheck,
        bills,
        expenses: paycheckExpenses,
        totalBills,
        totalExpenses,
        remaining,
        cumulativeRemaining,
      };
    });
  };

  const summaries = calculateSummaries();
  const totalSavings = summaries.length > 0
    ? summaries[summaries.length - 1].cumulativeRemaining
    : 0;
  const totalIncome = summaries.reduce((sum, s) => sum + s.paycheck.amount, 0);
  const totalBills = summaries.reduce((sum, s) => sum + s.totalBills, 0);
  const totalExpenses = summaries.reduce((sum, s) => sum + s.totalExpenses, 0);

  const exportToCSV = () => {
    const headers = ['Date', 'Income', 'Bills', 'Expenses', 'Remaining', 'Cumulative Savings'];
    const rows = summaries.map(s => [
      format(s.paycheck.date, 'yyyy-MM-dd'),
      s.paycheck.amount.toFixed(2),
      s.totalBills.toFixed(2),
      s.totalExpenses.toFixed(2),
      s.remaining.toFixed(2),
      s.cumulativeRemaining.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paycheck-forecast-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading paychecks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Paycheck Forecast</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
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
                End Date
              </label>
              <input
                type="date"
                value={format(endDate, 'yyyy-MM-dd')}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Paycheck Amount
              </label>
              <input
                type="number"
                value={defaultPaycheckAmount}
                onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  setDefaultPaycheckAmount(amount);
                  setPaychecks(prev => prev.map(pc => ({ ...pc, amount })));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              />
            </div>
          </div>

          {/* Period Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 mb-4">
              {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Total Income</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Total Bills</div>
                <div className="text-2xl font-bold text-orange-600">
                  ${totalBills.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Total Expenses</div>
                <div className="text-2xl font-bold text-purple-600">
                  ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Total Savings</div>
                <div className={`text-2xl font-bold ${totalSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recurring Expenses */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recurring Expenses</h2>
              <p className="text-sm text-gray-500 mt-1">Applied to every paycheck (e.g., groceries, gas)</p>
            </div>
            <RecurringExpenseForm onAdd={addRecurringExpense} />
          </div>

          {recurringExpenses.length > 0 ? (
            <div className="space-y-2">
              {recurringExpenses.map(expense => (
                <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700 font-medium">{expense.name}</span>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => updateRecurringExpense(
                        expense.id,
                        expense.name,
                        parseFloat(e.target.value) || 0
                      )}
                      className="w-32 px-3 py-1 text-right border border-gray-300 rounded text-gray-900"
                    />
                    <button
                      onClick={() => removeRecurringExpense(expense.id)}
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
                  ${recurringExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              No recurring expenses yet. Add expenses that happen every paycheck.
            </div>
          )}
        </div>

        {/* Bill Sets Management */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bill Sets</h2>
          <p className="text-sm text-gray-500 mb-6">Customize which bills appear on alternating paychecks</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bill Set 1 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Bill Set 1</h3>
                <BillForm billSet={1} onAdd={addBillToSet} />
              </div>
              <div className="space-y-2">
                {billSet1.map(bill => (
                  <div key={bill.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">{bill.name}</span>
                    <div className="flex gap-2 items-center">
                      <span className="text-gray-600">${bill.amount}</span>
                      <button
                        onClick={() => removeBillFromSet(1, bill.name)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Set 2 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Bill Set 2</h3>
                <BillForm billSet={2} onAdd={addBillToSet} />
              </div>
              <div className="space-y-2">
                {billSet2.map(bill => (
                  <div key={bill.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">{bill.name}</span>
                    <div className="flex gap-2 items-center">
                      <span className="text-gray-600">${bill.amount}</span>
                      <button
                        onClick={() => removeBillFromSet(2, bill.name)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
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
              onUpdateBill={updateBillAmount}
              onAddExpense={addExpense}
              onRemoveExpense={removeExpense}
              onUpdateExpense={updateExpense}
            />
          ))}
        </div>

        {filteredPaychecks.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No paychecks found in the selected date range. Try adjusting the dates.
          </div>
        )}
      </div>
    </div>
  );
}

interface PaycheckCardProps {
  summary: PaycheckSummary;
  index: number;
  recurringExpenses: RecurringExpense[];
  onUpdateBill: (paycheckDate: Date, billName: string, amount: number) => void;
  onAddExpense: (paycheckDate: Date, name: string, amount: number) => void;
  onRemoveExpense: (expenseId: string) => void;
  onUpdateExpense: (expenseId: string, name: string, amount: number) => void;
}

function PaycheckCard({
  summary,
  index,
  recurringExpenses,
  onUpdateBill,
  onAddExpense,
  onRemoveExpense,
  onUpdateExpense
}: PaycheckCardProps) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  const handleAddExpense = () => {
    if (newExpenseName && newExpenseAmount) {
      onAddExpense(summary.paycheck.date, newExpenseName, parseFloat(newExpenseAmount));
      setNewExpenseName('');
      setNewExpenseAmount('');
      setShowAddExpense(false);
    }
  };

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
                  setShowAddExpense(false);
                  setNewExpenseName('');
                  setNewExpenseAmount('');
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
              <span className="text-gray-700 flex-1">{expense.name}</span>
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
  );
}

interface RecurringExpenseFormProps {
  onAdd: (name: string, amount: number) => void;
}

function RecurringExpenseForm({ onAdd }: RecurringExpenseFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const handleAdd = () => {
    if (name && amount) {
      onAdd(name, parseFloat(amount));
      setName('');
      setAmount('');
      setShowForm(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        + Add Recurring Expense
      </button>
    );
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
          setShowForm(false);
          setName('');
          setAmount('');
        }}
        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  );
}

interface BillFormProps {
  billSet: 1 | 2;
  onAdd: (billSet: 1 | 2, name: string, amount: number) => void;
}

function BillForm({ billSet, onAdd }: BillFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const handleAdd = () => {
    if (name && amount) {
      onAdd(billSet, name, parseFloat(amount));
      setName('');
      setAmount('');
      setShowForm(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + Add Bill
      </button>
    );
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
          setShowForm(false);
          setName('');
          setAmount('');
        }}
        className="px-2 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </div>
  );
}
