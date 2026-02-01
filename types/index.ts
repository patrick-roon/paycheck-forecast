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
  paycheckDate?: string; // ISO date string - for expenses linked to paychecks
  reimbursementDate?: string; // ISO date string - for expenses linked to reimbursements
  isReimbursable?: boolean; // marks expense as reimbursable
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

// Reimbursement types (computed dynamically, not persisted)
export interface Reimbursement {
  id: string; // Generated ID (e.g., `reimb-${date}`)
  amount: number; // Sum of linked expenses
  date: Date; // Calculated from expense date + interval
  expenseIds: string[]; // References to expenses
}

export interface ReimbursementEntry {
  reimbursement: Reimbursement;
  linkedExpenses: Expense[]; // Expenses being reimbursed
  oneTimeExpenses: Expense[]; // One-time expenses subtracting from reimbursement
  cumulativeRemaining: number;
}

// Union type for chronological display of paychecks and reimbursements
export type PaycheckOrReimbursement =
  | { type: 'paycheck'; data: PaycheckSummary }
  | { type: 'reimbursement'; data: ReimbursementEntry };
