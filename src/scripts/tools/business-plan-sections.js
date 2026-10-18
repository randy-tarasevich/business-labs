// Business Plan Builder: the sections, their questions, and the example plan.
// Field types: text (one line), long (paragraph), money ($ number), number, percent,
// costs (list of [label, amount] rows), competitors (rows of { name, strong, weak }).
// `starter` shows as placeholder text. `example` is what the sample business wrote.
// Required fields count toward a section's progress; optional ones don't.

export const SECTIONS = [
  {
    id: 'idea',
    title: 'The idea',
    intro: 'Explain what your business does and why anyone needs it. Keep it short and specific.',
    fields: [
      { id: 'name', type: 'text', label: 'Business name', starter: 'Pick a name customers will remember', example: 'Pawsome Treats' },
      { id: 'oneLiner', type: 'long', label: 'What does your business do, in one sentence?', starter: 'We sell ___ to ___ so they can ___.', example: 'We bake healthy, homemade dog treats and sell them to local dog owners who want snacks without junk ingredients.' },
      { id: 'problem', type: 'long', label: 'What problem does it solve?', starter: 'Right now, ___ have trouble ___ because ___.', example: 'Most store-bought dog treats are full of fillers and ingredients owners can\'t pronounce. Owners who care about their dog\'s health have few local options.' },
      { id: 'customer', type: 'long', label: 'Who is your customer?', starter: 'Our customers are ___ who ___.', example: 'Dog owners in our town, especially families and older adults who treat their dog like part of the family and will pay a little more for quality.' },
      { id: 'why', type: 'long', label: 'Why are you the right person to start it?', starter: 'I know ___ because ___.', example: 'I have two dogs, I already bake treats for friends\' dogs, and I volunteer at the animal shelter, so I know a lot of local dog owners.', optional: true },
    ],
  },
  {
    id: 'market',
    title: 'The market',
    intro: 'Who exactly will buy, how many of them are there, and who are you up against?',
    fields: [
      { id: 'target', type: 'long', label: 'Describe your target customer', starter: 'Age, where they live, what they care about, how they shop.', example: 'Adults 30 to 65 in our town who own a dog, shop at the farmers market, and follow local pet pages online.' },
      { id: 'marketPeople', type: 'number', label: 'How many target customers live in the area you\'ll serve?', starter: 'Estimate', example: 3000, hint: 'Look it up or make a careful estimate. Explain your source in class.' },
      { id: 'marketPct', type: 'percent', label: 'What percent of them do you think will buy?', starter: '%', example: 5, hint: 'Be realistic. Most new businesses reach only a few percent.' },
      { id: 'marketFreq', type: 'number', label: 'How many times a year does a customer buy?', starter: 'Times per year', example: 12 },
      { id: 'competitors', type: 'competitors', label: 'Your competitors', hint: 'List up to three. Include big stores and online shops, not just local businesses.',
        example: [
          { name: 'Pet store chain', strong: 'Huge selection, open every day', weak: 'Treats are mass-produced with fillers' },
          { name: 'Online treat shops', strong: 'Easy to order, lots of flavors', weak: 'Shipping costs, no local connection' },
          { name: 'Homemade (owners bake their own)', strong: 'Cheap, they know the ingredients', weak: 'Takes time most owners don\'t have' },
        ] },
      { id: 'edge', type: 'long', label: 'What makes you different?', starter: 'Unlike ___, we ___.', example: 'Unlike the pet store, every treat is baked fresh in small batches with five ingredients or fewer, and customers can meet us at the market.' },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing',
    intro: 'The 4 Ps: what you sell, what it costs, where people buy it, and how they hear about it.',
    fields: [
      { id: 'product', type: 'long', label: 'Product: what exactly do you sell?', starter: 'Sizes, flavors, packages, extras...', example: 'Bags of 12 treats in three flavors: peanut butter, pumpkin, and sweet potato. Custom birthday treats on request.' },
      { id: 'priceWhy', type: 'long', label: 'Price: why that price?', starter: 'Compare to competitors and to your cost. You set the number in The money.', example: 'At $8 a bag we cost a little more than the pet store but less than online shops after shipping. Each bag costs us $3 to make.' },
      { id: 'place', type: 'long', label: 'Place: where and how do customers buy?', starter: 'Store, market, website, delivery...', example: 'Saturday farmers market booth, plus local delivery for orders placed through our Instagram page.' },
      { id: 'promotion', type: 'long', label: 'Promotion: how will customers find out about you?', starter: 'Social media, flyers, events, word of mouth...', example: 'Free samples at the market, an Instagram page with photos of customers\' dogs, and flyers at the vet\'s office and dog park.' },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    intro: 'How the business actually runs day to day.',
    fields: [
      { id: 'location', type: 'long', label: 'Where will you make or run it?', starter: 'Home, rented space, online...', example: 'We bake at home in my family\'s kitchen two evenings a week and sell at the market on Saturdays.' },
      { id: 'suppliers', type: 'long', label: 'What do you need to buy, and from where?', starter: 'Materials, ingredients, equipment...', example: 'Flour, oats, peanut butter, and pumpkin from the grocery warehouse store. Bags and labels from an online packaging supplier.' },
      { id: 'team', type: 'long', label: 'Who does the work? What does each person do?', starter: 'Name each role.', example: 'I bake and handle money. My sister runs the Instagram page and helps at the booth. My dad drives deliveries.' },
      { id: 'hours', type: 'long', label: 'When will you operate?', starter: 'Days and times', example: 'Baking Tuesday and Thursday evenings, market Saturdays 8 to 1, deliveries Sunday afternoons.', optional: true },
    ],
  },
  {
    id: 'money',
    title: 'The money',
    intro: 'Your costs and sales forecast. The numbers update as you type, so you can test ideas.',
    fields: [
      { id: 'price', type: 'money', label: 'Price per item', example: 8 },
      { id: 'unitCost', type: 'money', label: 'Cost to make one item', example: 3, hint: 'Materials, ingredients, and packaging for one item.' },
      { id: 'units', type: 'number', label: 'Items sold in your first month', example: 60 },
      { id: 'growth', type: 'percent', label: 'Sales growth per month', example: 10, hint: 'How much sales grow each month as word spreads.', optional: true },
      { id: 'startup', type: 'costs', label: 'Startup costs (one time)', hint: 'Things you buy once before you open.',
        example: [['Mixer and baking pans', 250], ['Cookie cutters and supplies', 60], ['First packaging and labels', 120], ['Business license and permits', 75]] },
      { id: 'fixed', type: 'costs', label: 'Monthly fixed costs', hint: 'Bills you pay every month, even if you sell nothing.',
        example: [['Farmers market booth fee', 80], ['Online shop subscription', 15], ['Gas for deliveries', 40]] },
    ],
  },
  {
    id: 'funding',
    title: 'Funding',
    intro: 'How much money you need to open and keep going until the business pays for itself, and where it comes from.',
    fields: [
      { id: 'savings', type: 'money', label: 'Your own savings', example: 300, optional: true },
      { id: 'family', type: 'money', label: 'Gifts or loans from family', example: 250, optional: true },
      { id: 'loan', type: 'money', label: 'Bank or other loan', example: 0, optional: true },
      { id: 'investor', type: 'money', label: 'Money from an investor', example: 0, optional: true },
      { id: 'investorPct', type: 'percent', label: 'Share of the business the investor gets', example: 0, optional: true },
      { id: 'fundingPlan', type: 'long', label: 'How will you pay people back?', starter: 'Who gets paid back, how much, and when?', example: 'I will pay my parents back $250 from profits by month 4. My savings stay in the business.' },
    ],
  },
  {
    id: 'summary',
    title: 'Summary',
    intro: 'Write this last. In one paragraph, sell your whole plan to someone who will only read this part.',
    fields: [
      { id: 'summary', type: 'long', rows: 8, label: 'Executive summary', starter: 'Business name, what you sell, the problem, your customer, what makes you different, your price, and the key numbers.', example: 'Pawsome Treats bakes healthy, homemade dog treats for local dog owners who want snacks without junk ingredients. Unlike the pet store, every treat is baked fresh in small batches with five ingredients or fewer. We sell 12-treat bags for $8 at the Saturday farmers market and through local delivery. Each bag costs $3 to make, so we break even at 27 bags a month and expect to sell 60 in our first month. We need about $505 to open, which we have from savings and a family loan that we will repay by month 4.' },
    ],
  },
];

/** Every field, keyed by id. */
export const FIELDS = Object.fromEntries(SECTIONS.flatMap((s) => s.fields.map((f) => [f.id, f])));

/** A blank plan. */
export function blankPlan() {
  const plan = { v: 1 };
  for (const f of Object.values(FIELDS)) {
    if (f.type === 'costs') plan[f.id] = [['', ''], ['', '']];
    else if (f.type === 'competitors') plan[f.id] = [{ name: '', strong: '', weak: '' }, { name: '', strong: '', weak: '' }, { name: '', strong: '', weak: '' }];
    else plan[f.id] = '';
  }
  return plan;
}

/** The finished example plan (Pawsome Treats). */
export function examplePlan() {
  const plan = { v: 1 };
  for (const f of Object.values(FIELDS)) plan[f.id] = structuredClone(f.example ?? '');
  return plan;
}
