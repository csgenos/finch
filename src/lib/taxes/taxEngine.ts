import { TaxInput, TaxResult, TaxBreakdownItem, SUPPORTED_TAX_YEARS, TaxYear } from '../../types/tax';
import federalData from '../../data/taxes/us/federal.json';
import { getTaxJurisdiction, inferTaxResidency } from '../../data/taxes/jurisdictions';

interface Bracket { min: number; max: number | null; rate: number; }
interface FilingStatusData { standardDeduction: number; brackets: Bracket[]; }
interface FederalYearData {
  brackets: Record<string, FilingStatusData>;
  ficaRates: {
    socialSecurity: { rate: number; wageBase: number };
    medicare: { rate: number; additionalRate: number; additionalThreshold: number };
  };
}

const federalDataByYear: Record<TaxYear, FederalYearData> = {
  2024: federalData as FederalYearData,
  2026: {
    brackets: {
      single: {
        standardDeduction: 16100,
        brackets: [
          { min: 0, max: 12400, rate: 0.10 },
          { min: 12400, max: 50400, rate: 0.12 },
          { min: 50400, max: 105700, rate: 0.22 },
          { min: 105700, max: 201775, rate: 0.24 },
          { min: 201775, max: 256225, rate: 0.32 },
          { min: 256225, max: 640600, rate: 0.35 },
          { min: 640600, max: null, rate: 0.37 },
        ],
      },
      married_filing_jointly: {
        standardDeduction: 32200,
        brackets: [
          { min: 0, max: 24800, rate: 0.10 },
          { min: 24800, max: 100800, rate: 0.12 },
          { min: 100800, max: 211400, rate: 0.22 },
          { min: 211400, max: 403550, rate: 0.24 },
          { min: 403550, max: 512450, rate: 0.32 },
          { min: 512450, max: 768700, rate: 0.35 },
          { min: 768700, max: null, rate: 0.37 },
        ],
      },
      married_filing_separately: {
        standardDeduction: 16100,
        brackets: [
          { min: 0, max: 12400, rate: 0.10 },
          { min: 12400, max: 50400, rate: 0.12 },
          { min: 50400, max: 105700, rate: 0.22 },
          { min: 105700, max: 201775, rate: 0.24 },
          { min: 201775, max: 256225, rate: 0.32 },
          { min: 256225, max: 384350, rate: 0.35 },
          { min: 384350, max: null, rate: 0.37 },
        ],
      },
      head_of_household: {
        standardDeduction: 24150,
        brackets: [
          { min: 0, max: 17700, rate: 0.10 },
          { min: 17700, max: 67250, rate: 0.12 },
          { min: 67250, max: 105700, rate: 0.22 },
          { min: 105700, max: 201775, rate: 0.24 },
          { min: 201775, max: 256200, rate: 0.32 },
          { min: 256200, max: 640600, rate: 0.35 },
          { min: 640600, max: null, rate: 0.37 },
        ],
      },
    },
    ficaRates: {
      socialSecurity: { rate: 0.062, wageBase: 184500 },
      medicare: { rate: 0.0145, additionalRate: 0.009, additionalThreshold: 200000 },
    },
  },
};

const additionalMedicareThresholds = {
  single: 200000,
  head_of_household: 200000,
  married_filing_jointly: 250000,
  married_filing_separately: 125000,
} as const;

function calculateBracketTax(taxableIncome: number, brackets: Bracket[]): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const upper = bracket.max ?? Infinity;
    const taxableInBracket = Math.min(taxableIncome, upper) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }
  return tax;
}

function getMarginalRate(taxableIncome: number, brackets: Bracket[]): number {
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (taxableIncome >= brackets[i].min) return brackets[i].rate;
  }
  return brackets[0].rate;
}

export function calculateFederalTax(input: TaxInput): TaxResult {
  if (!SUPPORTED_TAX_YEARS.includes(input.year)) {
    throw new Error(`Unsupported tax year: ${input.year}. Supported years: ${SUPPORTED_TAX_YEARS.join(', ')}.`);
  }

  const yearData = federalDataByYear[input.year];
  const statusKey = input.filingStatus as keyof typeof yearData.brackets;
  const statusData = yearData.brackets[statusKey] ?? yearData.brackets.single;
  const taxResidency = input.taxResidency ?? inferTaxResidency(undefined, input.state);
  const jurisdiction = getTaxJurisdiction(taxResidency);
  const isUS = jurisdiction?.type === 'us_state';

  const adjustments = (input.retirementContributions ?? 0) + (input.hsaContributions ?? 0);
  const agi = input.grossIncome - adjustments;
  const deductions = input.deductions ?? (isUS ? statusData.standardDeduction : 0);
  const taxableIncome = Math.max(0, agi - deductions);

  const federalTax = isUS
    ? calculateBracketTax(taxableIncome, statusData.brackets as Bracket[])
    : 0;
  const marginalRate = isUS
    ? getMarginalRate(taxableIncome, statusData.brackets as Bracket[])
    : (jurisdiction?.rate ?? 0);

  const { socialSecurity, medicare } = yearData.ficaRates;
  const medicareThreshold = additionalMedicareThresholds[input.filingStatus] ?? medicare.additionalThreshold;
  const ssTax = Math.min(input.grossIncome, socialSecurity.wageBase) * socialSecurity.rate;
  const medicareTax =
    input.grossIncome * medicare.rate +
    Math.max(0, input.grossIncome - medicareThreshold) * medicare.additionalRate;
  const ficaTax = isUS ? ssTax + medicareTax : 0;

  const stateTax = jurisdiction?.noIncomeTax
    ? 0
    : jurisdiction?.brackets
      ? calculateBracketTax(taxableIncome, jurisdiction.brackets)
      : taxableIncome * (jurisdiction?.rate ?? 0);

  const totalTax = federalTax + stateTax + ficaTax;
  const effectiveRate = input.grossIncome > 0 ? totalTax / input.grossIncome : 0;
  const afterTaxIncome = input.grossIncome - totalTax;

  const breakdown: TaxBreakdownItem[] = [
    ...(isUS
      ? [
          { label: 'Federal Income Tax', amount: federalTax, rate: marginalRate },
          { label: 'Social Security', amount: ssTax, rate: socialSecurity.rate },
          { label: 'Medicare', amount: medicareTax, rate: medicare.rate },
        ]
      : []),
    {
      label:
        jurisdiction?.type === 'us_state'
          ? `${jurisdiction.name} Income Tax`
          : jurisdiction
            ? `${jurisdiction.name} Estimated National Income Tax`
            : 'Jurisdiction Income Tax',
      amount: stateTax,
      rate: jurisdiction?.rate,
    },
  ];

  return {
    grossIncome: input.grossIncome,
    adjustedGrossIncome: agi,
    taxableIncome,
    federalTax,
    stateTax,
    ficaTax,
    totalTax,
    effectiveRate,
    marginalRate,
    afterTaxIncome,
    breakdown,
  };
}
