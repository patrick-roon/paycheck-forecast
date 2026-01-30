import { Bill } from '@/types';

// Default starting amounts - these will be editable per paycheck
export const DEFAULT_BILLS_SET_1: Bill[] = [
  { name: 'Rent', amount: 1600, billSet: 1 },
  { name: 'Tally', amount: 250, billSet: 1 },
  { name: 'Sola', amount: 250, billSet: 1 },
  { name: 'RV Storage', amount: 200, billSet: 1 },
];

export const DEFAULT_BILLS_SET_2: Bill[] = [
  { name: 'Ford', amount: 1045, billSet: 2 },
  { name: 'Mocse', amount: 865, billSet: 2 },
  { name: 'Verizon', amount: 300, billSet: 2 },
];

export function getDefaultBillsForSet(billSet: 1 | 2): Bill[] {
  return billSet === 1
    ? DEFAULT_BILLS_SET_1.map(b => ({ ...b }))
    : DEFAULT_BILLS_SET_2.map(b => ({ ...b }));
}
