// Course pages (/courses/<slug>/) are built for any course with MIN_TOOLS or more tools.
// A page lists every tool that names the course in `courses`, not just its home tools.
// `sequence` sets the suggested teaching order; tools left out of it show under "Also fits this course".
// Each step's `why` is one or two plain sentences on what it builds on. No em-dashes.

export const MIN_TOOLS = 3;

export const courseSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const COURSE_GUIDES = {
  'Intro to Business': {
    intro: 'Three tools that show students how a small business works from the inside: what it costs, how long the money lasts, and how the books stay balanced.',
    sequence: [
      { id: 'break-even-lab', why: 'Start with the question every business owner asks first: how many do I have to sell?' },
      { id: 'startup-runway', why: 'Break-even says how many sales you need. Runway says how long you have to get there.' },
      { id: 'accounting-equation-lab', why: 'Close the unit by showing how a business keeps track of everything it owns and owes.' },
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
      { id: 'ratio-dashboard', why: 'Finish by reading the business the way a lender or investor will.' },
    ],
  },
  'International Business': {
    intro: 'Why countries trade, what happens to prices when goods cross borders, and how a company decides the way it will go global.',
    sequence: [
      { id: 'comparative-advantage', why: 'Start with why trade happens at all: both sides can end up with more.' },
      { id: 'currency-trade', why: 'Once goods cross borders, exchange rates and tariffs change what they cost on the shelf.' },
      { id: 'market-entry', why: 'Bring it together from a company\'s point of view: the safest and most profitable way into a new country.' },
    ],
  },
};
