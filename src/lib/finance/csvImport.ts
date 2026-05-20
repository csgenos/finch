import { ImportResult, ImportRow, ImportError } from '../../types/planning';
import { Transaction } from '../../types/finance';
import { generateId } from '../storage/localStore';

export interface CsvColumnMap {
  date: string;
  description: string;
  amount: string;
  type?: string;
  category?: string;
  notes?: string;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s()]/g, '').replace(/^\((.+)\)$/, '-$1');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseDate(raw: string): string | null {
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];
  for (const fmt of formats) {
    const m = raw.trim().match(fmt);
    if (m) {
      if (fmt === formats[0]) return raw.trim();
      const [, a, b, c] = m;
      return `${c}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
    }
  }
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += char;
    }
    values.push(current.trim());

    return headers.reduce<Record<string, string>>((acc, h, i) => {
      acc[h] = values[i] ?? '';
      return acc;
    }, {});
  });
}

export function autoDetectColumns(headers: string[]): Partial<CsvColumnMap> {
  const lower = headers.map(h => h.toLowerCase());
  const find = (patterns: string[]) => headers[lower.findIndex(h => patterns.some(p => h.includes(p)))] ?? '';
  return {
    date: find(['date', 'time', 'posted']),
    description: find(['description', 'merchant', 'payee', 'name', 'memo']),
    amount: find(['amount', 'debit', 'credit', 'sum', 'total']),
  };
}

export function previewImport(
  rows: Record<string, string>[],
  columnMap: CsvColumnMap,
  defaultCategoryId: string,
  defaultAccountId: string
): ImportResult {
  const preview: ImportRow[] = [];
  const errors: ImportError[] = [];
  let success = 0;
  let skipped = 0;

  rows.slice(0, 200).forEach((row, i) => {
    const rawDate = row[columnMap.date] ?? '';
    const rawAmount = row[columnMap.amount] ?? '';
    const rawDesc = row[columnMap.description] ?? '';

    const date = parseDate(rawDate);
    const amount = parseAmount(rawAmount);

    if (!date) {
      errors.push({ row: i + 2, message: `Cannot parse date: "${rawDate}"`, raw: row });
      skipped++;
      return;
    }
    if (amount === null) {
      errors.push({ row: i + 2, message: `Cannot parse amount: "${rawAmount}"`, raw: row });
      skipped++;
      return;
    }
    if (!rawDesc.trim()) {
      skipped++;
      return;
    }

    const type = amount >= 0 ? 'income' : 'expense';
    preview.push({ date, description: rawDesc.trim(), amount: Math.abs(amount), type, raw: row });
    success++;
  });

  return { success, skipped, errors, preview };
}

export function buildTransactions(
  preview: ImportRow[],
  defaultCategoryId: string,
  defaultAccountId: string
): Transaction[] {
  return preview
    .filter(r => !r.error)
    .map(r => ({
      id: generateId(),
      date: r.date,
      description: r.description,
      amount: r.amount,
      type: r.type as 'income' | 'expense',
      categoryId: defaultCategoryId,
      accountId: defaultAccountId,
    }));
}
