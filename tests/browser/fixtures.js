// Known answers for challenges and predictions. These live in tests/, which never ships to
// student pages, so it's safe to keep solutions here. They should match the teacher notes.
//
// Challenges: for each tool, one entry per challenge, in order.
//   solve: changes that reach the goal within the rules (the card should say Done)
//   break: changes that reach the goal but break a rule (the card should say Rule broken)
//   Keys are input ids without "-n"; 'tab' clicks a tab by index.
export const CHALLENGE_ANSWERS = {
  'break-even-lab': [
    { solve: { 'be-vc': 4 }, break: { 'be-price': 30 } },
    { solve: { 'be-price': 31 }, break: { 'be-price': 25, 'be-q': 300 } },
    { solve: { 'be-price': 13 }, break: { 'be-fc': 6000 } },
  ],
  depreciation: [
    { solve: { tab: 1 }, break: { tab: 1, 'dp-cost': 40000 } },
    { solve: { 'dp-salvage': 300 }, break: { 'dp-life': 1, 'dp-salvage': 1100 } },
    { solve: { 'dp-life': 6 }, break: { 'dp-cost': 30000 } },
  ],
  'marketing-funnel': [
    { solve: { 'fn-ctr': 1.8 }, break: { 'fn-margin': 90 } },
    { solve: { 'fn-conv': 3.2 }, break: { 'fn-cpm': 3 } },
    { solve: { 'fn-conv': 3.6 }, break: { 'fn-aov': 400 } },
  ],
  'student-loan-simulator': [
    { solve: { 'sl-family': 11000 }, break: { 'sl-cost': 27000 } },
    { solve: { 'sl-rate': 6.5 }, break: { 'sl-aid': 8000 } },
    { solve: { 'sl-salary': 177000 }, break: { 'sl-cost': 25000 } },
  ],
  'credit-card-payoff-lab': [
    { solve: { 'cc-fixed': 114 }, break: { 'cc-balance': 1000 } },
    { solve: { 'cc-apr': 21 }, break: { 'cc-fixed': 160 } },
    { solve: { 'cc-fixed': 156 }, break: { 'cc-balance': 3000 } },
  ],
  'start-early-lab': [
    { solve: { 'se-monthly': 200 }, break: { 'se-monthly': 300 } },
    { solve: { 'se-bStart': 26 }, break: { 'se-bRate': 8 } },
    { solve: { 'se-bRate': 5 }, break: { 'se-rate': 3 } },
  ],
  'paycheck-lab': [
    { solve: { 'pc-hours': 44 }, break: { 'pc-hourly': 24 } },
    { solve: { 'pc-k': 9 }, break: { 'pc-hours': 15 } },
    { solve: { 'pc-k': 21 }, break: { 'pc-hours': 32 } },
  ],
  'investing-risk-lab': [
    { solve: { 'ir-stocks': 0 }, break: { 'ir-years': 20 } },
    { solve: { 'ir-stocks': 25 }, break: { 'ir-amount': 15000 } },
    { solve: { 'ir-stocks': 50, 'ir-bonds': 50 }, break: { 'ir-amount': 6000 } },
  ],
  'insurance-deductible-lab': [
    { solve: { 'in-b-ded': 600 }, break: { 'in-cost': 600 } },
    { solve: { 'in-b-prem': 100 }, break: { 'in-claims': 0 } },
    { solve: { 'in-a-prem': 210 }, break: { 'in-b-prem': 215 } },
  ],
  'car-buying-lab': [
    { solve: { 'cb-term': 48, 'cb-used-price': 6000 }, break: { 'cb-term': 48, 'cb-down': 3200, 'cb-other': 0 } },
    { solve: { 'cb-term': 36 }, break: { 'cb-new-price': 20000 } },
    { solve: { 'cb-credit': 0 }, break: { 'cb-used-price': 7000 } },
  ],
  'ab-post-test': [
    { solve: { 'ab-nA': 800, 'ab-cA': 24, 'ab-nB': 800, 'ab-cB': 40 }, break: { 'ab-cB': 16 } },
    { solve: { 'ab-cB': 16 }, break: { 'ab-nA': 800, 'ab-cA': 24, 'ab-nB': 800, 'ab-cB': 40 } },
    { solve: { 'ab-nA': 1000, 'ab-cA': 30, 'ab-nB': 1000, 'ab-cB': 35 }, break: { 'ab-nA': 1000, 'ab-cA': 30, 'ab-nB': 2000, 'ab-cB': 70 } },
  ],
  'engagement-rate-lab': [
    { solve: { 'er-likes': 480 }, break: { 'er-followers': 25000 } },
    { solve: { 'er-likes': 1860 }, break: { 'er-likes': 1860, 'er-followers': 3000 } },
    { solve: { 'er-reach': 16000, 'er-likes': 980 }, break: { 'er-likes': 980 } },
  ],
  'feed-ranking-sandbox': [
    { solve: { 'fr-you-watch': 25 }, break: { 'fr-you-watch': 25, 'fr-you-hours': 1 } },
    { solve: { 'fr-w-comments': 0, 'fr-w-likes': 4, 'fr-w-watch': 5 }, break: { 'fr-w-watch': 0, 'fr-w-comments': 0 } },
    { solve: { 'fr-w-recency': 10, 'fr-w-comments': 0, 'fr-w-shares': 0, 'fr-w-watch': 0, 'fr-w-friend': 1 }, break: { 'fr-w-recency': 10, 'fr-w-likes': 0, 'fr-w-comments': 0, 'fr-w-shares': 0, 'fr-w-watch': 0 } },
  ],
  'influencer-deal-lab': [
    { solve: { 'inf-fee': 1500 }, break: { 'inf-aov': 120 } },
    { solve: { 'inf-fake': 35 }, break: { 'inf-fee': 500 } },
    { solve: { 'inf-followers': 33000 }, break: { 'inf-followers': 33000, 'inf-fee': 0 } },
  ],
  'positioning-map-lab': [
    { solve: { 'pm-x': 4.5, 'pm-y': 8 }, break: { 'pm-x': 3, 'pm-y': 8 } },
    { solve: { 'pm-x': 7.5, 'pm-y': 8 }, break: { 'pm-x': 3.5, 'pm-y': 4 } },
    { solve: { 'pm-x': 8, 'pm-y': 8 }, break: { 'pm-x': 6, 'pm-y': 6 } },
  ],
  'price-demand': [
    { solve: { 'pd-price': 45 }, break: { 'pd-q0': 2000 } },
    { solve: { 'pd-price': 41 }, break: { 'pd-vc': 10 } },
    { solve: { 'pd-price': 18 }, break: { 'pd-price': 18, 'pd-vc': 1 } },
  ],
  'startup-runway': [
    { solve: { 'rw-cash': 80000 }, break: { 'rw-growth': 10 } },
    { solve: { 'rw-fixed-0': 500 }, break: { 'rw-cash': 26000 } },
    { solve: { 'rw-startup-0': 30000 }, break: { 'rw-cash': 90000 } },
  ],
  'investor-deal-lab': [
    { solve: { 'dl-askPct': 20 }, break: { 'dl-askAmt': 40000, 'dl-askPct': 15 } },
    { solve: { 'dl-askPct': 25 }, break: { 'dl-exit': 2500000 } },
    { solve: { 'dl-exit': 750000 }, break: { 'dl-offPct': 20, 'dl-exit': 650000 } },
  ],
  'unit-economics-lab': [
    { solve: { 'ue-months': 8 }, break: { 'ue-spend': 600 } },
    { solve: { 'ue-months': 8 }, break: { 'ue-aov': 50 } },
    { solve: { 'ue-months': 6 }, break: { 'ue-newc': 14 } },
  ],
  'supply-demand': [
    { solve: { 'sd-ds': -400 }, break: { 'sd-ss': -300, 'sd-ds': -300 } },
    { solve: { 'sd-ss': 300 }, break: { 'sd-ds': 0 } },
    { solve: { 'sd-ss': 4500 }, break: { 'sd-price': 3.5 } },
  ],
  'financial-statements': [
    { solve: { f9: 2050 }, break: { f0: 4250 } },
    { solve: { f1: 1570 }, break: { f0: 3270 } },
    { solve: { f0: 3900 }, break: { f9: 1700 } },
  ],
  'inventory-methods': [
    { solve: { f1: 70, f3: 70, f7: 70 }, break: { 'iv-sold': 100 } },
    { solve: { f7: 82 }, break: { 'iv-tax': 25 } },
    { solve: { f7: 10 }, break: { f1: 6 } },
  ],
  'ratio-dashboard': [
    { solve: { 'rt-cl': 170000 }, break: { 'rt-ca': 450000 } },
    { solve: { 'rt-inv': 60000 }, break: { 'rt-cl': 70000 } },
    { solve: { 'rt-tl': 390000 }, break: { 'rt-ta': 900000 } },
  ],
  'comparative-advantage': [
    { solve: { 'ca-share-0': 0, 'ca-share-1': 100, f5: 1, f4: 15, f6: 7 }, break: { f1: 60, 'ca-share-0': 0, 'ca-share-1': 100, f5: 1, f4: 15, f6: 7 } },
    { solve: { 'ca-share-0': 100, 'ca-share-1': 0 }, break: { f0: 100, 'ca-share-0': 100, 'ca-share-1': 0 } },
    { solve: { f3: 60, 'ca-share-0': 100, 'ca-share-1': 0 }, break: { f1: 25, 'ca-share-0': 100, 'ca-share-1': 0 } },
  ],
  'currency-trade': [
    { solve: { 'fx-rate': 0.75 }, break: { 'fx-tariff': 30 } },
    { solve: { 'fx-tariff': 40 }, break: { 'fx-markup': 131 } },
    { solve: { 'fx-rate': 140 }, break: { 'fx-price': 700 } },
  ],
  'market-entry': [
    { solve: { 'me-sales': 400000 }, break: { 'me-growth': 25 } },
    { solve: { 'me-tariff': 5 }, break: { 'me-tariff': 5, 'me-shortfall': 0 } },
    { solve: { 'me-growth': 15 }, break: { 'me-sales': 330000 } },
  ],
  'offshoring-decision-lab': [
    { solve: { 'off-tariff': 155 }, break: { 'off-tariff': 120, 'off-currency': 30 } },
    { solve: { 'off-hours': 3, 'off-defect': 2 }, break: { 'off-tariff': 10 } },
    { solve: { 'off-currency': -8 }, break: { 'off-tariff': 0 } },
  ],
  'payroll-lab': [
    { solve: { 'pr-c-hours': 20, 'pr-b-hours': 40 }, break: { 'pr-c-rate': 16 } },
    { solve: { 'pr-c-hours': 52 }, break: { 'pr-a-rate': 20 } },
    { solve: { 'pr-c-rate': 22 }, break: { 'pr-c-hours': 44 } },
  ],
};

// Predictions: the right answer for each card, in order ('up', 'down', or 'same').
export const PREDICTION_ANSWERS = {
  'break-even-lab': ['same', 'up'],
  depreciation: ['same', 'down'],
  'marketing-funnel': ['up', 'same'],
  'student-loan-simulator': ['down', 'same'],
  'credit-card-payoff-lab': ['same', 'up'],
  'start-early-lab': ['same', 'up'],
  'paycheck-lab': ['up', 'same'],
  'investing-risk-lab': ['down', 'same'],
  'insurance-deductible-lab': ['same', 'down'],
  'car-buying-lab': ['up', 'down'],
  'ab-post-test': ['same', 'up'],
  'engagement-rate-lab': ['down', 'same'],
  'feed-ranking-sandbox': ['same', 'up'],
  'influencer-deal-lab': ['same', 'up'],
  'positioning-map-lab': ['up', 'down'],
  'price-demand': ['same', 'up'],
  'startup-runway': ['same', 'up'],
  'investor-deal-lab': ['same', 'down'],
  'unit-economics-lab': ['down', 'same'],
  'supply-demand': ['same', 'up'],
  'financial-statements': ['same', 'down'],
  'inventory-methods': ['down', 'same'],
  'ratio-dashboard': ['same', 'up'],
  'comparative-advantage': ['same', 'up'],
  'currency-trade': ['down', 'up'],
  'market-entry': ['same', 'down'],
  'offshoring-decision-lab': ['same', 'down'],
  'payroll-lab': ['same', 'up'],
};

// T-Account Lab: [debit account, credit account, amount] for each transaction.
export const T_ACCOUNT_ENTRIES = [
  ['cash', 'capital', 10000], ['cash', 'loan', 15000], ['equipment', 'cash', 20000], ['supplies', 'ap', 800],
  ['cash', 'sales', 1500], ['ar', 'sales', 600], ['fuel', 'cash', 300], ['ap', 'cash', 500],
  ['cash', 'ar', 600], ['loan', 'cash', 1000], ['supexp', 'supplies', 400], ['drawing', 'cash', 700],
];

// Adjusting Entries Lab: [debit account, credit account, amount] for each adjustment, a to g.
export const ADJUSTING_ENTRIES = [
  ['supexp', 'supplies', 650], ['insexp', 'prepaid', 200], ['depexp', 'accdep', 300], ['unearned', 'sales', 300],
  ['wagesexp', 'wagespay', 240], ['intexp', 'intpay', 90], ['ar', 'sales', 400],
];

// Closing Entries Lab: accounts that close in the sort, then [debit, credit, amount] for each closing entry.
export const CLOSING_SORT = ['sales', 'supexp', 'insexp', 'depexp', 'wagesexp', 'intexp', 'fuel', 'drawing'];
export const CLOSING_ENTRIES = [
  ['sales', 'incsum', 5900], ['incsum', 'allexp', 3330], ['incsum', 'capital', 2570], ['capital', 'drawing', 800],
];

// Bank Reconciliation Lab: [where it goes, amount] for each item, in order.
export const BANK_REC_ITEMS = [
  ['bank+', 650], ['bank-', 180], ['book-', 15], ['none', 0], ['book-', 120], ['bank-', 420], ['book+', 5], ['book+', 27],
];

// Product Life Cycle Lab: [stage, index of best marketing move, index of best production call] per product.
export const PLC_ANSWERS = [['intro', 0, 0], ['growth', 0, 0], ['maturity', 0, 0], ['decline', 0, 0]];
