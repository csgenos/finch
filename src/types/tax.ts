export type FilingStatus = 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household';
export type TaxYear = 2024;

export const SUPPORTED_TAX_YEAR: TaxYear = 2024;
export const SUPPORTED_TAX_YEARS: readonly TaxYear[] = [SUPPORTED_TAX_YEAR];

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface TaxBracketSet {
  year: TaxYear;
  filingStatus: FilingStatus;
  brackets: TaxBracket[];
  standardDeduction: number;
}

export interface StateTaxConfig {
  state: string;
  stateCode: string;
  rate?: number;
  brackets?: TaxBracket[];
  noIncomeTax?: boolean;
}

export interface TaxInput {
  grossIncome: number;
  filingStatus: FilingStatus;
  year: TaxYear;
  state?: string;
  taxResidency?: string;
  deductions?: number;
  retirementContributions?: number;
  hsaContributions?: number;
  capitalGains?: number;
}

export interface TaxResult {
  grossIncome: number;
  adjustedGrossIncome: number;
  taxableIncome: number;
  federalTax: number;
  stateTax: number;
  ficaTax: number;
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
  afterTaxIncome: number;
  breakdown: TaxBreakdownItem[];
}

export interface TaxBreakdownItem {
  label: string;
  amount: number;
  rate?: number;
}
