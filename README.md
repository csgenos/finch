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
- **Import / Export** - CSV import with column mapping, CSV export, full JSON backup and restore
- **Global Search** - command palette searches across transactions, goals, and bills
- **Keyboard shortcuts** - search, toggle sidebar, and create new records
- **Onboarding** - setup wizard for new users
- **Desktop releases** - Windows NSIS/MSI installer with signed Tauri updater artifacts

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

All local state is persisted with AES-256-GCM encryption using the Web Crypto API and a non-extractable per-installation key stored in IndexedDB. Data stored on disk appears as opaque ciphertext rather than plaintext JSON, protecting against casual inspection.

Production builds targeting high-assurance environments should migrate to `@tauri-apps/plugin-stronghold` for OS-keychain-backed storage.

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
- Tauri config: [`src-tauri/tauri.conf.json`](./src-tauri/tauri.conf.json)

Production desktop releases build NSIS and MSI installers. The NSIS installer is configured for a machine-wide Windows install, so Flint appears under `C:\Program Files` after the user approves the admin prompt.

Installed desktop builds check GitHub Releases for `latest.json`, verify the signed updater artifact, install the update, and restart the app.

Before publishing releases, add the private updater key to the GitHub Actions secret `TAURI_SIGNING_PRIVATE_KEY`. The local private key lives at `src-tauri/.updater/flint-updater.key` and is intentionally ignored by git.

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
    storage/    # localStorage adapter + AES-GCM encrypted storage
    taxes/      # federal + state tax engine
    utils/      # cn, format, dates, toast
  pages/        # one file per route
  store/        # Zustand stores (finance, settings)
  types/        # shared TypeScript types
src-tauri/      # Tauri v2 Rust shell, icons, permissions, updater config
```
