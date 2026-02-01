import { addWeeks, addMonths, startOfMonth, endOfMonth, addDays, isBefore, isAfter, getDay, format } from 'date-fns';
import { Paycheck } from '@/types';

export type PayFrequency = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';

export interface PayScheduleConfig {
  frequency: PayFrequency;
  startDate: Date; // First paycheck date or anchor date
  dayOfWeek?: number; // 0=Sunday, 5=Friday (for weekly/bi-weekly)
  semiMonthlyDays?: number[]; // Days of month for semi-monthly (e.g., [15, 0] where 0=last day)
  adjustToNearestWeekday?: boolean; // Adjust to nearest Friday if falls on weekend
  defaultAmount: number;
}

function adjustToNearestFriday(date: Date): Date {
  const dayOfWeek = getDay(date);

  // Only adjust if it falls on a weekend
  // Saturday (6) → move to previous Friday
  if (dayOfWeek === 6) {
    return addDays(date, -1);
  }
  // Sunday (0) → move to previous Friday
  if (dayOfWeek === 0) {
    return addDays(date, -2);
  }
  // Weekdays (Mon-Fri) stay as is
  return date;
}

function getLastDayOfMonth(year: number, month: number): Date {
  return endOfMonth(new Date(year, month, 1));
}

function generateSemiMonthlyPaychecks(
  startDate: Date,
  endDate: Date,
  config: PayScheduleConfig
): Date[] {
  const paychecks: Date[] = [];
  const days = config.semiMonthlyDays || [15, 0]; // Default: 15th and last day

  let currentDate = new Date(startDate);
  currentDate.setDate(1); // Start from beginning of month

  while (isBefore(currentDate, endDate)) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    days.forEach(day => {
      let paycheckDate: Date;

      if (day === 0) {
        // Last day of month
        paycheckDate = getLastDayOfMonth(year, month);
      } else {
        paycheckDate = new Date(year, month, day);
      }

      // Adjust to nearest Friday if configured
      if (config.adjustToNearestWeekday) {
        paycheckDate = adjustToNearestFriday(paycheckDate);
      }

      // Only include if within range
      if (!isBefore(paycheckDate, startDate) && isBefore(paycheckDate, endDate)) {
        paychecks.push(paycheckDate);
      }
    });

    currentDate = addMonths(currentDate, 1);
  }

  return paychecks.sort((a, b) => a.getTime() - b.getTime());
}

function generateWeeklyPaychecks(
  startDate: Date,
  endDate: Date,
  config: PayScheduleConfig
): Date[] {
  const paychecks: Date[] = [];
  let currentDate = new Date(config.startDate);

  while (isBefore(currentDate, endDate)) {
    if (!isBefore(currentDate, startDate)) {
      paychecks.push(new Date(currentDate));
    }
    currentDate = addWeeks(currentDate, 1);
  }

  return paychecks;
}

function generateBiWeeklyPaychecks(
  startDate: Date,
  endDate: Date,
  config: PayScheduleConfig
): Date[] {
  const paychecks: Date[] = [];
  let currentDate = new Date(config.startDate);

  while (isBefore(currentDate, endDate)) {
    if (!isBefore(currentDate, startDate)) {
      paychecks.push(new Date(currentDate));
    }
    currentDate = addWeeks(currentDate, 2);
  }

  return paychecks;
}

function generateMonthlyPaychecks(
  startDate: Date,
  endDate: Date,
  config: PayScheduleConfig
): Date[] {
  const paychecks: Date[] = [];
  let currentDate = new Date(config.startDate);

  while (isBefore(currentDate, endDate)) {
    if (!isBefore(currentDate, startDate)) {
      paychecks.push(new Date(currentDate));
    }
    currentDate = addMonths(currentDate, 1);
  }

  return paychecks;
}

export function generatePaychecks(
  startDate: Date,
  endDate: Date,
  config: PayScheduleConfig
): Paycheck[] {
  let dates: Date[] = [];

  switch (config.frequency) {
    case 'weekly':
      dates = generateWeeklyPaychecks(startDate, endDate, config);
      break;
    case 'bi-weekly':
      dates = generateBiWeeklyPaychecks(startDate, endDate, config);
      break;
    case 'semi-monthly':
      dates = generateSemiMonthlyPaychecks(startDate, endDate, config);
      break;
    case 'monthly':
      dates = generateMonthlyPaychecks(startDate, endDate, config);
      break;
  }

  return dates.map((date, index) => ({
    date,
    amount: config.defaultAmount,
    billSet: (index % 2 === 0 ? 2 : 1) as 1 | 2, // Alternate bill sets
  }));
}

export function getDefaultConfig(): PayScheduleConfig {
  return {
    frequency: 'semi-monthly',
    startDate: new Date(),
    dayOfWeek: 5, // Friday
    semiMonthlyDays: [15, 0], // 15th and last day
    adjustToNearestWeekday: true,
    defaultAmount: 2000,
  };
}
