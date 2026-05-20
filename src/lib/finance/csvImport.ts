import Papa from 'papaparse';
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
  // Strip currency symbols, commas, spaces; handle parentheses as negatives.
  const cleaned = raw.replace(/[$,\s]/g, '').replace(/^\((.+)\)$/, '-$1');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseDate(raw: string): string | null {
  const s = raw.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // M/D/YYYY or MM/DD/YYYY
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[1].padStart(2, '0')}-${slash[2].padStart(2, '0')}`;
  // M-D-YYYY
  const dash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dash) return `${dash[3]}-${dash[1].padStart(2, '0')}-${dash[2].padStart(2, '0')}`;
  // Let papaparse/Date handle exotic formats, but parse to YYYY-MM-DD without timezone shift.
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return null;
}

export function parseCsv(text: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => v.trim(),
  });
  return result.data;
}

export function autoDetectColumns(headers: string[]): Partial<CsvColumnMap> {
  const lower = headers.map(h => h.toLowerCase());
  const find = (patterns: string[]) =>
    headers[lower.findIndex(h => patterns.some(p => h.includes(p)))] ?? '';
  return {
    date: find(['date', 'time', 'posted', 'trans']),
    description: find(['description', 'merchant', 'payee', 'name', 'memo', 'narrative']),
    amount: find(['amount', 'debit', 'credit', 'sum', 'total', 'value']),
  };
}

export function previewImport(
  rows: Record<string, string>[],
  columnMap: CsvColumnMap,
  _defaultCategoryId: string,
  _defaultAccountId: string
): ImportResult {
  const preview: ImportRow[] = [];
  const errors: ImportError[] = [];
  let success = 0;
  let skipped = 0;

  rows.slice(0, 500).forEach((row, i) => {
    const rawDate = row[columnMap.date] ?? '';
    const rawAmount = row[columnMap.amount] ?? '';
    const rawDesc = row[columnMap.description] ?? '';

    if (!rawDesc.trim()) { skipped++; return; }

    const date = parseDate(rawDate);
    if (!date) {
      errors.push({ row: i + 2, message: `Cannot parse date: "${rawDate}"`, raw: row });
      skipped++;
      return;
    }

    const amount = parseAmount(rawAmount);
    if (amount === null) {
      errors.push({ row: i + 2, message: `Cannot parse amount: "${rawAmount}"`, raw: row });
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
