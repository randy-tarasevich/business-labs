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
};

// Predictions: the right answer for each card, in order ('up', 'down', or 'same').
export const PREDICTION_ANSWERS = {
  'break-even-lab': ['same', 'up'],
  depreciation: ['same', 'down'],
  'marketing-funnel': ['up', 'same'],
  'student-loan-simulator': ['down', 'same'],
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
