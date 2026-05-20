# Flint — AI context

## Quick reference

```bash
pnpm dev            # start web dev server
pnpm build          # tsc + vite build (must pass before commit)
pnpm tsc --noEmit   # type-check only
```

## Stack

React 18 + TypeScript + Vite + Tauri v2 + Tailwind + Radix UI + Zustand + Recharts + date-fns v4 + PapaParse.

## Key conventions

- `generateId()` from `src/lib/storage/localStore.ts` for all new entity IDs
- `cn()` from `src/lib/utils/cn.ts` for class merging
- `toast(message, type?)` from `src/lib/utils/toast.ts` for notifications
- `formatCurrency(amount, currency?, compact?)` from `src/lib/utils/format.ts`
- All dates stored as `YYYY-MM-DD` strings — never `Date` objects in state
- Parse date strings with `.split('-').map(Number)` — never `new Date(dateStr)` (timezone bug)

## State

Two Zustand stores with `persist` + AES-GCM encrypted localStorage:
- `useFinanceStore` — accounts, transactions, budgets, categories, scenarios, paychecks, allocations, recurringExpenses
- `useSettingsStore` — currency, locale, sidebarCollapsed, onboarding

## Storage

`src/lib/storage/encryptedStorage.ts` — AES-256-GCM via Web Crypto. Upgrade path: `@tauri-apps/plugin-stronghold`.
`src/lib/storage/localStore.ts` — thin adapter + `generateId()`.

## File map

```
src/lib/finance/
  cashflow.ts          calculateMonthSummary, calculateNetWorth (date-safe)
  projections.ts       generateProjections (compound growth, not linear)
  cashflowForecast.ts  buildCashflowForecast, getSafeDailySpend
  csvImport.ts         parseCsv (PapaParse), previewImport, buildTransactions
  budget.ts            budget util helpers
  healthScore.ts       calculateHealthScore

src/lib/taxes/
  taxEngine.ts         calculateFederalTax — uses input.year, state flat-rate via states.json

src/data/taxes/us/
  federal.json         2024 federal brackets + FICA rates
  states.json          flat income tax rates for all 50 states + DC

src/types/
  finance.ts           Account, Transaction, Budget, Category, Projection*
  planning.ts          PaycheckSchedule, RecurringExpense, CashflowForecastPoint, OnboardingProfile, ImportResult
  scenario.ts          Scenario
  tax.ts               TaxInput, TaxResult, TaxYear, FilingStatus
```

## Routes

| Path | Page |
|------|------|
| `/` | Dashboard |
| `/transactions` | Transactions |
| `/budgets` | Budget |
| `/paychecks` | Paychecks |
| `/bills` | Bills |
| `/cashflow` | Cashflow Forecast |
| `/projections` | Projections |
| `/monte-carlo` | Monte Carlo |
| `/scenarios` | Scenarios |
| `/taxes` | Taxes |
| `/import` | Import / Export |
| `/settings` | Settings |
| `/onboarding` | Onboarding (redirect if not completed) |

## Known limitations / upgrade notes

- Federal tax data: only 2024 brackets bundled. 2023/2025 fall back to 2024.
- State taxes: flat-rate approximation only (no bracket support for states with progressive brackets).
- Encryption: per-installation PBKDF2 key. For OS keychain integration, swap `encryptedStorage` for `@tauri-apps/plugin-stronghold`.
- `investmentValue` initialized at 60% of current net worth (hardcoded fraction). Consider making this a user-configurable assumption.
