---
title: Bad Debts Lab
summary: Estimate how much customers will never pay, two ways (percent of sales and an aging schedule), then see the adjusting entry, Bad Debt Expense, and the net realizable value of receivables.
courses: [Accounting]
unit: Receivables
grades: 9–12
minutes: [25, 30]
component: BadDebts
order: 85
indicators:
  - code: FI:424
    name: Explain the nature of accounts receivable
    level: CS
  - code: FI:683
    name: Process accounts receivable (e.g., post to ledger, process payment, process uncollectible account, etc.)
    level: SP
  - code: FI:449
    name: Analyze transactions and accounts (e.g., purchase, sales, sales returns and allowances, uncollectible accounts, depreciation, debt)
    level: SP
alsoAligned: []
---

## How I use it

**Advanced Accounting (or late Accounting 1), receivables unit.** 25–30 minutes. Use it after students know adjusting entries and contra accounts (Accumulated Depreciation is the usual comparison).

1. **Predict:** "The furniture store has $90,000 in receivables. Some customers will never pay. How should the business show that on its statements this year, before it knows *which* customers?" Collect ideas; most students say "wait until they don't pay."
2. **Test:** Project the tool on the aging tab (the default). Walk the aging schedule: older accounts get a higher percent. Show the adjusting entry and net realizable value. Then switch to percent of sales and compare. Pairs work the "Try it" questions.
3. **Explain:** Each pair writes two sentences: why the business estimates bad debts at year end instead of waiting, and why the allowance's old balance matters for aging but not for percent of sales.

For a by-hand warm-up, hand out the furniture store's aging schedule and have students compute the $5,100 target before you show the tool.

## What the tool assumes

- The allowance method only. The direct write-off method isn't shown, since it doesn't match expenses to the sales they came from (most textbooks note it's only allowed when bad debts are small).
- **Percent of sales** uses credit sales and adds the estimate to the allowance's existing balance. **Aging** sets the allowance to the schedule's total, so the expense is the target minus the existing balance.
- The allowance's balance before adjusting can be a debit (enter a negative number) when write-offs during the year were more than the allowance had.
- The four age groups and their percents are examples. Students can change every amount and percent.
- Write-offs and recoveries of individual accounts aren't modeled. Try it #4 covers the write-off entry in words.

## Answer notes

Credit sales $400,000; percent of sales 1%; aging percents 1%, 5%, 20%, 50%.

| Preset | A/R | Allowance before | Aging: target | Aging: expense | Aging: NRV | % of sales: expense | % of sales: allowance after | % of sales: NRV |
|---|---|---|---|---|---|---|---|---|
| Furniture store | $90,000 | $1,200 credit | $5,100 | $3,900 | $84,900 | $4,000 | $5,200 | $84,800 |
| Write-offs ran high | $90,000 | $800 debit | $5,100 | $5,900 | $84,900 | $4,000 | $3,200 | $86,800 |
| Collections improved | $90,000 | $1,200 credit | $2,250 | $1,050 | $87,750 | $4,000 | $5,200 | $84,800 |

- Furniture store aging schedule: $60,000 × 1% = $600; $18,000 × 5% = $900; $8,000 × 20% = $1,600; $4,000 × 50% = $2,000; total $5,100.
- Adjusting entry (furniture store, aging): debit Bad Debt Expense $3,900, credit Allowance for Doubtful Accounts $3,900.

## Predict first

Two prediction cards sit above the challenges. Students pick Goes up, Goes down, or Stays the same; the tool makes the change on screen and shows before and after.

- **Debit balance before adjusting** (furniture store, aging, $1,200 credit to $800 debit): the allowance after adjusting **stays the same** at $5,100. The aging method sets the allowance to the schedule's total; only the expense changes (to $5,900). Follow-up: what would happen under percent of sales? (The allowance would end at $3,200, because that method just adds $4,000.)
- **Customers pay faster** (furniture store to Collections improved, aging): Bad Debt Expense **goes down**, $3,900 to $1,050. Same total receivables, but younger ones. Follow-up: so what's the business case for chasing late accounts?

## Challenges

Two challenge cards sit under the tool. Each Start button loads its scenario and makes a link you can post. Sample solutions (there are others):

- **Collect the old accounts** (aging, expense under $2,500, total receivables stay $90,000, percents locked): move the $4,000 over 90 days into "not yet due" ($64,000 and $0). The expense drops to $1,940. Moving the 31-to-90-day group works too, but it takes more of it.
- **Bring percent of sales back in line** (Collections improved, stay on percent of sales, allowance within $100 of $2,250): lower the percent to 0.25% ($1,000 added, allowance $2,200). Debrief: percent of sales is quick, but it can drift from what's really collectible, which is why many businesses check it against an aging schedule.

## Common misconceptions

- **"Bad debts are recorded when a customer doesn't pay."** Under the allowance method, the expense is estimated at year end, in the same year as the sales.
- **"Writing off an account is an expense."** The write-off just uses up the allowance. The expense was recorded at year end.
- **"The allowance is cash set aside."** It's a contra asset, an estimate subtracted from receivables. No money moves.
- **"Both methods give the same answer."** One estimates from sales, the other from receivables still unpaid. They usually differ.
