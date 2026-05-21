# Flint

A premium personal finance app for web and desktop. Built with React, TypeScript, Tauri, and Tailwind CSS. Fully offline - your data never leaves your machine.

## Features

- **Dashboard** - net worth, cash flow, savings rate, safe-to-spend, spending alerts, and upcoming bills at a glance
- **Goals** - savings goal tracking with progress bars, category badges, projected completion dates, and a debt-payoff planner
- **Transactions** - full CRUD with categories, notes, tags, and bulk recategorize / delete
- **Budgets** - monthly budget tracking with category rollup and spending trend analysis
- **Paychecks** - paycheck schedule, allocation breakdown, safe daily spend
- **Bills & Recurring** - recurring expense tracker with due-date alerts, autopay flags, and subscription analytics
- **Cashflow Forecast** - 30/60/90-day projected balance chart
- **Projections** - long-range net worth projection with adjustable assumptions
- **Monte Carlo** - retirement success probability simulation using a Web Worker
- **Scenarios** - side-by-side financial scenario comparison with one-time events
- **Tax Estimator** - federal + state tax calculation with FICA
- **Import / Export** - CSV import with column mapping, encrypted full backups with restore summaries, CSV export, and full JSON backup and restore
- **Global Search** - command palette searches across transactions, goals, and bills
- **Keyboard shortcuts** - search, toggle sidebar, and create new records
- **Onboarding** - setup wizard for new users
- **Desktop releases** - Windows stable and beta channels, NSIS/MSI installers, and signed Tauri updater artifacts

## Tech Stack

| Layer | Library |
|-------|---------|
| UI | React 18 + TypeScript |
| Build | Vite 6 |
| Desktop | Tauri v2 |
| Styling | Tailwind CSS + Radix UI primitives |
| State | Zustand v5 encrypted persisted state |
| Data fetching | TanStack Query v5 |
| Charts | Recharts |
| Dates | date-fns v4 |
| CSV | PapaParse |

## Security

Web builds persist with AES-256-GCM using the Web Crypto API and a non-extractable per-installation key stored in IndexedDB. Desktop builds now persist state through a Tauri Stronghold snapshot so the main finance payload no longer lives in browser localStorage.

## Development

See [INSTALL.md](./INSTALL.md) for setup instructions.

```bash
pnpm dev          # web dev server at localhost:5173
pnpm tauri:dev    # Tauri desktop dev window
pnpm test         # Vitest suite
pnpm build        # production web build
pnpm tauri:build  # production desktop bundle, requires Rust + native prerequisites
```

## Desktop Releases

Flint is configured for Windows desktop releases through GitHub Actions:

- Release workflow: [`.github/workflows/release-desktop.yml`](./.github/workflows/release-desktop.yml)
- Release checklist: [`docs/desktop-release.md`](./docs/desktop-release.md)
- Installer QA checklist: [`docs/installer-qa.md`](./docs/installer-qa.md)
- Bank connectivity recommendation: [`docs/bank-connectivity-decision.md`](./docs/bank-connectivity-decision.md)
- Tauri config: [`src-tauri/tauri.conf.json`](./src-tauri/tauri.conf.json)

Production desktop releases build NSIS and MSI installers. The stable channel installs machine-wide under `C:\Program Files`. The beta channel ships as a side-by-side `Flint Beta` build with its own updater feed so pre-release testing does not touch the stable install.

Installed desktop builds check GitHub Releases for their channel-specific updater JSON, verify the signed updater artifact, install the update, and restart the app.

Before publishing releases, add the private updater key to the GitHub Actions secret `TAURI_SIGNING_PRIVATE_KEY`. For signed Windows installers, also add the certificate secrets described in [`docs/desktop-release.md`](./docs/desktop-release.md). The local updater private key lives at `src-tauri/.updater/flint-updater.key` and is intentionally ignored by git.

## Project Layout

```text
src/
  app/          # router, App root
  components/   # shared UI (ui/, cards/, charts/, forms/, layout/)
  data/         # sample data, tax tables
  lib/
    desktop/    # Tauri desktop helpers, including updater checks
    finance/    # cashflow, projections, budgets, CSV import, cashflow forecast
    simulations/# Monte Carlo worker
    storage/    # browser crypto storage, desktop stronghold storage, backup helpers
    taxes/      # federal + state tax engine
    utils/      # cn, format, dates, toast
  pages/        # one file per route
  store/        # Zustand stores (finance, settings)
  types/        # shared TypeScript types
src-tauri/      # Tauri v2 Rust shell, icons, permissions, updater config
```
