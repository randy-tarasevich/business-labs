---
title: Car Buying Lab
summary: Compare a new and a used car, change the loan length, down payment, and credit score, and see the monthly payment, total interest, and whether the deal passes the 20/4/10 guideline.
courses: [Personal Finance]
unit: Credit and Debt
grades: 9–12
minutes: [20, 25]
component: CarBuying
order: 28
indicators:
  - code: FI:782
    name: Calculate the cost of credit
    level: CS
  - code: FI:071
    name: Demonstrate the wise use of credit
    level: CS
alsoAligned:
  - "Jump$tart National Standards: Managing Credit"
---

## How I use it

**Personal Finance, credit and debt unit.** 20–25 minutes. Works well after the Credit Card Payoff Lab and before students start shopping for a first car.

1. **Predict:** "A dealer offers to lower your payment by stretching the loan from 5 years to 7. Is that a good deal?" Most students say yes, because the payment drops.
2. **Test:** Project the tool. Load First car, then Stretch it to 84 months: the payment drops about $123 a month, but interest goes up by almost $1,800. Then load No credit history yet. Pairs work the "Try it" questions.
3. **Explain:** Each pair writes a three-line car buying plan (new or used, how much down, how long a loan) and backs each choice with a number from the tool.

The 20/4/10 table usually fails, and that's the conversation. On a $45,760 salary with $250 a month in insurance, gas, and upkeep, there's only about $131 left for a payment. Ask what has to change: a cheaper car, a bigger down payment, or waiting to buy.

## What the tool assumes

- **Loan rates live in one file**, `src/data/car-loans.js`: average APRs by credit tier from Experian's State of the Automotive Finance Market, Q2 2026 (VantageScore 4.0 tiers). Update it once a year. Used-car loans cost more than new-car loans at every tier.
- Both cars use the same down payment and loan length so they compare fairly.
- Prices are examples. In Q2 2026, Experian reported the average new-car loan at $43,610 and the average used-car loan at $27,852, so these are smaller, starter-car prices.
- The 20/4/10 guideline: at least 20% down, a loan of 4 years or less, and all car costs (payment, insurance, gas, upkeep) under 10% of gross monthly pay. It's a rule of thumb, not a law, and some lenders and writers call it too strict today.
- Not modeled: sales tax and fees, trade-ins, depreciation (a new car loses value fastest in its first years, which is another point for used), and maintenance differences between new and used cars.

## Answer notes

$2,000 down, prime credit (6.15% new, 8.81% used), $45,760 pay, $250 a month other costs.

| Preset | Term | New: payment | New: interest | New: total | Used: payment | Used: interest | Used: total |
|---|---|---|---|---|---|---|---|
| First car | 60 mo | $504 | $4,268 | $32,268 | $289 | $3,360 | $19,360 |
| Stretch it to 84 months | 84 mo | $382 | $6,062 | $34,062 | $224 | $4,808 | $20,808 |
| No credit history yet (near prime: 9.71% / 13.93%) | 60 mo | $599 | $9,911 | $37,911 | $364 | $7,836 | $23,836 |

- 10% of $45,760 ÷ 12 is $381 a month for all car costs; minus $250 leaves $131 for a payment.
- Super prime credit on First car: used car interest $2,353; deep subprime: $9,019.

## Predict first

Two prediction cards sit above the challenges. Students pick Goes up, Goes down, or Stays the same; the tool makes the change on screen and shows before and after.

- **Stretch the loan** (new car, 60 to 84 months): total interest **goes up**, $4,268 to $6,062. The payment goes down, which is what students notice first. Follow-up: who benefits from the longer loan? (The lender.)
- **Better credit** (Prime to Super prime): the used car's payment **goes down**, $289.33 to $272.55, and interest drops from $3,360 to $2,353. Follow-up: what builds a credit score? (Paying every bill on time, keeping card balances low.)

## Challenges

Three challenge cards sit under the tool. Each Start button loads its scenario and makes a link you can post. Sample solutions (there are others):

- **Pass 20/4/10 with a used car** (pay, other costs, and credit locked): pick a 48-month loan and a $6,000 used car (33% down with the $2,000, a $99 payment). With $2,000 down, any used car up to $7,250 works on 48 months. Debrief: the guideline points most first-time buyers to an inexpensive used car.
- **Cut the new car's interest** (new car stays $28,000, credit stays Prime): a 36-month loan ($2,539 of interest). A bigger down payment also helps. Ask what happens to the payment ($793 a month).
- **Credit is worth money** (used car, $2,000 down, 60 months, all locked): only the credit score can change. Super prime gets it to $2,353; Prime ($3,360) isn't enough.

## Common misconceptions

- **"A lower monthly payment means a cheaper car."** A longer loan lowers the payment and raises the total.
- **"Used cars have higher rates, so they cost more."** You borrow so much less that the total is still far lower.
- **"Credit scores only matter for credit cards."** The same car costs thousands more in interest with a lower score.
- **"If I can make the payment, I can afford the car."** Insurance, gas, and upkeep come on top of the payment, and for a young driver insurance alone can rival the payment.

## Sources

- Rates by credit tier and average loan sizes: Experian, [Auto Loan Rates and Financing for 2026](https://www.experian.com/blogs/ask-experian/auto-loan-rates-financing/) (State of the Automotive Finance Market, Q2 2026)
- 20/4/10 guideline: Chase, [Buying a car? Know the 20/4/10 rule](https://www.chase.com/personal/auto/education/buying/what-is-the-20-4-10-rule-for-car-buying)
