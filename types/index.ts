export interface Paycheck {
  date: Date;
  amount: number;
  billSet: 1 | 2;
}

export interface Bill {
  name: string;
  amount: number;
  billSet: 1 | 2;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  paycheckDate: string; // ISO date string
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
}

export interface PaycheckSummary {
  paycheck: Paycheck;
  bills: Bill[];
  expenses: Expense[];
  totalBills: number;
  totalExpenses: number;
  remaining: number;
  cumulativeRemaining: number;
}
