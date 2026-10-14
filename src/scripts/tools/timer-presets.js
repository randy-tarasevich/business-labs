// Timer presets. Add a new lesson's timed moments here, then reference the key
// from a tool's frontmatter: props: { preset: "your-key" }.
//
// Segment kinds:
//   "info"  -> shows `html` beside the clock
//   "steps" -> shows a step list; the current step highlights based on `stepStarts` (seconds elapsed)
// Banner messages: ready, running, half (steps only), lastMinute, end

export const TIMER_PRESETS = {
  'balance-the-budget': [
    {
      id: 'warm', tab: 'Warm-up · 1:30', title: 'Warm-up', secs: 90, kind: 'info',
      html: "<p>Take-home pay: <b>$2,400 a month</b>. Rent: <b>$800</b>.</p><p>Sketch how you'd spend the rest.</p><p class='muted'>Then 2–3 people share.</p>",
      messages: { ready: 'Get ready.', running: "You've got this.", lastMinute: '1 minute left.', end: 'Time! Eyes up in 3, 2, 1.' },
    },
    {
      id: 'pair', tab: 'Pair task · 10:00', title: 'Balance the Budget', secs: 600, kind: 'steps', default: true,
      steps: [
        ['Label', 'N, W, or S next to every line'],
        ['Total', 'Add up needs, wants, and savings'],
        ['Find the gap', 'Total − $2,400 = how far over?'],
        ['Cut or change', "New $ column until it's exactly $2,400"],
        ['Write two trade-offs', 'Each with a "because" and a number'],
      ],
      stepStarts: [0, 120, 240, 300, 480],
      messages: {
        ready: '10 minutes with your partner. Partner A reads, Partner B labels.',
        running: 'Partner A reads, Partner B labels.',
        half: 'Halfway. You should be on Step 3. Switch reader and labeler.',
        lastMinute: '1 minute left. Finish your trade-off sentences.',
        end: 'Pencils down. Eyes up in 3, 2, 1.',
      },
    },
    {
      id: 'exit', tab: 'Exit ticket · 3:00', title: 'Exit ticket', secs: 180, kind: 'info',
      html: "<p>Scan the QR code or go to <b>forms.gle/Za5Q9QmpoCHe74QQ8</b></p><p>Voice level <b>0</b>. Work on your own.</p><p class='muted'>Rate yourself honestly on each \"I can\" statement.</p>",
      messages: { ready: 'Get ready.', running: 'Work on your own.', lastMinute: '1 minute left.', end: 'Time! Eyes up in 3, 2, 1.' },
    },
  ],
};
