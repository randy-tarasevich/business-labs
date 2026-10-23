// Historical return figures used by the Investing Risk Lab. These change slowly; refresh every few years.
//
// Source: Aswath Damodaran (NYU Stern), "Equity Risk Premiums (ERP): Determinants, Estimation, and
// Implications, The 2022 Edition", Table 3: Summary Statistics, U.S. Stocks, T. Bills and T. Bonds, 1928-2021.
// https://pages.stern.nyu.edu/~adamodar/pdfiles/papers/ERP2022Formatted.pdf
// Stocks = S&P 500 with dividends. Bonds = 10-year U.S. Treasury bonds. Cash = 3-month Treasury bills.

export const DATA_YEARS = '1928 to 2021';

/** Average yearly return and standard deviation of yearly returns, in percent. */
export const STOCKS = { mean: 11.82, sd: 19.46 };
export const BONDS = { mean: 5.11, sd: 7.68 };
/** Cash is treated as never losing money: its return varied with interest rates, but it never went below 0%. */
export const CASH = { mean: 3.33 };
