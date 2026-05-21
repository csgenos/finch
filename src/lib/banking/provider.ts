export type BankingProviderId = 'plaid' | 'mx' | 'teller' | 'finicity';

export interface BankingProviderDescriptor {
  id: BankingProviderId;
  displayName: string;
  positioning: string;
  bestFor: string;
  caution: string;
}

export interface LinkedInstitutionAccount {
  providerAccountId: string;
  institutionName: string;
  name: string;
  mask?: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan';
  balance?: number;
  currency?: string;
}

export interface BankingSyncResult {
  accounts: LinkedInstitutionAccount[];
  importedTransactionCount: number;
  cursor?: string;
}

export interface BankingProvider {
  descriptor: BankingProviderDescriptor;
  exchangePublicToken?: (publicToken: string) => Promise<{ accessToken: string; itemId?: string }>;
  syncAccounts: (connectionToken: string, cursor?: string) => Promise<BankingSyncResult>;
}

export const bankingProviderCatalog: BankingProviderDescriptor[] = [
  {
    id: 'plaid',
    displayName: 'Plaid',
    positioning: 'Broadest mainstream US coverage and the easiest default for a consumer finance app.',
    bestFor: 'Fastest path to reliable account linking and transaction sync for a solo product.',
    caution: 'Costs and compliance overhead rise once real users start syncing at scale.',
  },
  {
    id: 'mx',
    displayName: 'MX',
    positioning: 'Enterprise aggregator with strong data enrichment and institutional partnerships.',
    bestFor: 'Teams selling to fintechs, banks, or larger financial workflows.',
    caution: 'Heavier sales process and enterprise integration motion than Flint needs today.',
  },
  {
    id: 'teller',
    displayName: 'Teller',
    positioning: 'Developer-friendly API with strong direct bank API story.',
    bestFor: 'Smaller institution set where engineering simplicity matters more than maximum coverage.',
    caution: 'Coverage is narrower than Plaid, which is risky for a general-purpose consumer app.',
  },
  {
    id: 'finicity',
    displayName: 'Finicity',
    positioning: 'Strong lending and verification footprint with Mastercard ownership.',
    bestFor: 'Credit decisioning, underwriting, and verification-heavy products.',
    caution: 'Not the cleanest default if Flint stays centered on day-to-day personal finance UX.',
  },
];
