---
title: Student Loan Simulator
summary: Build a college plan, see how much you'd borrow and how interest grows while you're in school, and check whether the payment fits a starting paycheck.
courses: [Personal Finance]
unit: Credit and Debt
grades: 9–12
minutes: [20, 30]
component: StudentLoans
order: 25
indicators: []
alsoAligned:
  - "Jump$tart National Standards: Managing Credit"
---

## How I use it

**Personal Finance, credit and debt unit.** 20–30 minutes. Fits well in the fall, while seniors are filling out the FAFSA, or right after the Credit Card Payoff Lab.

1. **Predict:** "You borrow $48,000 for college. How much do you owe the day payments start?" Most students say $48,000.
2. **Test:** Project the tool (In-state public is the default) and show the answer: about $56,215. Point at the chart: Year 1's money waits the longest, so it adds the most interest. Then pairs work the "Try it" questions.
3. **Explain:** Each pair picks one example school and one career, then writes two sentences: does the plan pass the "borrow less than one year's pay" check, and what one change helps most?

The rule of thumb on screen (keep total borrowing under your first-year salary) is a common guideline, not a law. The verdict turns yellow above 80% of starting pay and red above 100%.

## What the tool assumes

- **Federal numbers live in one file**, `src/data/student-loans.js`, with the school year they apply to. Rates reset every May for loans made starting July 1. Update that file once a year; the page shows the year at the bottom of "The math."
- 2026-27 numbers: undergraduate Direct Loans at 6.52% fixed. Dependent undergraduate limits of $5,500, $6,500, then $7,500 a year ($3,500, $4,500, $5,500 of it subsidized), $31,000 lifetime ($23,000 subsidized). Six-month grace period.
- Each year's loans arrive at the start of the school year. Unsubsidized and private loans build simple interest until payments start, then that interest is added to the balance.
- Private loans use the same grace period and the same payback term as federal loans, at a fixed rate. Real private loans vary by lender and are often variable.
- **Not modeled:** federal loan fees (about 1% taken off each loan), Parent PLUS loans, the Repayment Assistance Plan (income-based payments), forgiveness programs, and graduate loans. The 10, 20, and 25-year rows show how term length changes the cost; they are not the exact federal plans.
- Take-home pay assumes about 22% of salary goes to taxes. Starting salaries are student-entered, so have them look one up for a career they're considering.
- For a real family decision, send students and parents to [studentaid.gov](https://studentaid.gov) (its Loan Simulator) and each school's net price calculator.

## Answer notes

Private loan rate 10%, starting salary $55,000, subsidized loans on.

| Preset | Gap per year | Federal | Private | Borrowed | Owed when payments start | 10-year payment | 10-year interest | Share of take-home |
|---|---|---|---|---|---|---|---|---|
| Community college (2 yr) | $4,000 | $8,000 | $0 | $8,000 | $8,082 | $92 | $3,022 | 3% |
| In-state public | $12,000 | $27,000 | $21,000 | $48,000 | $56,215 | $690 | $34,804 | 19% |
| Out-of-state public | $27,000 | $27,000 | $81,000 | $108,000 | $134,215 | $1,721 | $98,497 | 48% |
| Private college | $25,000 | $27,000 | $73,000 | $100,000 | $123,815 | $1,583 | $90,005 | 44% |

- In-state public, interest added by each year's loans before payments start: Year 1 $3,512, Year 2 $2,381, Year 3 $1,451, Year 4 $871.
- In-state public with subsidized loans off: owes $59,703 when payments start, $3,488 more.
- In-state public, paying it back: 10 years $690 a month ($34,804 interest), 20 years $480 ($67,233), 25 years $444 ($85,345).
- Try it #5: $11,000 a year of family help brings borrowing to $44,000, which is 80% of $55,000.

## Common misconceptions

- **"I owe what I borrowed."** Unsubsidized and private loans start charging interest the day the money arrives, years before the first payment.
- **"The lowest monthly payment is the best deal."** Stretching to 25 years cuts the payment by about a third but more than doubles the interest.
- **"The most expensive school costs the most."** Grants change everything. In the examples, the private college costs more per year than the out-of-state public school but leaves a smaller loan.
- **"Federal loans cover college."** A dependent student can borrow only $5,500 to $7,500 a year in federal loans. Anything past that is family money, work, or private loans with a cosigner.
- **"Private and federal loans are the same thing."** Federal loans have fixed rates, no cosigner, and options when money is tight. Private loans depend on credit and the lender.

## Sources

- Rates: [Federal Student Loan Rates Set To Rise For The 2026-27 School Year](https://thecollegeinvestor.com/80477/federal-student-loan-rates-set-to-rise-for-the-2026-27-school-year/), The College Investor
- Limits: [OBBBA undergraduate impacts](https://www.unlv.edu/finaid/obbba/undergraduate-impacts), UNLV Financial Aid
- Overview of the July 1, 2026 changes: [What Changes for Student Loan Borrowers on July 1, 2026](https://thecollegeinvestor.com/83587/what-changes-for-student-loan-borrowers-on-july-1-2026/), The College Investor
