# Bank Connectivity Decision

## Recommendation

Choose `Plaid` first.

Flint is a consumer personal finance app that needs the highest chance of "my bank works" on day one. Plaid is the best fit for that first production pass because it offers the broadest mainstream US account-linking footprint, familiar Link UX, and the least surprising integration path for transactions and balances.

## Provider Decision

`Plaid`

- Best default for Flint today.
- Broad consumer-bank coverage.
- Large ecosystem, docs, examples, and hiring pool.
- Easiest path to prove real bank sync with the fewest product compromises.

`MX`

- Strong enterprise option.
- Best if Flint pivots toward bank partnerships or enterprise-grade data enrichment.
- Heavier go-to-market and implementation motion than this app needs right now.

`Teller`

- Very developer-friendly.
- Best if we want a smaller but cleaner direct-API integration surface.
- Coverage tradeoff makes it risky for a general audience finance app.

`Finicity`

- Strong for lending and verification workflows.
- Better fit for underwriting, cash-flow analysis, or verification products than for Flint's current daily-use budgeting focus.

## Integration Shape

Keep provider-specific logic behind [provider.ts](/C:/Users/palmj/Documents/Codex/2026-05-20/github-plugin-github-openai-curated-coderabbit/flint/src/lib/banking/provider.ts).

That gives us one seam for:

- Link token creation
- Public token exchange
- Account sync
- Cursor-based transaction sync
- Provider-specific retries and rate-limit handling

## What To Build Next

1. Server-side token exchange service.
2. Provider webhook receiver for transaction updates.
3. Background sync job with cursors.
4. Reconciliation layer that maps provider accounts into Flint accounts.
5. Consent, disclosure, and disconnect UX.

## Reference Links

- Plaid Transactions: [Plaid Docs](https://plaid.com/docs/transactions/)
- MX Connectivity: [MX Docs](https://docs.mx.com/products/connectivity/overview/)
- Teller Transactions: [Teller Docs](https://teller.io/docs/api/account/transactions)
- Finicity Open Banking: [Finicity](https://www.finicity.com/open-banking/)
