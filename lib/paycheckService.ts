import ICAL from 'ical.js';
import { Paycheck } from '@/types';

export async function fetchPaychecks(): Promise<Paycheck[]> {
  try {
    const response = await fetch('/api/paychecks');
    const json = await response.json();

    if (!response.ok || json.error) {
      console.error('Error from API:', json.error);
      throw new Error(json.error || 'Failed to fetch paychecks');
    }

    const icalData = json.data;

    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');

    // Filter to only include "Payday" events
    const paychecks: Paycheck[] = vevents
      .map((vevent) => {
        const event = new ICAL.Event(vevent);
        return { event, vevent };
      })
      .filter(({ event }) => {
        const summary = event.summary?.toLowerCase() || '';
        return summary.includes('payday');
      })
      .map(({ event }) => {
        const date = event.startDate.toJSDate();
        const amount = 5235; // Default paycheck amount

        return {
          date,
          amount,
          billSet: 1, // Will be recalculated after deduplication
        };
      });

    // Sort by date
    const sorted = paychecks.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Deduplicate by date - keep only unique dates
    const uniquePaychecks: Paycheck[] = [];
    const seenDates = new Set<string>();

    sorted.forEach((paycheck, index) => {
      const dateKey = paycheck.date.toISOString().split('T')[0]; // Use date only, ignore time
      if (!seenDates.has(dateKey)) {
        seenDates.add(dateKey);
        // Recalculate bill set based on position in deduplicated array
        uniquePaychecks.push({
          ...paycheck,
          billSet: (uniquePaychecks.length % 2 === 0 ? 1 : 2) as 1 | 2,
        });
      }
    });

    return uniquePaychecks;
  } catch (error) {
    console.error('Error fetching paychecks:', error);
    return [];
  }
}

export function filterPaychecksByDateRange(
  paychecks: Paycheck[],
  startDate: Date,
  endDate: Date
): Paycheck[] {
  return paychecks.filter(
    (paycheck) => paycheck.date >= startDate && paycheck.date <= endDate
  );
}
