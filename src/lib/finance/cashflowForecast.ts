import { addDays, addWeeks, addMonths, format, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';
import { PaycheckSchedule, RecurringExpense, CashflowForecastPoint, ForecastEvent } from '../../types/planning';
import { PayFrequency, RecurrenceRule } from '../../types/planning';

function nextOccurrences(startDate: Date, rule: RecurrenceRule, count: number): Date[] {
  const dates: Date[] = [];
  let current = startDate;
  for (let i = 0; i < count; i++) {
    switch (rule) {
      case 'daily': current = addDays(current, 1); break;
      case 'weekly': current = addWeeks(current, 1); break;
      case 'biweekly': current = addWeeks(current, 2); break;
      case 'semimonthly': current = addDays(current, 15); break;
      case 'monthly': current = addMonths(current, 1); break;
      case 'quarterly': current = addMonths(current, 3); break;
      case 'yearly': current = addMonths(current, 12); break;
    }
    dates.push(current);
  }
  return dates;
}

function payFrequencyToRule(freq: PayFrequency): RecurrenceRule {
  return freq;
}

export function buildCashflowForecast(
  currentBalance: number,
  paychecks: PaycheckSchedule[],
  recurringExpenses: RecurringExpense[],
  days = 90
): CashflowForecastPoint[] {
  const today = startOfDay(new Date());
  const endDate = addDays(today, days);

  // Build event map keyed by ISO date
  const eventMap = new Map<string, ForecastEvent[]>();

  const addEvent = (date: Date, event: ForecastEvent) => {
    if (isAfter(date, endDate)) return;
    const key = format(date, 'yyyy-MM-dd');
    if (!eventMap.has(key)) eventMap.set(key, []);
    eventMap.get(key)!.push(event);
  };

  // Add paycheck occurrences
  for (const paycheck of paychecks) {
    let current = parseISO(paycheck.nextPayDate);
    const rule = payFrequencyToRule(paycheck.frequency);
    for (let i = 0; i < 26; i++) {
      if (isAfter(current, endDate)) break;
      if (!isBefore(current, today)) {
        addEvent(current, {
          label: paycheck.name,
          amount: paycheck.amount,
          type: 'paycheck',
        });
      }
      // advance to next occurrence
      switch (rule) {
        case 'weekly': current = addWeeks(current, 1); break;
        case 'biweekly': current = addWeeks(current, 2); break;
        case 'semimonthly': current = addDays(current, 15); break;
        case 'monthly': current = addMonths(current, 1); break;
        default: current = addMonths(current, 1);
      }
    }
  }

  // Add recurring expense occurrences
  for (const expense of recurringExpenses) {
    if (expense.status === 'paid') continue;
    let current = parseISO(expense.nextDueDate);
    for (let i = 0; i < 36; i++) {
      if (isAfter(current, endDate)) break;
      if (!isBefore(current, today)) {
        addEvent(current, {
          label: expense.name,
          amount: -expense.amount,
          type: 'bill',
        });
      }
      switch (expense.recurrence) {
        case 'weekly': current = addWeeks(current, 1); break;
        case 'biweekly': current = addWeeks(current, 2); break;
        case 'semimonthly': current = addDays(current, 15); break;
        case 'monthly': current = addMonths(current, 1); break;
        case 'quarterly': current = addMonths(current, 3); break;
        case 'yearly': current = addMonths(current, 12); break;
        default: current = addMonths(current, 1);
      }
    }
  }

  // Build daily points
  const points: CashflowForecastPoint[] = [];
  let runningBalance = currentBalance;

  for (let d = 0; d <= days; d++) {
    const date = addDays(today, d);
    const key = format(date, 'yyyy-MM-dd');
    const events = eventMap.get(key) ?? [];

    const inflows = events.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0);
    const outflows = events.filter(e => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0);
    runningBalance = runningBalance + inflows - outflows;

    points.push({
      date: key,
      projectedBalance: Math.round(runningBalance * 100) / 100,
      inflows,
      outflows,
      events,
    });
  }

  return points;
}

export function getLowestProjectedBalance(forecast: CashflowForecastPoint[]): { balance: number; date: string } {
  if (forecast.length === 0) return { balance: 0, date: '' };
  const min = forecast.reduce((a, b) => b.projectedBalance < a.projectedBalance ? b : a);
  return { balance: min.projectedBalance, date: min.date };
}

export function getNegativeDates(forecast: CashflowForecastPoint[]): string[] {
  return forecast.filter(p => p.projectedBalance < 0).map(p => p.date);
}

export function getUpcomingBills(
  recurringExpenses: RecurringExpense[],
  withinDays = 14
): RecurringExpense[] {
  const today = startOfDay(new Date());
  const cutoff = addDays(today, withinDays);
  return recurringExpenses
    .filter(r => {
      if (r.status === 'paid') return false;
      const due = parseISO(r.nextDueDate);
      return !isBefore(due, today) && !isAfter(due, cutoff);
    })
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
}

export function getSafeDailySpend(
  currentBalance: number,
  upcomingBillsTotal: number,
  daysUntilNextPaycheck: number,
  bufferAmount = 200
): number {
  const available = currentBalance - upcomingBillsTotal - bufferAmount;
  if (daysUntilNextPaycheck <= 0) return available;
  return Math.max(0, available / daysUntilNextPaycheck);
}
