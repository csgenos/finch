# Flint

A premium personal finance desktop app for Windows, macOS, and Linux. Built with React, TypeScript, Tauri, and Tailwind CSS. Fully offline — your data never leaves your machine.

## Features

- **Dashboard** — net worth, cash flow, savings rate, safe-to-spend, spending alerts, and upcoming bills at a glance
- **Goals** — savings goal tracking with progress bars, category badges, projected completion dates, and a debt-payoff planner (snowball / avalanche)
- **Transactions** — full CRUD with categories, notes, tags, and bulk recategorize / delete
- **Budgets** — monthly budget tracking with category rollup and spending trend analysis (3-month avg + anomaly detection)
- **Paychecks** — paycheck schedule, allocation breakdown, safe daily spend
- **Bills & Recurring** — recurring expense tracker with due-date alerts, autopay flags, and subscription analytics
- **Cashflow Forecast** — 30/60/90-day projected balance chart
- **Projections** — long-range net worth projection with adjustable assumptions
- **Monte Carlo** — retirement success probability simulation (Web Worker)
- **Scenarios** — side-by-side financial scenario comparison with one-time events (buy house, inheritance, etc.)
- **Tax Estimator** — federal + state tax calculation with FICA
- **Import / Export** — CSV import with column mapping, CSV export, full JSON backup and restore
- **Global Search** — ⌘K overlay searches across transactions, goals, and bills
- **Keyboard shortcuts** — ⌘K search, ⌘B toggle sidebar, ⌘N new transaction
- **Onboarding** — 5-step setup wizard for new users

## Tech stack

| Layer | Library |
|-------|---------|
| UI | React 18 + TypeScript |
| Build | Vite 6 |
| Desktop | Tauri v2 |
| Styling | Tailwind CSS + Radix UI primitives |
| State | Zustand v5 (encrypted, persisted) |
| Data fetching | TanStack Query v5 |
| Charts | Recharts |
| Dates | date-fns v4 |
| CSV | PapaParse |

## Security

All local state is persisted with AES-256-GCM encryption (Web Crypto API) using a non-extractable per-installation key stored in IndexedDB. Data stored on disk appears as opaque ciphertext rather than plaintext JSON, protecting against casual inspection. Production builds targeting high-assurance environments should migrate to `@tauri-apps/plugin-stronghold` for OS-keychain-backed storage.

## Development

See [INSTALL.md](./INSTALL.md) for setup instructions.

```bash
pnpm dev          # web dev server (localhost:5173)
pnpm tauri:dev    # Tauri desktop dev window
pnpm build        # production web build
pnpm tauri:build  # production desktop binary
```

## Project layout

```
src/
  app/          # router, App root
  components/   # shared UI (ui/, cards/, charts/, forms/, layout/)
  data/         # sample data, tax tables
  lib/
    finance/    # cashflow, projections, budgets, CSV import, cashflow forecast
    simulations/# Monte Carlo worker
    storage/    # localStorage adapter + AES-GCM encrypted storage
    taxes/      # federal + state tax engine
    utils/      # cn, format, dates, toast
  pages/        # one file per route
  store/        # Zustand stores (finance, settings)
  types/        # shared TypeScript types
src-tauri/      # Tauri v2 Rust shell
```
