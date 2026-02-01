import { addDays } from 'date-fns';
import { Expense, Reimbursement } from '@/types';

export interface ReimbursementConfig {
  defaultInterval: number; // Days until reimbursement (14, 30, 60)
  dateOverrides?: Record<string, Date>; // Map of reimbursement ID to new date
}

/**
 * Generates reimbursement entries from reimbursable expenses.
 * Groups expenses by calculated reimbursement date and creates
 * reimbursement objects with summed amounts.
 *
 * @param expenses - All expenses (will filter for reimbursable ones)
 * @param config - Configuration with default reimbursement interval and optional date overrides
 * @returns Array of computed Reimbursement objects
 */
export function generateReimbursements(
  expenses: Expense[],
  config: ReimbursementConfig
): Reimbursement[] {
  // Group reimbursable expenses by calculated reimbursement date
  const reimbursementGroups = new Map<string, Expense[]>();

  expenses
    .filter(e => e.isReimbursable)
    .forEach(expense => {
      const expenseDate = new Date(expense.paycheckDate);
      const reimbursementDate = addDays(expenseDate, config.defaultInterval);
      const dateKey = reimbursementDate.toISOString().split('T')[0];

      if (!reimbursementGroups.has(dateKey)) {
        reimbursementGroups.set(dateKey, []);
      }
      reimbursementGroups.get(dateKey)!.push(expense);
    });

  // Convert groups to reimbursement objects
  const reimbursements = Array.from(reimbursementGroups.entries()).map(([dateStr, expenseGroup]) => {
    const id = `reimb-${dateStr}`; // Generated ID for this reimbursement
    const defaultDate = new Date(dateStr);

    // Apply date override if it exists
    const finalDate = config.dateOverrides?.[id] || defaultDate;

    return {
      id,
      amount: expenseGroup.reduce((sum, e) => sum + e.amount, 0),
      date: finalDate,
      expenseIds: expenseGroup.map(e => e.id),
    };
  });

  return reimbursements;
}
