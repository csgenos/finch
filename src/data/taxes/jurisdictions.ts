export interface TaxJurisdiction {
  code: string;
  name: string;
  type: 'us_state' | 'europe_country';
  countryCode: string;
  countryName: string;
  rate: number;
  brackets?: { min: number; max: number | null; rate: number }[];
  noIncomeTax?: boolean;
}

const usStates: TaxJurisdiction[] = [
  { code: 'US-AL', name: 'Alabama', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.05 },
  { code: 'US-AK', name: 'Alaska', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0, noIncomeTax: true },
  { code: 'US-AZ', name: 'Arizona', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.025 },
  { code: 'US-AR', name: 'Arkansas', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.055 },
  { code: 'US-CA', name: 'California', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.093, brackets: [
    { min: 0, max: 10756, rate: 0.01 },
    { min: 10756, max: 25499, rate: 0.02 },
    { min: 25499, max: 40245, rate: 0.04 },
    { min: 40245, max: 55866, rate: 0.06 },
    { min: 55866, max: 70606, rate: 0.08 },
    { min: 70606, max: 360659, rate: 0.093 },
    { min: 360659, max: 432787, rate: 0.103 },
    { min: 432787, max: 721314, rate: 0.113 },
    { min: 721314, max: null, rate: 0.123 },
  ] },
  { code: 'US-CO', name: 'Colorado', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.044 },
  { code: 'US-CT', name: 'Connecticut', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0699 },
  { code: 'US-DE', name: 'Delaware', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.066 },
  { code: 'US-FL', name: 'Florida', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0, noIncomeTax: true },
  { code: 'US-GA', name: 'Georgia', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.055 },
  { code: 'US-HI', name: 'Hawaii', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.11 },
  { code: 'US-ID', name: 'Idaho', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.058 },
  { code: 'US-IL', name: 'Illinois', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0495 },
  { code: 'US-IN', name: 'Indiana', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0315 },
  { code: 'US-IA', name: 'Iowa', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.06 },
  { code: 'US-KS', name: 'Kansas', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.057 },
  { code: 'US-KY', name: 'Kentucky', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.045 },
  { code: 'US-LA', name: 'Louisiana', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0425 },
  { code: 'US-ME', name: 'Maine', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0715 },
  { code: 'US-MD', name: 'Maryland', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0575 },
  { code: 'US-MA', name: 'Massachusetts', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.05 },
  { code: 'US-MI', name: 'Michigan', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0425 },
  { code: 'US-MN', name: 'Minnesota', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0985 },
  { code: 'US-MS', name: 'Mississippi', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.05 },
  { code: 'US-MO', name: 'Missouri', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.048 },
  { code: 'US-MT', name: 'Montana', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.069 },
  { code: 'US-NE', name: 'Nebraska', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0664 },
  { code: 'US-NV', name: 'Nevada', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0, noIncomeTax: true },
  { code: 'US-NH', name: 'New Hampshire', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0, noIncomeTax: true },
  { code: 'US-NJ', name: 'New Jersey', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0637 },
  { code: 'US-NM', name: 'New Mexico', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.059 },
  { code: 'US-NY', name: 'New York', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0685, brackets: [
    { min: 0, max: 8500, rate: 0.04 },
    { min: 8500, max: 11700, rate: 0.045 },
    { min: 11700, max: 13900, rate: 0.0525 },
    { min: 13900, max: 80650, rate: 0.055 },
    { min: 80650, max: 215400, rate: 0.06 },
    { min: 215400, max: 1077550, rate: 0.0685 },
    { min: 1077550, max: 5000000, rate: 0.0965 },
    { min: 5000000, max: 25000000, rate: 0.103 },
    { min: 25000000, max: null, rate: 0.109 },
  ] },
  { code: 'US-NC', name: 'North Carolina', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0475 },
  { code: 'US-ND', name: 'North Dakota', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.029 },
  { code: 'US-OH', name: 'Ohio', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.04 },
  { code: 'US-OK', name: 'Oklahoma', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0475 },
  { code: 'US-OR', name: 'Oregon', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.099 },
  { code: 'US-PA', name: 'Pennsylvania', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0307 },
  { code: 'US-RI', name: 'Rhode Island', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0599 },
  { code: 'US-SC', name: 'South Carolina', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.064 },
  { code: 'US-SD', name: 'South Dakota', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0, noIncomeTax: true },
  { code: 'US-TN', name: 'Tennessee', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0, noIncomeTax: true },
  { code: 'US-TX', name: 'Texas', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0, noIncomeTax: true },
  { code: 'US-UT', name: 'Utah', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0485 },
  { code: 'US-VT', name: 'Vermont', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0875 },
  { code: 'US-VA', name: 'Virginia', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0575 },
  { code: 'US-WA', name: 'Washington', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0, noIncomeTax: true },
  { code: 'US-WV', name: 'West Virginia', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.065 },
  { code: 'US-WI', name: 'Wisconsin', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0535 },
  { code: 'US-WY', name: 'Wyoming', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0, noIncomeTax: true },
  { code: 'US-DC', name: 'District of Columbia', type: 'us_state', countryCode: 'US', countryName: 'United States', rate: 0.0895 },
];

const europeanCountries: TaxJurisdiction[] = [
  { code: 'AL', name: 'Albania', type: 'europe_country', countryCode: 'AL', countryName: 'Albania', rate: 0.23 },
  { code: 'AD', name: 'Andorra', type: 'europe_country', countryCode: 'AD', countryName: 'Andorra', rate: 0.1 },
  { code: 'AT', name: 'Austria', type: 'europe_country', countryCode: 'AT', countryName: 'Austria', rate: 0.42 },
  { code: 'BY', name: 'Belarus', type: 'europe_country', countryCode: 'BY', countryName: 'Belarus', rate: 0.13 },
  { code: 'BE', name: 'Belgium', type: 'europe_country', countryCode: 'BE', countryName: 'Belgium', rate: 0.5 },
  { code: 'BA', name: 'Bosnia and Herzegovina', type: 'europe_country', countryCode: 'BA', countryName: 'Bosnia and Herzegovina', rate: 0.1 },
  { code: 'BG', name: 'Bulgaria', type: 'europe_country', countryCode: 'BG', countryName: 'Bulgaria', rate: 0.1 },
  { code: 'HR', name: 'Croatia', type: 'europe_country', countryCode: 'HR', countryName: 'Croatia', rate: 0.3 },
  { code: 'CY', name: 'Cyprus', type: 'europe_country', countryCode: 'CY', countryName: 'Cyprus', rate: 0.35 },
  { code: 'CZ', name: 'Czech Republic', type: 'europe_country', countryCode: 'CZ', countryName: 'Czech Republic', rate: 0.23 },
  { code: 'DK', name: 'Denmark', type: 'europe_country', countryCode: 'DK', countryName: 'Denmark', rate: 0.52 },
  { code: 'EE', name: 'Estonia', type: 'europe_country', countryCode: 'EE', countryName: 'Estonia', rate: 0.2 },
  { code: 'FI', name: 'Finland', type: 'europe_country', countryCode: 'FI', countryName: 'Finland', rate: 0.44 },
  { code: 'FR', name: 'France', type: 'europe_country', countryCode: 'FR', countryName: 'France', rate: 0.45 },
  { code: 'DE', name: 'Germany', type: 'europe_country', countryCode: 'DE', countryName: 'Germany', rate: 0.42 },
  { code: 'GR', name: 'Greece', type: 'europe_country', countryCode: 'GR', countryName: 'Greece', rate: 0.44 },
  { code: 'HU', name: 'Hungary', type: 'europe_country', countryCode: 'HU', countryName: 'Hungary', rate: 0.15 },
  { code: 'IS', name: 'Iceland', type: 'europe_country', countryCode: 'IS', countryName: 'Iceland', rate: 0.31 },
  { code: 'IE', name: 'Ireland', type: 'europe_country', countryCode: 'IE', countryName: 'Ireland', rate: 0.4 },
  { code: 'IT', name: 'Italy', type: 'europe_country', countryCode: 'IT', countryName: 'Italy', rate: 0.43 },
  { code: 'XK', name: 'Kosovo', type: 'europe_country', countryCode: 'XK', countryName: 'Kosovo', rate: 0.1 },
  { code: 'LV', name: 'Latvia', type: 'europe_country', countryCode: 'LV', countryName: 'Latvia', rate: 0.31 },
  { code: 'LI', name: 'Liechtenstein', type: 'europe_country', countryCode: 'LI', countryName: 'Liechtenstein', rate: 0.22 },
  { code: 'LT', name: 'Lithuania', type: 'europe_country', countryCode: 'LT', countryName: 'Lithuania', rate: 0.2 },
  { code: 'LU', name: 'Luxembourg', type: 'europe_country', countryCode: 'LU', countryName: 'Luxembourg', rate: 0.42 },
  { code: 'MT', name: 'Malta', type: 'europe_country', countryCode: 'MT', countryName: 'Malta', rate: 0.35 },
  { code: 'MD', name: 'Moldova', type: 'europe_country', countryCode: 'MD', countryName: 'Moldova', rate: 0.12 },
  { code: 'MC', name: 'Monaco', type: 'europe_country', countryCode: 'MC', countryName: 'Monaco', rate: 0, noIncomeTax: true },
  { code: 'ME', name: 'Montenegro', type: 'europe_country', countryCode: 'ME', countryName: 'Montenegro', rate: 0.15 },
  { code: 'NL', name: 'Netherlands', type: 'europe_country', countryCode: 'NL', countryName: 'Netherlands', rate: 0.495 },
  { code: 'MK', name: 'North Macedonia', type: 'europe_country', countryCode: 'MK', countryName: 'North Macedonia', rate: 0.18 },
  { code: 'NO', name: 'Norway', type: 'europe_country', countryCode: 'NO', countryName: 'Norway', rate: 0.39 },
  { code: 'PL', name: 'Poland', type: 'europe_country', countryCode: 'PL', countryName: 'Poland', rate: 0.32 },
  { code: 'PT', name: 'Portugal', type: 'europe_country', countryCode: 'PT', countryName: 'Portugal', rate: 0.48 },
  { code: 'RO', name: 'Romania', type: 'europe_country', countryCode: 'RO', countryName: 'Romania', rate: 0.1 },
  { code: 'RU', name: 'Russia', type: 'europe_country', countryCode: 'RU', countryName: 'Russia', rate: 0.15 },
  { code: 'SM', name: 'San Marino', type: 'europe_country', countryCode: 'SM', countryName: 'San Marino', rate: 0.35 },
  { code: 'RS', name: 'Serbia', type: 'europe_country', countryCode: 'RS', countryName: 'Serbia', rate: 0.15 },
  { code: 'SK', name: 'Slovakia', type: 'europe_country', countryCode: 'SK', countryName: 'Slovakia', rate: 0.25 },
  { code: 'SI', name: 'Slovenia', type: 'europe_country', countryCode: 'SI', countryName: 'Slovenia', rate: 0.5 },
  { code: 'ES', name: 'Spain', type: 'europe_country', countryCode: 'ES', countryName: 'Spain', rate: 0.47 },
  { code: 'SE', name: 'Sweden', type: 'europe_country', countryCode: 'SE', countryName: 'Sweden', rate: 0.52 },
  { code: 'CH', name: 'Switzerland', type: 'europe_country', countryCode: 'CH', countryName: 'Switzerland', rate: 0.4 },
  { code: 'UA', name: 'Ukraine', type: 'europe_country', countryCode: 'UA', countryName: 'Ukraine', rate: 0.195 },
  { code: 'GB', name: 'United Kingdom', type: 'europe_country', countryCode: 'GB', countryName: 'United Kingdom', rate: 0.45 },
  { code: 'VA', name: 'Vatican City', type: 'europe_country', countryCode: 'VA', countryName: 'Vatican City', rate: 0 },
];

export const taxJurisdictions = [...usStates, ...europeanCountries].sort((a, b) =>
  a.name.localeCompare(b.name),
);

const supportedJurisdictionCodes = new Set(taxJurisdictions.map((item) => item.code));

export function getTaxJurisdiction(code?: string | null): TaxJurisdiction | undefined {
  if (!code) return undefined;
  return taxJurisdictions.find((item) => item.code === code);
}

export function getJurisdictionLabel(code?: string | null): string {
  return getTaxJurisdiction(code)?.name ?? 'Select a tax residence';
}

export function inferTaxResidency(country?: string | null, state?: string | null): string {
  if (country === 'US') {
    if (!state) return 'US-CA';
    if (state.startsWith('US-')) return state;
    return `US-${state}`;
  }

  if (country) return supportedJurisdictionCodes.has(country) ? country : '';
  if (state?.startsWith('US-')) return state;
  if (state && state.length === 2) return `US-${state}`;
  return 'US-CA';
}

export function getCountryFromTaxResidency(code: string): string {
  return code.startsWith('US-') ? 'US' : code;
}

export function getStateFromTaxResidency(code: string): string | undefined {
  if (!code.startsWith('US-')) return undefined;
  return code.slice(3);
}
