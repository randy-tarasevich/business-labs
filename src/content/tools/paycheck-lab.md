---
title: Paycheck Lab
summary: See where your paycheck goes before it reaches your account, from federal taxes and FICA to 401(k) savings, and find out what a tax bracket really means.
courses: [Personal Finance]
unit: Earning Income
grades: 9–12
minutes: [20, 25]
component: Paycheck
order: 15
indicators:
  - code: FI:068
    name: Interpret a pay stub
    level: PQ
  - code: FI:067
    name: Explain the nature of tax liabilities
    level: PQ
alsoAligned:
  - "Jump$tart National Standards: Earning Income"
---

## How I use it

**Personal Finance, earning income unit.** 20–25 minutes. Works well the day students bring in (or look at a sample) pay stub, and right before the Budget Balancer, since a budget starts from take-home pay.

1. **Predict:** "Your first full-time job pays $22 an hour, 40 hours a week. That's $1,760 every two weeks. How much actually lands in your account?" Students write a number.
2. **Test:** Project the tool (the first full-time job is the default) and reveal the answer: $1,400.33. Walk down the pay stub line by line. Then pairs work the "Try it" questions.
3. **Explain:** Each pair writes one sentence explaining why a raise into a higher bracket never lowers take-home pay, using two numbers from the tool.

The bracket question is the heart of the lesson. Many adults believe a raise can "push you into a higher bracket" and cost them money. Try it #3 and the first prediction card show it can't.

## What the tool assumes

- **Federal numbers live in one file**, `src/data/paycheck.js`, with the tax year. Update it each fall when the IRS announces the next year's brackets.
- 2026 numbers, single filer: $16,100 standard deduction; brackets of 10% to $12,400, 12% to $50,400, 22% to $105,700, 24% to $201,775, then 32%, 35%, and 37%. Social Security is 6.2% on pay up to $184,500. Medicare is 1.45%, plus 0.9% on pay over $200,000.
- Yearly pay is hourly pay × hours × 52. Overtime isn't modeled; real overtime above 40 hours pays at least 1.5 times the hourly rate.
- Federal tax here is the yearly tax divided by the number of paychecks. Real withholding uses the W-4 and IRS tables, so a real stub can be off by a few dollars, and the difference is settled when you file a return.
- **State tax is one flat rate** on pay after 401(k) savings. Connecticut's real rates run from 2% to 6.99%, with an exemption and a credit that lower tax for many lower earners, so a flat 3% is a rough estimate for an entry-level Connecticut job. Set it to 0% to show a state like Florida or Texas.
- 401(k) savings come out before federal and state income tax but not before Social Security and Medicare. Employer matches aren't shown.
- Not modeled: health insurance premiums, local taxes, tax credits, and other filing statuses.

## Answer notes

| Preset | Pay | Paid | Gross per check | Federal | Social Security | Medicare | State | 401(k) | Net per check |
|---|---|---|---|---|---|---|---|---|---|
| Part-time job | $17 × 20 hr | Weekly | $340.00 | $3.04 | $21.08 | $4.93 | $10.20 (3%) | $0 | $300.75 |
| First full-time job | $22 × 40 hr | Every 2 weeks | $1,760.00 | $121.02 | $109.12 | $25.52 | $51.22 (3%) | $52.80 (3%) | $1,400.33 |
| Skilled full-time job | $40 × 40 hr | Every 2 weeks | $3,200.00 | $322.14 | $198.40 | $46.40 | $135.36 (4.5%) | $192.00 (6%) | $2,305.70 |

- Yearly: part-time $17,680 gross, $158 federal; first full-time $45,760 gross, $3,146 federal (6.9% of pay); skilled $83,200 gross, $8,376 federal (10.1% of pay).
- Try it #2: at 0% 401(k), take-home is $1,445.21, so saving $52.80 only costs $44.88 of take-home.
- Try it #3: $32 an hour takes home $1,998.73; $33 takes home $2,058.26.
- First full-time job with state tax at 0%: $1,451.54 a paycheck.

## Predict first

Two prediction cards sit above the challenges. Students pick Goes up, Goes down, or Stays the same; the tool makes the change on screen and shows before and after.

- **Raise into a higher bracket** ($32 to $33 an hour, 12% to 22% bracket): take-home **goes up**, $1,998.73 to $2,058.26 a paycheck. Only the dollars above $50,400 of taxable pay are taxed at 22%. Follow-up: how much of the $80 raise per paycheck do you keep? (About $59.53.)
- **Fewer hours** (part-time job, 20 to 15 hours): Social Security's share **stays the same** at 6.2%. It's a flat rate on every dollar. Federal income tax is different: at 15 hours it drops to $0, because the standard deduction covers all of the pay.

## Challenges

Three challenge cards sit under the tool. Each Start button loads its scenario and makes a link you can post. Sample solutions (there are others):

- **Clear $1,500 a paycheck** (first full-time job, hourly pay, 401(k), and state tax locked): work 44 hours a week ($1,531.97). 43 hours falls just short ($1,499.06). Point out that real overtime would pay time and a half, so it would take fewer extra hours.
- **No federal income tax** (part-time job, pay and hours locked): put 9% into a 401(k). That brings taxable pay below the $16,100 standard deduction. At 8%, $16.56 is still owed.
- **Back to the 12% bracket** (skilled job, pay and hours locked): save 21% in the 401(k). That brings taxable pay under $50,400. 20% leaves you at 22%. Ask whether giving up that much take-home pay to change brackets is a good reason to save. (The real reason to save is retirement; the lower bracket is a side effect.)

## Common misconceptions

- **"A raise can push me into a higher bracket and lower my pay."** Only the dollars above the line pay the higher rate.
- **"My bracket is the share of my pay that goes to taxes."** In the 22% bracket, federal tax takes about 10% of the skilled job's pay.
- **"Gross pay is what I get."** Even a part-time job loses Social Security, Medicare, and state tax from every check.
- **"Saving $50 in a 401(k) costs me $50."** It costs less, because that money isn't taxed yet. (It's taxed later, when it's taken out in retirement.)
- **"Students don't pay taxes."** Teens pay Social Security and Medicare on every dollar, and income tax once their pay passes the standard deduction.

## Sources

- Federal brackets and standard deduction: [IRS Adjusts Tax Brackets, Standard Deduction for 2026](https://www.cpapracticeadvisor.com/2025/10/09/irs-adjusts-tax-brackets-standard-deduction-for-2026/170661/), CPA Practice Advisor
- Social Security wage base and FICA rates: [Social Security wage base and COLA announced for 2026](https://www.journalofaccountancy.com/news/2025/oct/social-security-wage-base-and-cola-announced-for-2026/), Journal of Accountancy
- Connecticut rates: [2026 state income tax rates](https://www.smith-howard.com/staterates26/), Smith + Howard
