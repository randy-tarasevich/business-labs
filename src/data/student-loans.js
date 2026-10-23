// Federal student loan numbers used by the Student Loan Simulator.
// Policy changes every year: rates reset each May for loans made July 1 to June 30.
// Update this file (and AS_OF) once a year. The tool shows AS_OF on the page.
//
// Sources (checked October 2026):
// - Rates: May 12, 2026 Treasury auction, reported by The College Investor
//   https://thecollegeinvestor.com/80477/federal-student-loan-rates-set-to-rise-for-the-2026-27-school-year/
// - Limits: UNLV Financial Aid, OBBBA undergraduate impacts (no change to dependent undergrad base limits)
//   https://www.unlv.edu/finaid/obbba/undergraduate-impacts
// - Grace period: 6 months after leaving school or dropping below half time (studentaid.gov)

export const AS_OF = '2026-27 school year';

/** Fixed rate for undergraduate Direct Loans first disbursed July 1, 2026 to June 30, 2027. */
export const FEDERAL_RATE = 6.52;

/** Dependent undergraduate annual limits by year in school (index 0 = first year; the last value repeats). */
export const ANNUAL_LIMIT = [5500, 6500, 7500];
/** How much of each year's limit can be subsidized, for students with financial need. */
export const SUBSIDIZED_LIMIT = [3500, 4500, 5500];

/** Lifetime limits for a dependent undergraduate. */
export const AGGREGATE_LIMIT = 31000;
export const AGGREGATE_SUBSIDIZED = 23000;

/** Months after school ends before payments start. */
export const GRACE_MONTHS = 6;
