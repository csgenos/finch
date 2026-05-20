import { TaxInput, TaxResult, TaxBreakdownItem, SUPPORTED_TAX_YEAR } from '../../types/tax';
import federalData from '../../data/taxes/us/federal.json';
import { getTaxJurisdiction, inferTaxResidency } from '../../data/taxes/jurisdictions';

interface Bracket { min: number; max: number | null; rate: number; }

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
  if (input.year !== SUPPORTED_TAX_YEAR) {
    throw new Error(`Unsupported tax year: ${input.year}. Supported year: ${SUPPORTED_TAX_YEAR}.`);
  }

  const yearData = federalData;
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

  const stateTax = jurisdiction?.noIncomeTax ? 0 : taxableIncome * (jurisdiction?.rate ?? 0);
  const totalTax = federalTax + stateTax + ficaTax;
  const effectiveRate = input.grossIncome > 0 ? totalTax / input.grossIncome : 0;
  const afterTaxIncome = input.grossIncome - totalTax;

  const breakdown: TaxBreakdownItem[] = [
    ...(isUS
      ? [
          { label: 'Federal Income Tax', amount: federalTax, rate: marginalRate },
        ]
      : []),
    ...(isUS
      ? [
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
