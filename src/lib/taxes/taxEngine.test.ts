import { describe, expect, it } from 'vitest';
import { calculateFederalTax } from './taxEngine';

describe('calculateFederalTax', () => {
  it('uses the 2024 single filer standard deduction and bracket schedule', () => {
    const result = calculateFederalTax({
      grossIncome: 100000,
      filingStatus: 'single',
      year: 2024,
    });

    expect(result.adjustedGrossIncome).toBe(100000);
    expect(result.taxableIncome).toBe(85400);
    expect(result.federalTax).toBeCloseTo(13841, 2);
    expect(result.marginalRate).toBe(0.22);
  });

  it('applies state income tax when a supported state is selected', () => {
    const result = calculateFederalTax({
      grossIncome: 120000,
      filingStatus: 'single',
      year: 2024,
      taxResidency: 'US-CA',
      retirementContributions: 10000,
    });

    expect(result.taxableIncome).toBe(95400);
    expect(result.stateTax).toBeCloseTo(8872.2, 2);
    expect(result.totalTax).toBeCloseTo(result.federalTax + result.stateTax + result.ficaTax, 2);
  });

  it('uses the correct additional medicare threshold for joint filers', () => {
    const result = calculateFederalTax({
      grossIncome: 260000,
      filingStatus: 'married_filing_jointly',
      year: 2024,
    });

    const expectedBaseMedicare = 260000 * 0.0145;
    const expectedAdditionalMedicare = (260000 - 250000) * 0.009;

    expect(result.ficaTax).toBeCloseTo(10453.2 + expectedAdditionalMedicare, 2);
    expect(result.breakdown.find(item => item.label === 'Medicare')?.amount)
      .toBeCloseTo(expectedBaseMedicare + expectedAdditionalMedicare, 2);
  });

  it('supports European country tax estimates without US payroll tax', () => {
    const result = calculateFederalTax({
      grossIncome: 120000,
      filingStatus: 'single',
      year: 2024,
      taxResidency: 'DE',
      retirementContributions: 10000,
    });

    expect(result.taxableIncome).toBe(95400);
    expect(result.federalTax).toBe(0);
    expect(result.stateTax).toBeCloseTo(40068, 2);
    expect(result.ficaTax).toBe(0);
    expect(result.marginalRate).toBe(0.42);
  });
});
