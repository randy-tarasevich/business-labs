// Payroll tax numbers used by the Paycheck Lab. Update once a year; the tool shows TAX_YEAR on the page.
//
// Sources (checked October 2026):
// - Federal brackets and standard deduction: IRS 2026 inflation adjustments, reported by CPA Practice Advisor
//   https://www.cpapracticeadvisor.com/2025/10/09/irs-adjusts-tax-brackets-standard-deduction-for-2026/170661/
// - Social Security wage base and FICA rates: Journal of Accountancy
//   https://www.journalofaccountancy.com/news/2025/oct/social-security-wage-base-and-cola-announced-for-2026/
// - Connecticut rates (shown in the hint only; the tool uses one flat state rate): Smith + Howard 2026 state rates
//   https://www.smith-howard.com/staterates26/

export const TAX_YEAR = 2026;

/** Single filer. */
export const STANDARD_DEDUCTION = 16100;

/** Single filer brackets: each rate applies to taxable income above `over`. */
export const BRACKETS = [
  { over: 0, rate: 10 },
  { over: 12400, rate: 12 },
  { over: 50400, rate: 22 },
  { over: 105700, rate: 24 },
  { over: 201775, rate: 32 },
  { over: 256225, rate: 35 },
  { over: 640600, rate: 37 },
];

export const SOCIAL_SECURITY_RATE = 6.2;
export const SOCIAL_SECURITY_WAGE_BASE = 184500;
export const MEDICARE_RATE = 1.45;
/** Extra Medicare tax on wages above this amount (single filer). */
export const ADDITIONAL_MEDICARE_RATE = 0.9;
export const ADDITIONAL_MEDICARE_OVER = 200000;

// Employer-only payroll taxes, used by the Payroll Lab.
// FUTA: 6.0% minus a 5.4% credit for paying state unemployment tax = 0.6% on each employee's first $7,000.
// Source: Iowa Workforce Development, Federal Unemployment Tax Act
// https://workforce.iowa.gov/employers/unemployment-insurance/ui-tax-and-audit/federal-unemployment-tax-act
export const FUTA_RATE = 0.6;
export const FUTA_WAGE_BASE = 7000;
