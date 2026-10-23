// Average auto loan rates used by the Car Buying Lab. Update once a year.
//
// Source: Experian, State of the Automotive Finance Market, Q2 2026, as reported in
// "Auto Loan Rates and Financing for 2026" (Ask Experian).
// https://www.experian.com/blogs/ask-experian/auto-loan-rates-financing/
// Credit tiers use VantageScore 4.0.

export const RATES_AS_OF = 'Q2 2026';

export const CREDIT_TIERS = [
  { name: 'Super prime (781 to 850)', newApr: 4.41, usedApr: 6.29 },
  { name: 'Prime (661 to 780)', newApr: 6.15, usedApr: 8.81 },
  { name: 'Near prime (601 to 660)', newApr: 9.71, usedApr: 13.93 },
  { name: 'Subprime (501 to 600)', newApr: 13.52, usedApr: 19.1 },
  { name: 'Deep subprime (300 to 500)', newApr: 16.11, usedApr: 21.62 },
];

/** Loan lengths offered in the tool, in months. */
export const TERMS = [36, 48, 60, 72, 84];
