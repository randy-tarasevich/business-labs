---
title: Payroll Lab
summary: Run one payroll for a small business with three hourly employees, see every withholding in the register, journalize the payroll and the employer's payroll taxes, and find what employees really cost.
courses: [Accounting, Entrepreneurship]
unit: Payroll
grades: 9–12
minutes: [25, 35]
component: Payroll
order: 70
indicators:
  - code: FI:638
    name: Explain the nature of payroll expenses (e.g., Social Security tax, Medicare tax, FUTA, SUTA, workers' compensation)
    level: CS
  - code: FI:439
    name: Calculate employee deductions
    level: SP
  - code: FI:442
    name: Calculate payroll taxes
    level: SP
  - code: FI:686
    name: Account for payroll transactions (e.g., earnings, taxes, benefits, other deductions)
    level: SP
alsoAligned: []
---

## How I use it

**Accounting 1, payroll unit.** 25–35 minutes. Use it after students have journalized ordinary transactions and know what a liability is. It pairs well with the Paycheck Lab in Personal Finance, which shows the same paycheck from the employee's side.

1. **Predict:** "The coffee shop's three employees earned $1,550 this week. How much does payroll cost the business?" Most students say $1,550, or less "because of taxes."
2. **Test:** Project the tool (the coffee shop is the default) and reveal the total cost: $1,721.28. Walk through the register, then the two journal entries. Point out that Social Security Tax Payable and Medicare Tax Payable show up in both entries. Pairs work the "Try it" questions.
3. **Explain:** Each pair writes a one-paragraph explanation of why Cash in entry 1 is less than Wages Expense, and why entry 2 exists at all, using numbers from the tool.

For a by-hand warm-up, give students Ana's line only (30 hours at $16) and have them compute Social Security, Medicare, and state tax before showing the register. Federal withholding is the one number to give them, since it comes from tables.

## What the tool assumes

- **Tax numbers are shared with the Paycheck Lab** in `src/data/paycheck.js`: 2026 single-filer brackets and $16,100 standard deduction, Social Security 6.2%, Medicare 1.45%, and FUTA 0.6% (6.0% less the 5.4% state credit) on the first $7,000 of each employee's wages.
- Federal income tax withholding is an estimate: this paycheck × paychecks a year, minus 401(k) and the standard deduction, through the brackets, then ÷ paychecks a year. Real payroll uses each employee's W-4 and IRS Publication 15-T, so real withholding can differ by a few dollars. The extra 0.9% Medicare tax over $200,000 isn't modeled.
- **It's early in the year:** no one has passed the $7,000 FUTA limit or the state's SUTA wage limit, so both taxes apply to every dollar. Later in the year, those taxes stop for each employee once they pass the limit.
- SUTA rates are set by each state for each employer; 2.8% is an example. State income tax is one flat rate, as in the Paycheck Lab.
- Every amount is rounded to the cent per employee, so the entries balance to the penny. (That's why the landscaping crew's Ana, who matches the Paycheck Lab's first full-time job, shows $1,400.32 here instead of $1,400.33.)
- Entry 1 credits Cash, as if employees are paid the same day. Some textbooks credit Wages Payable (or Salaries Payable) and record the payment separately.
- Workers' compensation, health insurance, and employer 401(k) matches aren't modeled.

## Answer notes

| Preset | Gross | Federal | Soc. Sec. | Medicare | State | 401(k) | Net | Employer taxes | Total cost |
|---|---|---|---|---|---|---|---|---|---|
| Coffee shop (weekly) | $1,550.00 | $66.36 | $96.10 | $22.48 | $46.50 | $0.00 | $1,318.56 | $171.28 | $1,721.28 |
| Landscaping crew (every 2 weeks) | $4,440.00 | $266.25 | $275.28 | $64.38 | $129.21 | $133.20 | $3,571.68 | $490.62 | $4,930.62 |
| Small office (every 2 weeks) | $5,840.00 | $431.17 | $362.08 | $84.68 | $221.92 | $292.00 | $4,448.15 | $645.32 | $6,485.32 |

Coffee shop, journal entries:

- **Entry 1:** Wages Expense Dr $1,550.00; Federal Income Tax Payable Cr $66.36; Social Security Tax Payable Cr $96.10; Medicare Tax Payable Cr $22.48; State Income Tax Payable Cr $46.50; Cash Cr $1,318.56.
- **Entry 2:** Payroll Tax Expense Dr $171.28; Social Security Tax Payable Cr $96.10; Medicare Tax Payable Cr $22.48; FUTA Tax Payable Cr $9.30; SUTA Tax Payable Cr $43.40.
- Coffee shop by employee: Ana $480.00 gross, $411.84 net; Ben $310.00 gross, $276.94 net (federal only $0.04); Cara $760.00 gross, $629.78 net.

## Predict first

Two prediction cards sit above the challenges. Students pick Goes up, Goes down, or Stays the same; the tool makes the change on screen and shows before and after.

- **Everyone saves 5% in a 401(k)** (coffee shop): employer payroll taxes **stay the same** at $171.28. Social Security, Medicare, FUTA, and SUTA are all figured on gross pay, and 401(k) savings don't lower gross pay. Follow-up: what *does* the 401(k) lower? (Federal and state income tax withholding, and take-home pay.)
- **Ben's hours double** (20 to 40 a week): his federal withholding **goes up**, from $0.04 to $32.48, far more than double. At 20 hours a week, almost all of his yearly pay is under the standard deduction; at 40, a big slice is taxed. Follow-up: did his Social Security double? (Yes, exactly: it's a flat rate.)

## Challenges

Three challenge cards sit under the tool. Each Start button loads its scenario and makes a link you can post. Sample solutions (there are others):

- **Same hours, lower cost** (coffee shop, total cost $1,650 or less, 90 hours, rates locked): move hours from Cara ($19) to Ben ($15.50). Cara 20 and Ben 40 costs $1,643.54. Debrief: scheduling is a cost decision, and every $1 of wages costs about $1.11.
- **Stay on budget** (landscaping, $4,800 budget, Ana and Ben stay at 80 hours): cut Cara to 53 hours or fewer (53 hours costs $4,790.69). The trap is budgeting for gross pay only: $4,800 of gross pay would really cost about $5,330.
- **A raise for Cara** (small office, take-home $700 or more, 40 hours, 401(k) stays 5%): $22 an hour ($713.56). $21.50 falls just short ($698.75). Ask how much the raise costs the business, not just Cara's paycheck.

## Common misconceptions

- **"Payroll costs what the employees earn."** The business pays about 11% more in its own payroll taxes.
- **"Withheld taxes are the business's expense."** They're the employee's taxes. The business only holds the money, so withholdings are liabilities, not expenses.
- **"The employer's Social Security is the same money as the employee's."** It's a second, matching payment. The business owes both.
- **"401(k) savings lower every tax."** They lower income tax withholding, not Social Security, Medicare, or the employer's payroll taxes.

## Sources

- Payroll indicators: MBA Research, [Accounting sub-cluster performance indicators](https://www.mbaresearch.org/local-educators/teaching-resources/standards/financial-services-career-cluster/accounting-sub-cluster/)
- FUTA rate, credit, and wage base: Iowa Workforce Development, [Federal Unemployment Tax Act](https://workforce.iowa.gov/employers/unemployment-insurance/ui-tax-and-audit/federal-unemployment-tax-act)
- Federal brackets, standard deduction, and FICA: see the Paycheck Lab's sources
