import { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, FileText, Database, RotateCcw } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
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
import { cn } from '../lib/utils/cn';

function downloadFile(content: string, filename: string, type = 'text/csv') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  const formulaSafe = /^[=+\-@\t\r]/.test(escaped) ? `'${escaped}` : escaped;
  return `"${formulaSafe}"`;
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function deriveBackupKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: toArrayBuffer(salt), iterations: 250_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptBackup(plaintext: string, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveBackupKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, new TextEncoder().encode(plaintext));
  return JSON.stringify({
    format: 'flint-encrypted-backup-v1',
    kdf: 'PBKDF2-SHA256',
    iterations: 250_000,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  });
}

async function decryptBackup(envelope: Record<string, unknown>, passphrase: string): Promise<unknown> {
  if (envelope.format !== 'flint-encrypted-backup-v1') return envelope;
  const salt = base64ToBytes(String(envelope.salt ?? ''));
  const iv = base64ToBytes(String(envelope.iv ?? ''));
  const ciphertext = base64ToBytes(String(envelope.ciphertext ?? ''));
  const key = await deriveBackupKey(passphrase, salt);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(ciphertext));
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export function ImportExport() {
  const store = useFinanceStore();
  const { transactions, accounts, categories, addTransaction, importFullBackup } = store;
  const fileRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);

  const [csvRows, setCsvRows] = useState<Record<string, string>[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<CsvColumnMap>({ date: '', description: '', amount: '' });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id ?? '');
  const [selectedCategory, setSelectedCategory] = useState(
    categories.find(c => c.type === 'expense')?.id ?? ''
  );
  const [importing, setImporting] = useState(false);
  const [restoreData, setRestoreData] = useState<unknown>(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);

  const accountOptions = accounts.map(a => ({ value: a.id, label: a.name }));
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const text = ev.target?.result as string;
      try {
        const rows = parseCsv(text);
        if (rows.length === 0) { toast('CSV appears to be empty or malformed', 'error'); return; }
        const hdrs = Object.keys(rows[0]);
        setHeaders(hdrs);
        setCsvRows(rows);
        setResult(null);
        const detected = autoDetectColumns(hdrs);
        setColumnMap({ date: detected.date ?? '', description: detected.description ?? '', amount: detected.amount ?? '' });
      } catch (error) {
        toast(error instanceof Error ? error.message : 'CSV appears to be malformed', 'error');
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
    const existingKeys = new Set(transactions.map(t =>
      `${t.accountId}|${t.date}|${t.type}|${t.amount.toFixed(2)}|${t.description.trim().toLowerCase()}`
    ));
    const imported = buildTransactions(result.preview, selectedCategory, selectedAccount)
      .filter(t => {
        const key = `${t.accountId}|${t.date}|${t.type}|${t.amount.toFixed(2)}|${t.description.trim().toLowerCase()}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });
    imported.forEach(t => addTransaction(t));
    toast(`Imported ${imported.length} transactions${imported.length !== result.success ? `, skipped ${result.success - imported.length} duplicates` : ''}`);
    setCsvRows(null); setResult(null); setImporting(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const exportTransactions = () => {
    const rows = [
      ['Date', 'Description', 'Amount', 'Type', 'Category', 'Account', 'Notes', 'Tags'],
      ...transactions.map(t => [
        t.date,
        csvCell(t.description),
        t.amount.toString(),
        t.type,
        csvCell(categories.find(c => c.id === t.categoryId)?.name ?? ''),
        csvCell(accounts.find(a => a.id === t.accountId)?.name ?? ''),
        csvCell(t.notes ?? ''),
        csvCell((t.tags ?? []).join(', ')),
      ]),
    ];
    downloadFile(rows.map(r => r.join(',')).join('\n'), `flint-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
    toast('Transactions exported');
  };

  const exportFullBackup = async () => {
    const state = {
      accounts: store.accounts,
      transactions: store.transactions,
      budgets: store.budgets,
      categories: store.categories,
      scenarios: store.scenarios,
      assumptions: store.assumptions,
      paychecks: store.paychecks,
      allocations: store.allocations,
      recurringExpenses: store.recurringExpenses,
      goals: store.goals,
      netWorthSnapshots: store.netWorthSnapshots,
    };
    const passphrase = prompt('Enter a backup passphrase. Leave blank to export plaintext JSON.');
    if (passphrase === null) return;
    if (passphrase) {
      const encrypted = await encryptBackup(JSON.stringify(state), passphrase);
      downloadFile(encrypted, `flint-backup-encrypted-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
      toast('Encrypted full backup exported');
      return;
    }
    downloadFile(JSON.stringify(state, null, 2), `flint-backup-plaintext-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    toast('Plaintext full backup exported', 'info');
  };

  const handleBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as Record<string, unknown>;
        const data = parsed.format === 'flint-encrypted-backup-v1'
          ? await decryptBackup(parsed, prompt('Enter the backup passphrase') ?? '')
          : parsed;
        setRestoreData(data);
        setRestoreConfirmOpen(true);
      } catch {
        toast('Invalid backup file — could not parse JSON', 'error');
      }
    };
    reader.readAsText(file);
    if (backupRef.current) backupRef.current.value = '';
  };

  const headerOptions = headers.map(h => ({ value: h, label: h }));

  return (
    <div className="p-6 space-y-5 max-w-screen-md mx-auto">
      {/* Full Backup & Restore */}
      <div className="bg-surface border border-border rounded-lg shadow-card p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Full Backup</h2>
        <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4">
          <div className="flex items-center gap-3">
            <Database size={15} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Complete Data Backup</p>
              <p className="text-xs text-muted-foreground">All accounts, transactions, budgets, goals &amp; settings</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={exportFullBackup}>
            <Download size={13} />Export
          </Button>
        </div>
        <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4">
          <div className="flex items-center gap-3">
            <RotateCcw size={15} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Restore from Backup</p>
              <p className="text-xs text-muted-foreground">Overwrites all current data with the backup file</p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => backupRef.current?.click()}>
            <Upload size={13} />Restore
          </Button>
          <input ref={backupRef} type="file" accept=".json,application/json" className="hidden" onChange={handleBackupFile} />
        </div>
      </div>

      {/* CSV Export */}
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

      {/* CSV Import */}
      <div className="bg-surface border border-border rounded-lg shadow-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Import Transactions</h2>
        <label
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-8 px-4 cursor-pointer transition-colors',
            csvRows ? 'border-brand bg-indigo-50/30' : 'border-border hover:border-muted-foreground hover:bg-muted/30'
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
              <Select label="Date column" value={columnMap.date} onValueChange={v => setColumnMap(m => ({ ...m, date: v }))} options={headerOptions} />
              <Select label="Description column" value={columnMap.description} onValueChange={v => setColumnMap(m => ({ ...m, description: v }))} options={headerOptions} />
              <Select label="Amount column" value={columnMap.amount} onValueChange={v => setColumnMap(m => ({ ...m, amount: v }))} options={headerOptions} />
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
                {result.errors.slice(0, 3).map((err, i) => (
                  <p key={i} className="text-xs text-red-700">Row {err.row}: {err.message}</p>
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
                    {result.preview.slice(0, 8).map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{row.date}</td>
                        <td className="px-3 py-2 text-xs text-foreground truncate max-w-[200px]">{row.description}</td>
                        <td className={cn('px-3 py-2 text-xs font-medium text-right tabular-nums', row.type === 'income' ? 'text-positive' : 'text-foreground')}>
                          {row.type === 'income' ? '+' : '−'}{formatCurrency(row.amount)}
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
        onOpenChange={open => { if (!open) { setRestoreConfirmOpen(false); setRestoreData(null); } }}
        title="Restore from Backup"
        description="This will overwrite ALL current data with the backup file. This action cannot be undone."
        confirmLabel="Restore"
        destructive
        onConfirm={() => {
          importFullBackup(restoreData);
          setRestoreConfirmOpen(false);
          setRestoreData(null);
          toast('Data restored from backup');
        }}
      />
    </div>
  );
}
