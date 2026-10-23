---
title: Investing Risk Lab
summary: Mix stocks, bonds, and cash, pick when you need the money, and see the range of what could happen, including the chance you end up with less than you put in.
courses: [Personal Finance]
unit: Saving and Investing
grades: 9–12
minutes: [20, 25]
component: InvestingRisk
order: 35
indicators:
  - code: FI:077
    name: Explain types of investments
    level: CS
  - code: FI:079
    name: Establish investment goals and objectives
    level: MN
alsoAligned:
  - "Jump$tart National Standards: Investing"
---

## How I use it

**Personal Finance, saving and investing unit.** 20–25 minutes. Use it right after the Start Early Lab, which assumes a smooth 7% every year. This tool shows what that assumption hides.

1. **Predict:** "You're saving $5,000 for a car you'll buy in 2 years. A friend says to put it all in stocks because stocks grow the most. What's the chance you end up with less than $5,000?" Most students guess under 5%.
2. **Test:** Project the car fund (the default) and reveal it: about 21%, roughly 1 in 5. Then switch to 20 years and watch it drop under 1%. Pairs work the "Try it" questions.
3. **Explain:** Each pair writes one rule for matching an investment to when you need the money, backed by two numbers from the tool.

The big idea is that risk depends on time. The same all-stock mix is reckless for a car fund and sensible for retirement. The Retirement and Play it safe presets show the other side: over 40 years, cash is "safe" but grows so little that even investing's bad case beats it.

## What the tool assumes

- **Historical figures live in one file**, `src/data/investing.js`: U.S. returns from 1928 to 2021 (Damodaran, NYU Stern). Stocks (S&P 500 with dividends) averaged 11.82% a year with a standard deviation of 19.46%; 10-year Treasury bonds 5.11% with 7.68%; 3-month T-bills (cash) 3.33%.
- Cash is treated as never losing money and growing a steady 3.33% a year. Real savings accounts often pay less.
- Stocks and bonds are treated as moving independently of each other (no correlation), and the mix is rebalanced each year.
- Outcomes use a lognormal model: the middle outcome grows at the mix's typical yearly rate, and the range widens with the square root of the years. The bad and good cases are the 10th and 90th percentiles, so 8 in 10 outcomes land between them.
- No fees, taxes, inflation, or new deposits. Returns are before inflation, so a dollar in 40 years buys less than a dollar today.
- Real markets have more extreme years than this model (crashes like 1931 at −43.8% and 2008 at −36.6%), so the true bad case can be worse. Say so out loud.

## Answer notes

$5,000 invested in every preset.

| Preset | Mix (stocks / bonds / cash) | Years | Middle | Bad case | Good case | Chance of losing money | All cash |
|---|---|---|---|---|---|---|---|
| Car fund | 100 / 0 / 0 | 2 | $6,068 | $4,437 | $8,299 | 21.4% | $5,339 |
| College | 60 / 40 / 0 | 10 | $11,278 | $7,213 | $17,634 | 1.0% | $6,938 |
| Retirement | 90 / 10 / 0 | 40 | $209,778 | $58,880 | $747,394 | Under 0.1% | $18,536 |
| Play it safe | 0 / 0 / 100 | 40 | $18,536 | $18,536 | $18,536 | 0% | $18,536 |

- Car fund, all stocks: the chance of losing money is 28.8% at 1 year, 21.4% at 2, 10.5% at 5, 3.8% at 10, and 0.6% at 20.
- College fund with the bonds moved to cash (60 / 0 / 40): middle $10,597, bad case $6,858.

## Predict first

Two prediction cards sit above the challenges. Students pick Goes up, Goes down, or Stays the same; the tool makes the change on screen and shows before and after.

- **Wait longer** (car fund, all stocks, 2 to 20 years): the chance of losing money **goes down**, 21.4% to 0.6%. Students often expect more years to mean more chances for a crash. Follow-up: the range in dollars got much wider, so what got safer? (Ending below what you put in.)
- **Invest more** (college fund, $5,000 to $10,000): the chance of losing money **stays the same** at 1.0%. Risk comes from the mix and the time, not the amount. The dollars at risk double, but the odds don't change.

## Challenges

Three challenge cards sit under the tool. Each Start button loads its scenario and makes a link you can post. Sample solutions (there are others):

- **Protect the car fund** (2 years, $5,000, chance of losing money under 1%): move stocks to 0%, so it's all cash (0%). 10% stocks gets about 0.1% too. Debrief: when you need money soon, the right answer is often not to invest it.
- **Safe, but too safe** (all cash for 40 years, middle at least $40,000, bad case above $25,000): 25% stocks and 75% cash gives a $40,066 middle and $27,572 bad case. Going all stocks also works (bad case $59,232). Ask why the bad-case rule barely matters over 40 years.
- **Raise the floor** (college fund, bad case at least $7,250, middle stays $10,000 or more): 50% stocks and 50% bonds gives a $7,285 bad case and $10,759 middle. 40 / 60 also works ($7,282, $10,225). Debrief: adding bonds lowered the middle a little but raised the worst case. That trade is diversification.

## Common misconceptions

- **"Stocks always win."** Over 2 years, all stocks loses money about 1 time in 5.
- **"Safe means no risk."** Cash can't drop, but over 40 years it falls far behind, especially after inflation.
- **"More time means more chances for a crash, so more risk."** More time gives good years the chance to outweigh bad ones, so the chance of ending below where you started shrinks.
- **"Investing more money is riskier."** The odds stay the same; only the dollars change.
- **"Diversifying means owning a lot of one thing."** Diversifying means owning things that don't move together, like stocks and bonds.

## Sources

- Historical returns and standard deviations: Damodaran, [Equity Risk Premiums, 2022 Edition](https://pages.stern.nyu.edu/~adamodar/pdfiles/papers/ERP2022Formatted.pdf), Table 3 (1928 to 2021)
- Worst years (1931 and 2008): Damodaran, [Historical Returns on Stocks, Bonds and Bills](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html)
