import { useMemo, useRef, useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, FileText, Database, RotateCcw, Shield, LockKeyhole, TriangleAlert } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  parseCsv,
  autoDetectColumns,
  previewImport,
  buildTransactions,
  CsvColumnMap,
} from '../lib/finance/csvImport';
import { ImportResult } from '../types/planning';
import { formatCurrency } from '../lib/utils/format';
import { toast } from '../lib/utils/toast';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils/cn';
import {
  createBackupSnapshot,
  decryptBackupPayload,
  encryptBackupSnapshot,
  normalizeBackupSnapshot,
  type BackupSnapshot,
} from '../lib/storage/backup';
import { APP_VERSION } from '../lib/appInfo';

function downloadFile(content: string, filename: string, type = 'text/csv') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  const formulaSafe = /^[=+\-@\t\r]/.test(escaped) ? `'${escaped}` : escaped;
  return `"${formulaSafe}"`;
}

export function ImportExport() {
  const financeStore = useFinanceStore();
  const settingsStore = useSettingsStore();
  const { transactions, accounts, categories, addTransaction, importFullBackup } = financeStore;
  const fileRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);

  const [csvRows, setCsvRows] = useState<Record<string, string>[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<CsvColumnMap>({ date: '', description: '', amount: '' });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? '');
  const [selectedCategory, setSelectedCategory] = useState(
    categories.find(category => category.type === 'expense')?.id ?? ''
  );
  const [importing, setImporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportMode, setExportMode] = useState<'encrypted' | 'plaintext'>('encrypted');
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [exportPassphraseConfirm, setExportPassphraseConfirm] = useState('');
  const [restoreData, setRestoreData] = useState<BackupSnapshot | null>(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [pendingEncryptedBackup, setPendingEncryptedBackup] = useState<Record<string, unknown> | null>(null);
  const [restorePassphraseOpen, setRestorePassphraseOpen] = useState(false);
  const [restorePassphrase, setRestorePassphrase] = useState('');

  const accountOptions = accounts.map(account => ({ value: account.id, label: account.name }));
  const categoryOptions = categories.map(category => ({ value: category.id, label: category.name }));
  const headerOptions = headers.map(header => ({ value: header, label: header }));

  const financeBackupData = useMemo(() => ({
    accounts: financeStore.accounts,
    transactions: financeStore.transactions,
    budgets: financeStore.budgets,
    categories: financeStore.categories,
    scenarios: financeStore.scenarios,
    assumptions: financeStore.assumptions,
    paychecks: financeStore.paychecks,
    allocations: financeStore.allocations,
    recurringExpenses: financeStore.recurringExpenses,
    goals: financeStore.goals,
    netWorthSnapshots: financeStore.netWorthSnapshots,
  }), [
    financeStore.accounts,
    financeStore.transactions,
    financeStore.budgets,
    financeStore.categories,
    financeStore.scenarios,
    financeStore.assumptions,
    financeStore.paychecks,
    financeStore.allocations,
    financeStore.recurringExpenses,
    financeStore.goals,
    financeStore.netWorthSnapshots,
  ]);

  const settingsBackupData = useMemo(() => ({
    currency: settingsStore.currency,
    locale: settingsStore.locale,
    theme: settingsStore.theme,
    sidebarCollapsed: settingsStore.sidebarCollapsed,
    onboarding: settingsStore.onboarding,
  }), [
    settingsStore.currency,
    settingsStore.locale,
    settingsStore.theme,
    settingsStore.sidebarCollapsed,
    settingsStore.onboarding,
  ]);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async loadEvent => {
      const text = loadEvent.target?.result as string;
      try {
        const rows = parseCsv(text);
        if (rows.length === 0) {
          toast('CSV appears to be empty or malformed.', 'error');
          return;
        }

        const nextHeaders = Object.keys(rows[0]);
        const detected = autoDetectColumns(nextHeaders);

        setHeaders(nextHeaders);
        setCsvRows(rows);
        setResult(null);
        setColumnMap({
          date: detected.date ?? '',
          description: detected.description ?? '',
          amount: detected.amount ?? '',
        });
      } catch (error) {
        toast(error instanceof Error ? error.message : 'CSV appears to be malformed.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handlePreview = () => {
    if (!csvRows) return;
    setResult(previewImport(csvRows, columnMap, selectedCategory, selectedAccount));
  };

  const handleImport = () => {
    if (!result) return;

    setImporting(true);
    const existingKeys = new Set(transactions.map(transaction =>
      `${transaction.accountId}|${transaction.date}|${transaction.type}|${transaction.amount.toFixed(2)}|${transaction.description.trim().toLowerCase()}`
    ));

    const imported = buildTransactions(result.preview, selectedCategory, selectedAccount)
      .filter(transaction => {
        const key = `${transaction.accountId}|${transaction.date}|${transaction.type}|${transaction.amount.toFixed(2)}|${transaction.description.trim().toLowerCase()}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });

    imported.forEach(transaction => addTransaction(transaction));
    toast(`Imported ${imported.length} transactions${imported.length !== result.success ? `, skipped ${result.success - imported.length} duplicates` : ''}`);
    setCsvRows(null);
    setResult(null);
    setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const exportTransactions = () => {
    const rows = [
      ['Date', 'Description', 'Amount', 'Type', 'Category', 'Account', 'Notes', 'Tags'],
      ...transactions.map(transaction => [
        transaction.date,
        csvCell(transaction.description),
        transaction.amount.toString(),
        transaction.type,
        csvCell(categories.find(category => category.id === transaction.categoryId)?.name ?? ''),
        csvCell(accounts.find(account => account.id === transaction.accountId)?.name ?? ''),
        csvCell(transaction.notes ?? ''),
        csvCell((transaction.tags ?? []).join(', ')),
      ]),
    ];

    downloadFile(rows.map(row => row.join(',')).join('\n'), `flint-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    toast('Transactions exported');
  };

  const exportFullBackup = async () => {
    const snapshot = createBackupSnapshot(financeBackupData, settingsBackupData);
    const date = new Date().toISOString().slice(0, 10);

    if (exportMode === 'encrypted') {
      if (exportPassphrase.length < 10) {
        toast('Use a backup passphrase with at least 10 characters.', 'warning');
        return;
      }
      if (exportPassphrase !== exportPassphraseConfirm) {
        toast('Backup passphrases do not match.', 'warning');
        return;
      }

      const encrypted = await encryptBackupSnapshot(snapshot, exportPassphrase);
      downloadFile(encrypted, `flint-backup-encrypted-${date}.json`, 'application/json');
      toast('Encrypted full backup exported');
    } else {
      downloadFile(JSON.stringify(snapshot, null, 2), `flint-backup-plaintext-${date}.json`, 'application/json');
      toast('Plaintext full backup exported', 'warning');
    }

    setExportModalOpen(false);
    setExportPassphrase('');
    setExportPassphraseConfirm('');
  };

  const finalizeRestoreCandidate = (candidate: unknown) => {
    try {
      const snapshot = normalizeBackupSnapshot(candidate);
      setRestoreData(snapshot);
      setRestoreConfirmOpen(true);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Backup file could not be validated.', 'error');
    }
  };

  const handleBackupFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async loadEvent => {
      try {
        const parsed = JSON.parse(loadEvent.target?.result as string) as Record<string, unknown>;
        if (typeof parsed.format === 'string' && parsed.format.startsWith('flint-encrypted-backup-')) {
          setPendingEncryptedBackup(parsed);
          setRestorePassphrase('');
          setRestorePassphraseOpen(true);
          return;
        }
        finalizeRestoreCandidate(parsed);
      } catch {
        toast('Invalid backup file - could not parse JSON.', 'error');
      }
    };
    reader.readAsText(file);
    if (backupRef.current) backupRef.current.value = '';
  };

  const handleEncryptedRestoreUnlock = async () => {
    if (!pendingEncryptedBackup) return;

    try {
      const decrypted = await decryptBackupPayload(pendingEncryptedBackup, restorePassphrase);
      setPendingEncryptedBackup(null);
      setRestorePassphraseOpen(false);
      setRestorePassphrase('');
      finalizeRestoreCandidate(decrypted);
    } catch {
      toast('Backup passphrase was incorrect or the file is corrupted.', 'error');
    }
  };

  const restoreSummary = restoreData?.summary;
  const restoreCreatedAt = restoreData?.createdAt ? new Date(restoreData.createdAt).toLocaleString() : 'Unknown';

  return (
    <div className="p-6 space-y-5 max-w-screen-md mx-auto">
      <div className="bg-surface border border-border rounded-lg shadow-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Full Backup</h2>
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-start gap-3">
            <Shield size={16} className="text-brand mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Recovery-first backups</p>
              <p className="text-xs text-muted-foreground">
                Encrypted backups include settings, metadata, and a restore summary so you can verify what you are about to overwrite before you commit.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4">
          <div className="flex items-center gap-3">
            <Database size={15} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Complete Data Backup</p>
              <p className="text-xs text-muted-foreground">Accounts, transactions, budgets, goals, recurring items, projections, and settings</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setExportModalOpen(true)}>
            <Download size={13} />Export
          </Button>
        </div>
        <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4">
          <div className="flex items-center gap-3">
            <RotateCcw size={15} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Restore from Backup</p>
              <p className="text-xs text-muted-foreground">Review counts and metadata before anything is overwritten</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => backupRef.current?.click()}>
            <Upload size={13} />Restore
          </Button>
          <input ref={backupRef} type="file" accept=".json,application/json" className="hidden" onChange={handleBackupFile} />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">Export Data</h2>
        <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4">
          <div className="flex items-center gap-3">
            <FileText size={15} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Transactions CSV</p>
              <p className="text-xs text-muted-foreground">{transactions.length} transactions</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={exportTransactions}>
            <Download size={13} />Export
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Import Transactions</h2>
        <label
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-8 px-4 cursor-pointer transition-colors',
            csvRows ? 'border-brand bg-accent/70' : 'border-border hover:border-muted-foreground hover:bg-muted/30'
          )}
        >
          <Upload size={20} className={csvRows ? 'text-brand' : 'text-muted-foreground'} />
          <p className="text-sm font-medium text-foreground mt-2">
            {csvRows ? `${csvRows.length} rows loaded` : 'Drop a CSV file here'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{csvRows ? 'Click to replace file' : 'or click to browse'}</p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        </label>

        {csvRows && headers.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Map Columns</p>
            <div className="grid grid-cols-3 gap-3">
              <Select label="Date column" value={columnMap.date} onValueChange={value => setColumnMap(map => ({ ...map, date: value }))} options={headerOptions} />
              <Select label="Description column" value={columnMap.description} onValueChange={value => setColumnMap(map => ({ ...map, description: value }))} options={headerOptions} />
              <Select label="Amount column" value={columnMap.amount} onValueChange={value => setColumnMap(map => ({ ...map, amount: value }))} options={headerOptions} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Default Account" value={selectedAccount} onValueChange={setSelectedAccount} options={accountOptions} />
              <Select label="Default Category" value={selectedCategory} onValueChange={setSelectedCategory} options={categoryOptions} />
            </div>
            <Button size="sm" variant="secondary" onClick={handlePreview}>Preview Import</Button>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1 text-positive"><CheckCircle size={12} />{result.success} ready</span>
              {result.skipped > 0 && <span className="text-muted-foreground">{result.skipped} skipped</span>}
              {result.errors.length > 0 && <span className="flex items-center gap-1 text-negative"><AlertCircle size={12} />{result.errors.length} errors</span>}
            </div>
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                {result.errors.slice(0, 3).map((error, index) => (
                  <p key={index} className="text-xs text-red-700">Row {error.row}: {error.message}</p>
                ))}
                {result.errors.length > 3 && <p className="text-xs text-red-600">+{result.errors.length - 3} more errors</p>}
              </div>
            )}
            {result.preview.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Date</th>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Description</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.preview.slice(0, 8).map((row, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{row.date}</td>
                        <td className="px-3 py-2 text-xs text-foreground truncate max-w-[200px]">{row.description}</td>
                        <td className={cn('px-3 py-2 text-xs font-medium text-right tabular-nums', row.type === 'income' ? 'text-positive' : 'text-foreground')}>
                          {row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.preview.length > 8 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border">+{result.preview.length - 8} more rows</div>
                )}
              </div>
            )}
            <Button onClick={handleImport} loading={importing} disabled={result.success === 0}>
              Import {result.success} Transactions
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={restoreConfirmOpen}
        onOpenChange={open => {
          if (!open) {
            setRestoreConfirmOpen(false);
            setRestoreData(null);
          }
        }}
        title="Restore from Backup"
        description={
          restoreSummary
            ? `Created ${restoreCreatedAt}. Restoring ${restoreSummary.accounts} accounts, ${restoreSummary.transactions} transactions, ${restoreSummary.budgets} budgets, and ${restoreSummary.goals} goals will overwrite your current Flint data.`
            : 'This will overwrite all current Flint data with the backup file.'
        }
        confirmLabel="Restore"
        destructive
        onConfirm={() => {
          if (!restoreData) return;
          importFullBackup(restoreData.finance);
          settingsStore.restoreFromBackup(restoreData.settings);
          setRestoreConfirmOpen(false);
          setRestoreData(null);
          toast('Data restored from backup');
        }}
      />

      <Modal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        title="Export Full Backup"
        description={`Flint ${APP_VERSION} can export an encrypted recovery snapshot or a readable plaintext file.`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={cn(
                'rounded-lg border px-4 py-4 text-left transition-colors',
                exportMode === 'encrypted' ? 'border-brand bg-accent/70' : 'border-border hover:bg-muted/30'
              )}
              onClick={() => setExportMode('encrypted')}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <LockKeyhole size={14} />
                Encrypted
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Recommended. Protects the backup with a passphrase.</p>
            </button>
            <button
              type="button"
              className={cn(
                'rounded-lg border px-4 py-4 text-left transition-colors',
                exportMode === 'plaintext' ? 'border-warning bg-amber-50' : 'border-border hover:bg-muted/30'
              )}
              onClick={() => setExportMode('plaintext')}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <TriangleAlert size={14} />
                Plaintext
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Readable JSON. Use only for trusted local transfers.</p>
            </button>
          </div>

          {exportMode === 'encrypted' ? (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Backup passphrase"
                type="password"
                value={exportPassphrase}
                onChange={event => setExportPassphrase(event.target.value)}
                placeholder="At least 10 characters"
              />
              <Input
                label="Confirm passphrase"
                type="password"
                value={exportPassphraseConfirm}
                onChange={event => setExportPassphraseConfirm(event.target.value)}
                placeholder="Repeat passphrase"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              Plaintext backups include all financial data and settings in readable JSON. Anyone with the file can inspect it.
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
            Snapshot includes {financeBackupData.accounts.length} accounts, {financeBackupData.transactions.length} transactions, {financeBackupData.budgets.length} budgets, {financeBackupData.goals.length} goals, and app settings.
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setExportModalOpen(false)}>Cancel</Button>
            <Button onClick={exportFullBackup}>Export Backup</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={restorePassphraseOpen}
        onOpenChange={open => {
          setRestorePassphraseOpen(open);
          if (!open) {
            setPendingEncryptedBackup(null);
            setRestorePassphrase('');
          }
        }}
        title="Unlock Encrypted Backup"
        description="Enter the backup passphrase to inspect the restore snapshot before applying it."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Backup passphrase"
            type="password"
            value={restorePassphrase}
            onChange={event => setRestorePassphrase(event.target.value)}
            placeholder="Enter backup passphrase"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRestorePassphraseOpen(false)}>Cancel</Button>
            <Button onClick={handleEncryptedRestoreUnlock}>Unlock</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
