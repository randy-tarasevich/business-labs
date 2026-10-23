---
title: Inventory Methods Lab
summary: Same products, same sales. Compare how FIFO, LIFO, and weighted average change cost of goods sold, profit, and taxes.
courses: [Accounting]
unit: Inventory Costing
grades: 10–12
minutes: [20, 25]
component: InventoryMethods
order: 40
indicators:
  - code: FI:586
    name: Explain methods used to value inventory (e.g., FIFO, LIFO, average cost, etc.)
    level: CS
  - code: FI:436
    name: Determine the cost/value of inventory
    level: SP
alsoAligned: []
---

## How I use it

**Level: Advanced Accounting** (or late Accounting 1). 20–25 minutes, best right after students calculate FIFO and LIFO by hand once.

1. **Predict:** Students work the sneaker problem on paper (below). Then they predict: will weighted average's COGS land between FIFO and LIFO, or outside them?
2. **Test:** Load the preset. The bars show exactly which purchase layers each method treats as sold (blue) and which stay on the shelf (orange). Pairs work the "Try it" questions.
3. **Explain:** Each pair writes a recommendation to the sneaker store owner: which method, and why, in two sentences.

Students can type their own purchases and costs into the table, so it doubles as an answer checker for textbook problems.

The tool uses the **periodic** system (all purchases happen, then sales are costed at the end). Perpetual LIFO and moving average can give different answers; say so if your textbook uses perpetual. Tax is figured on gross profit only, to keep the comparison clean.

## Paper first

10–15 minutes. Cost-flow methods only click once students have peeled the layers off by hand. After that, the tool's bars make sense instead of looking like magic.

**Put this on the board:** A sneaker store buys four batches during the year: 20 pairs at $60, then 30 at $65, then 30 at $70, then 20 at $78. It sells 70 pairs.

1. What were the total goods available for sale (units and dollars)?
2. Using FIFO, what is cost of goods sold? Ending inventory?
3. Using LIFO, what is cost of goods sold? Ending inventory?
4. Prices rose all year. Which method shows more profit, and why?

**Answers:** (1) 100 pairs, $6,810. (2) FIFO sells the oldest first: 20 × $60 + 30 × $65 + 20 × $70 = $4,550. Ending: 10 × $70 + 20 × $78 = $2,260. (3) LIFO sells the newest first: 20 × $78 + 30 × $70 + 20 × $65 = $4,960. Ending: 10 × $65 + 20 × $60 = $1,850. (4) FIFO, because it charges the older, cheaper costs to the shoes that sold. Check: COGS + ending inventory = $6,810 for both.

**Then the tool:** load Sneakers to check. What the tool adds: weighted average (students predict it lands in between, and it does: $4,767), the falling-price TVs where LIFO flips to more profit, and the tax difference. Students can also type in their textbook's problems to check homework.

## Answer notes

| Preset (21% tax) | Method | COGS | Ending inv. | Gross profit | Tax |
|---|---|---|---|---|---|
| Sneakers, 70 sold @ $110 | FIFO | $4,550 | $2,260 | $3,150 | $662 |
| | LIFO | $4,960 | $1,850 | $2,740 | $575 |
| | Weighted avg ($68.10) | $4,767 | $2,043 | $2,933 | $616 |
| TVs, 35 sold @ $550 | FIFO | $12,700 | $4,650 | $6,550 | $1,376 |
| | LIFO | $11,550 | $5,800 | $7,700 | $1,617 |
| | Weighted avg ($347) | $12,145 | $5,205 | $7,105 | $1,492 |
| Coffee, 220 sold @ $14 | All three | $1,760 | $640 | $1,320 | $277 |

Goods available is the same for every method (sneakers $6,810, TVs $17,350). Only the split changes.

## Predict first

Two prediction cards sit above the challenges. Students pick Goes up, Goes down, or Stays the same; the tool makes the change on screen and shows before and after.

- **Sell everything** (sneakers, 70 to 100 pairs): the gap between LIFO and FIFO **goes down** from $410 to $0. When every unit is sold, every cost ends up in cost of goods sold no matter the order. Follow-up: so when do the methods matter? (When some inventory is left over and prices changed.)
- **Higher tax rate** (sneakers, 21% to 30%): FIFO cost of goods sold **stays the same** at $4,550. Taxes come after gross profit; they don't change what the shoes cost. Follow-up: what did change? (Tax on every method, and the dollar gap LIFO saves.)

## Challenges

Three challenge cards sit under the tool. Each Start button loads its scenario and makes a link you can post. Sample solutions (there are others):

- **Make the methods agree** (sneakers, still 70 sold out of 100): make every cost the same, for example $70 a pair for every layer. Any equal cost works. Selling all 100 also makes them agree, but breaks the rule.
- **A $100 tax gap** (sneakers, tax 21%, only the last purchase changes): the last purchase has to cost $82 or more. LIFO then puts $490 more into cost of goods sold, saving about $103 in tax. At $81 it's about $99.
- **Make the methods disagree** (coffee, 220 sold, beginning stays 50 bags at $8): raise purchase 3 to $10 a bag. LIFO sells those 50 bags first, so its cost of goods sold rises $100 while FIFO's doesn't change. Raising purchase 2 to $11.50 or more works too, because LIFO sells 30 more of those bags than FIFO.

## Common misconceptions

- Students think the method decides which physical shoes leave the store. It's a cost-flow assumption, not the actual flow of goods.
- Students think LIFO is "worse" because it shows less profit. Less reported profit also means less tax when prices rise.
- Students forget that ending inventory is the mirror image: the method with the highest COGS has the lowest ending inventory.
- LIFO is allowed in the U.S. but not under international accounting standards (IFRS). A good bridge to International Business.
