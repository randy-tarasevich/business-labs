// Course pages (/courses/<slug>/) are built for any course with MIN_TOOLS or more tools.
// A page lists every tool that names the course in `courses`, not just its home tools.
// `sequence` sets the suggested teaching order; tools left out of it show under "Also fits this course".
// Each step's `why` is one or two plain sentences on what it builds on. No em-dashes.

export const MIN_TOOLS = 3;

export const courseSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Each course's color token (defined in src/styles/global.css, light and dark).
// courseStyle(c) returns an inline style that sets --course, so markup can use
// bg-(--course), text-(--course), border-(--course) without a class per course.
// A new course needs a token there and an entry here.
export const COURSE_COLORS = {
  'Intro to Business': '--c-intro',
  'Personal Finance': '--c-pf',
  Accounting: '--c-acct',
  Marketing: '--c-mkt',
  Entrepreneurship: '--c-ent',
  'International Business': '--c-intl',
  'Social Media Marketing': '--c-smm',
};
export const courseStyle = (name) => `--course: var(${COURSE_COLORS[name] ?? '--accent'})`;

// Every tool that lists `course`, in the order the course page shows them: the suggested
// sequence first, then the rest ("Also fits this course") in site order. `tools` must already
// be sorted by `order`. Teacher pages use this for their lists and previous/next links.
export function courseOrder(course, tools) {
  const list = tools.filter((t) => t.data.courses.includes(course));
  const byId = new Map(list.map((t) => [t.id, t]));
  const seq = (COURSE_GUIDES[course]?.sequence ?? []).map((s) => byId.get(s.id)).filter(Boolean);
  const inSeq = new Set(seq.map((t) => t.id));
  return [...seq, ...list.filter((t) => !inSeq.has(t.id))];
}

// Class time as text: [20, 30] → "20–30 min", [600, 600] → "10 hr".
export const minutesText = ([a, b]) => (a === b ? `${a} min` : `${a}–${b} min`);
export const hoursText = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ''}`);

export const COURSE_GUIDES = {
  'Intro to Business': {
    intro: 'A tour of how business works, in the order most Intro courses teach it: why trade happens, how markets set prices, how customers react to price, what it takes to make a profit, and how a business keeps its books.',
    sequence: [
      { id: 'comparative-advantage', why: 'Start with economics. Scarcity forces trade-offs, and trading lets both sides end up with more.' },
      { id: 'supply-demand', why: 'From countries to markets. Buyers and sellers meet at a price, and news from a drought to a viral trend moves it.' },
      { id: 'price-demand', why: 'Zoom in on one business. Measure how strongly its customers react when it changes its price.' },
      { id: 'product-life-cycle-lab', why: 'Products age. The right marketing for a brand-new product is the wrong marketing for an old one.' },
      { id: 'marketing-funnel', why: 'Customers have to find you before they can buy. See how many people an ad reaches and whether it paid off.' },
      { id: 'break-even-lab', why: 'Now add costs. How many do you have to sell before the business makes money?' },
      { id: 'startup-runway', why: 'Break-even says how many sales you need. Runway says how long you have to get there.' },
      { id: 'accounting-equation-lab', why: 'Show how a business keeps track of everything it owns and owes.' },
      { id: 'financial-statements', why: 'Close the course by showing where all those transactions end up and how a business reports how it did.' },
    ],
  },
  'Personal Finance': {
    intro: 'Money decisions students will face soon: reading a paycheck, building a budget that works, using a credit card without getting buried, paying for college without borrowing more than you can repay, why the years you save matter as much as the dollars, how to invest without taking more risk than your timeline allows, and how insurance protects it all.',
    sequence: [
      { id: 'paycheck-lab', why: 'Start with what actually lands in your account. Taxes and savings come out before you see a dollar.' },
      { id: 'budget-balancer', why: 'Build a budget from that take-home pay. Every later choice about credit and saving comes out of it.' },
      { id: 'credit-card-payoff-lab', why: 'See what happens when spending goes on a card and only the minimum gets paid.' },
      { id: 'student-loan-simulator', why: 'The biggest loan many students take on comes next. Plan a college budget and check whether the payment fits a starting paycheck.' },
      { id: 'start-early-lab', why: 'Flip it around: when interest works for you instead of against you, starting early is the biggest advantage.' },
      { id: 'investing-risk-lab', why: 'Start Early assumed a smooth 7% every year. Real markets swing, so see how time and the right mix make the swings safer.' },
      { id: 'insurance-deductible-lab', why: 'Close by protecting what you have built. Insurance trades a small sure cost for protection from a big surprise one.' },
    ],
  },
  Accounting: {
    intro: 'A sequence that runs from the accounting equation through financial analysis. The first seven fit Accounting 1; the last three are built for Advanced Accounting.',
    sequence: [
      { id: 'accounting-equation-lab', level: 'Accounting 1', why: 'The foundation. Every later tool assumes students know A = L + E holds after every transaction.' },
      { id: 't-account-lab', level: 'Accounting 1', why: 'Same transactions, written the way accountants do: debits, credits, T-accounts, and a trial balance.' },
      { id: 'adjusting-entries-lab', level: 'Accounting 1', why: 'The trial balance balances, but it isn\'t up to date. Adjust for what was used, earned, and owed before the statements.' },
      { id: 'financial-statements', level: 'Accounting 1', why: 'Once students can post transactions, show where those transactions end up and how the three statements connect.' },
      { id: 'closing-entries-lab', level: 'Accounting 1', why: 'With the statements done, close the month. Revenue, expenses, and drawing reset to zero, and the profit moves into Capital.' },
      { id: 'bank-reconciliation-lab', level: 'Accounting 1', why: 'A new month starts. Before trusting the Cash balance, check it against the bank statement and find out why they disagree.' },
      { id: 'break-even-lab', level: 'Accounting 1', why: 'Separates fixed and variable costs, which students need for cost behavior and managerial accounting.' },
      { id: 'inventory-methods', level: 'Advanced', why: 'Start Advanced Accounting here. Same sales, three methods, three different profits.' },
      { id: 'depreciation', level: 'Advanced', why: 'Another place where the method changes reported profit but not the total. Pairs well right after inventory.' },
      { id: 'ratio-dashboard', level: 'Advanced', why: 'The capstone. Students read finished statements the way a banker would.' },
    ],
  },
  Marketing: {
    intro: 'Tools for the numbers side of marketing: where a product is in its life, where it fits against rivals, what to charge, whether the ads worked, what a customer is worth over time, and how prices change across borders.',
    sequence: [
      { id: 'product-life-cycle-lab', why: 'Start with the product. Where it is in its life decides which price, promotion, and production moves make sense.' },
      { id: 'positioning-map-lab', why: 'Before setting a price, decide where the product fits against rivals and which customers it is for.' },
      { id: 'price-demand', why: 'Move to pricing: how do customers react when the price changes?' },
      { id: 'break-even-lab', why: 'Now add costs. A price only works if enough people buy at it to cover them.' },
      { id: 'marketing-funnel', why: 'Move to promotion: how many people an ad reaches, and whether the campaign paid for itself.' },
      { id: 'unit-economics-lab', why: 'The campaign brought in customers. Now ask what each one is worth over time, and whether that beats what it cost to win them.' },
      { id: 'currency-trade', why: 'Take pricing global. Exchange rates and tariffs change the shelf price without the company doing anything.' },
    ],
  },
  Entrepreneurship: {
    intro: 'A path that follows a student business idea from first price to first investor. Each tool can use the numbers from a student\'s own business plan.',
    sequence: [
      { id: 'positioning-map-lab', why: 'Start with the idea. Is there a group of customers no one is serving well?' },
      { id: 'price-demand', why: 'Then find out what those customers will actually pay.' },
      { id: 'break-even-lab', why: 'With a price set, find how many sales it takes to cover costs.' },
      { id: 'startup-runway', why: 'Add startup costs and see how long the money lasts while sales grow.' },
      { id: 'marketing-funnel', why: 'Plan how to find customers and what each one will cost to win.' },
      { id: 'unit-economics-lab', why: 'Before scaling up the marketing, check that each customer is worth more than they cost to win. Investors will ask.' },
      { id: 'investor-deal-lab', why: 'If the runway is short, students pitch for money and learn what their ask says the business is worth.' },
      { id: 'ratio-dashboard', why: 'Read the business the way a lender or investor will.' },
      { id: 'business-plan', why: 'The capstone. Students put their own idea and every number from the earlier tools into one complete plan.' },
    ],
  },
  'International Business': {
    intro: 'Why countries trade, what happens to prices when goods cross borders, and how a company decides the way it will go global.',
    sequence: [
      { id: 'comparative-advantage', why: 'Start with why trade happens at all: both sides can end up with more.' },
      { id: 'currency-trade', why: 'Once goods cross borders, exchange rates and tariffs change what they cost on the shelf.' },
      { id: 'offshoring-decision-lab', why: 'Use tariffs and exchange rates to make a real decision: should the product be made at home or overseas?' },
      { id: 'market-entry', why: 'Bring it together from a company\'s point of view: the safest and most profitable way into a new country.' },
    ],
  },
  'Social Media Marketing': {
    intro: 'The numbers behind social media: whether an audience is really paying attention, which creator is worth paying, and whether a campaign turned likes into sales.',
    sequence: [
      { id: 'engagement-rate-lab', why: 'Start with the number every brand checks first. A big follower count can hide an audience that never interacts.' },
      { id: 'feed-ranking-sandbox', why: 'Engagement is what feeds reward. Build the algorithm yourself and see why some posts rise and others disappear.' },
      { id: 'influencer-deal-lab', why: 'Use engagement rate to compare creators. The biggest account is often not the best deal.' },
      { id: 'ab-post-test', why: 'Before spending money on a post, test two versions. Learn when a winner is real and when it is just luck.' },
      { id: 'marketing-funnel', why: 'Follow a paid campaign from views to sales and find out if it paid for itself.' },
      { id: 'unit-economics-lab', why: 'Look past the first sale. A follower who buys once is worth less than one who keeps coming back.' },
    ],
  },
};
