import { describe, expect, it } from 'vitest';
import {
  createBackupSnapshot,
  decryptBackupPayload,
  encryptBackupSnapshot,
  normalizeBackupSnapshot,
} from './backup';

describe('backup helpers', () => {
  it('creates summary counts from finance payloads', () => {
    const snapshot = createBackupSnapshot(
      {
        accounts: [{ id: 'a1' }],
        transactions: [{ id: 't1' }, { id: 't2' }],
        budgets: [{ id: 'b1' }],
        categories: [{ id: 'c1' }, { id: 'c2' }],
        scenarios: [],
        paychecks: [{ id: 'p1' }],
        recurringExpenses: [{ id: 'r1' }],
        goals: [{ id: 'g1' }],
        netWorthSnapshots: [],
      },
      { currency: 'USD' },
    );

    expect(snapshot.summary.accounts).toBe(1);
    expect(snapshot.summary.transactions).toBe(2);
    expect(snapshot.summary.categories).toBe(2);
    expect(snapshot.settings.currency).toBe('USD');
  });

  it('round-trips encrypted backups', async () => {
    const snapshot = createBackupSnapshot(
      {
        accounts: [{ id: 'a1' }],
        transactions: [{ id: 't1' }],
        budgets: [],
        categories: [],
        scenarios: [],
        paychecks: [],
        recurringExpenses: [],
        goals: [],
        netWorthSnapshots: [],
      },
      { locale: 'en-US' },
    );

    const encrypted = await encryptBackupSnapshot(snapshot, 'correct horse battery staple');
    const decrypted = await decryptBackupPayload(JSON.parse(encrypted), 'correct horse battery staple');
    const normalized = normalizeBackupSnapshot(decrypted);

    expect(normalized.finance.accounts).toEqual([{ id: 'a1' }]);
    expect(normalized.settings.locale).toBe('en-US');
  });

  it('wraps legacy raw backups into the new snapshot format', () => {
    const normalized = normalizeBackupSnapshot({
      accounts: [{ id: 'a1' }],
      transactions: [],
      budgets: [],
      categories: [],
      scenarios: [],
      paychecks: [],
      recurringExpenses: [],
      goals: [],
      netWorthSnapshots: [],
    });

    expect(normalized.format).toBe('flint-backup-v2');
    expect(normalized.summary.accounts).toBe(1);
  });
});
