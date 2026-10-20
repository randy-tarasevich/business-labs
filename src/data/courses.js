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

export const COURSE_GUIDES = {
  'Intro to Business': {
    intro: 'A tour of how business works, in the order most Intro courses teach it: why trade happens, how markets set prices, how customers react to price, what it takes to make a profit, and how a business keeps its books.',
    sequence: [
      { id: 'comparative-advantage', why: 'Start with economics. Scarcity forces trade-offs, and trading lets both sides end up with more.' },
      { id: 'supply-demand', why: 'From countries to markets. Buyers and sellers meet at a price, and news from a drought to a viral trend moves it.' },
      { id: 'price-demand', why: 'Zoom in on one business. Measure how strongly its customers react when it changes its price.' },
      { id: 'marketing-funnel', why: 'Customers have to find you before they can buy. See how many people an ad reaches and whether it paid off.' },
      { id: 'break-even-lab', why: 'Now add costs. How many do you have to sell before the business makes money?' },
      { id: 'startup-runway', why: 'Break-even says how many sales you need. Runway says how long you have to get there.' },
      { id: 'accounting-equation-lab', why: 'Show how a business keeps track of everything it owns and owes.' },
      { id: 'financial-statements', why: 'Close the course by showing where all those transactions end up and how a business reports how it did.' },
    ],
  },
  Accounting: {
    intro: 'A sequence that runs from the accounting equation through financial analysis. The first three fit Accounting 1; the last three are built for Advanced Accounting.',
    sequence: [
      { id: 'accounting-equation-lab', level: 'Accounting 1', why: 'The foundation. Every later tool assumes students know A = L + E holds after every transaction.' },
      { id: 'financial-statements', level: 'Accounting 1', why: 'Once students can post transactions, show where those transactions end up and how the three statements connect.' },
      { id: 'break-even-lab', level: 'Accounting 1', why: 'Separates fixed and variable costs, which students need for cost behavior and managerial accounting.' },
      { id: 'inventory-methods', level: 'Advanced', why: 'Start Advanced Accounting here. Same sales, three methods, three different profits.' },
      { id: 'depreciation', level: 'Advanced', why: 'Another place where the method changes reported profit but not the total. Pairs well right after inventory.' },
      { id: 'ratio-dashboard', level: 'Advanced', why: 'The capstone. Students read finished statements the way a banker would.' },
    ],
  },
  Marketing: {
    intro: 'Tools for the numbers side of marketing: what to charge, whether the ads worked, and how prices change across borders.',
    sequence: [
      { id: 'price-demand', why: 'Open the pricing unit by showing how customers react to price.' },
      { id: 'break-even-lab', why: 'Now add costs. A price only works if enough people buy at it to cover them.' },
      { id: 'marketing-funnel', why: 'Move to promotion: how many people an ad reaches, and whether the campaign paid for itself.' },
      { id: 'currency-trade', why: 'Take pricing global. Exchange rates and tariffs change the shelf price without the company doing anything.' },
    ],
  },
  Entrepreneurship: {
    intro: 'A path that follows a student business idea from first price to first investor. Each tool can use the numbers from a student\'s own business plan.',
    sequence: [
      { id: 'price-demand', why: 'Before building anything: what will customers actually pay?' },
      { id: 'break-even-lab', why: 'With a price set, find how many sales it takes to cover costs.' },
      { id: 'startup-runway', why: 'Add startup costs and see how long the money lasts while sales grow.' },
      { id: 'marketing-funnel', why: 'Plan how to find customers and what each one will cost to win.' },
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
      { id: 'influencer-deal-lab', why: 'Use engagement rate to compare creators. The biggest account is often not the best deal.' },
      { id: 'marketing-funnel', why: 'Follow a paid campaign from views to sales and find out if it paid for itself.' },
    ],
  },
};
