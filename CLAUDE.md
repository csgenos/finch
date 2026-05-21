# Flint - AI context

## Quick Reference

```bash
pnpm dev            # start web dev server
pnpm build          # tsc + vite build, must pass before commit
pnpm test           # run Vitest suite
pnpm tauri:dev      # start Tauri desktop dev app
pnpm tauri:build    # build desktop bundles locally, requires Rust + native prerequisites
```

## Stack

React 18 + TypeScript + Vite + Tauri v2 + Tailwind + Radix UI + Zustand + Recharts + date-fns v4 + PapaParse.

## Key Conventions

- `generateId()` from `src/lib/storage/localStore.ts` for all new entity IDs
- `cn()` from `src/lib/utils/cn.ts` for class merging
- `toast(message, type?)` from `src/lib/utils/toast.ts` for notifications
- `formatCurrency(amount, currency?, compact?)` from `src/lib/utils/format.ts`
- All dates stored as `YYYY-MM-DD` strings, never `Date` objects in state
- Parse date strings with `.split('-').map(Number)`, never `new Date(dateStr)` because of timezone bugs

## Release / Desktop Notes

- Desktop packaging is configured in `src-tauri/tauri.conf.json`.
- Windows release builds produce NSIS and MSI installers.
- NSIS is configured for a machine-wide install, so installed builds live under `C:\Program Files`.
- Tauri updater artifacts are enabled with `bundle.createUpdaterArtifacts: true`.
- The updater endpoint is GitHub Releases: `https://github.com/csgenos/flint/releases/latest/download/latest.json`.
- App-side updater checks live in `src/lib/desktop/updater.ts`.
- Tauri permissions live in `src-tauri/capabilities/default.json`.
- Release automation lives in `.github/workflows/release-desktop.yml`.
- Human release steps live in `docs/desktop-release.md`.
- The private updater key is local only at `src-tauri/.updater/flint-updater.key` and must never be committed.
- GitHub Actions needs `TAURI_SIGNING_PRIVATE_KEY` before auto-update release builds can be published.
- Local `pnpm tauri:build` requires `cargo`; CI installs Rust on `windows-latest`.

## State

Two Zustand stores with `persist` + AES-GCM encrypted localStorage:

- `useFinanceStore` (version 4) - accounts, transactions, budgets, categories, scenarios, paychecks, allocations, recurringExpenses, goals, netWorthSnapshots
- `useSettingsStore` - currency, locale, sidebarCollapsed, onboarding

## Storage

- `src/lib/storage/encryptedStorage.ts` - AES-256-GCM via Web Crypto. Upgrade path: `@tauri-apps/plugin-stronghold`.
- `src/lib/storage/localStore.ts` - thin adapter + `generateId()`.

## File Map

```text
src/lib/desktop/
  updater.ts           Tauri update check/install/relaunch flow

src/lib/finance/
  cashflow.ts          calculateMonthSummary, calculateNetWorth (date-safe)
  projections.ts       generateProjections (compound growth + one-time events)
  cashflowForecast.ts  buildCashflowForecast, getSafeDailySpend
  csvImport.ts         parseCsv (PapaParse), previewImport, buildTransactions
  budget.ts            budget util helpers
  healthScore.ts       calculateHealthScore
  trends.ts            getCategoryTrends - 3-month avg + anomaly detection

src/lib/taxes/
  taxEngine.ts         calculateFederalTax - uses input.year, state flat-rate via states.json

src/data/taxes/us/
  federal.json         2024 federal brackets + FICA rates
  states.json          flat income tax rates for all 50 states + DC

src/types/
  finance.ts           Account, Transaction, Budget, Category, Projection*, NetWorthSnapshot
  planning.ts          PaycheckSchedule, RecurringExpense, CashflowForecastPoint, OnboardingProfile, ImportResult
  scenario.ts          Scenario, OneTimeEvent
  tax.ts               TaxInput, TaxResult, TaxYear, FilingStatus
  goals.ts             Goal, GoalCategory
```

## Routes

| Path | Page |
|------|------|
| `/` | Dashboard |
| `/goals` | Goals |
| `/budget` | Budget |
| `/transactions` | Transactions |
| `/bills` | Bills |
| `/paychecks` | Paychecks |
| `/cashflow` | Cashflow Forecast |
| `/projections` | Projections |
| `/monte-carlo` | Monte Carlo |
| `/scenarios` | Scenarios |
| `/taxes` | Taxes |
| `/import` | Import / Export |
| `/settings` | Settings |
| `/onboarding` | Onboarding (redirect if not completed) |

## Known Limitations / Upgrade Notes

- Federal tax data: only 2024 brackets bundled. 2023/2025 fall back to 2024.
- State taxes: flat-rate approximation only, no bracket support for states with progressive brackets.
- Encryption: per-installation PBKDF2 key. For OS keychain integration, swap `encryptedStorage` for `@tauri-apps/plugin-stronghold`.
- `investmentValue` initialized at 60% of current net worth. Consider making this a user-configurable assumption.
- Debt payoff planner uses a simplified 0-interest model and does not account for compound interest.
