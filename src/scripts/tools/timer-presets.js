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
      html: "<p>Take-home pay: <b>$2,400 a month</b>. Rent: <b>$800</b>.</p><p>Sketch how you'd spend the rest.</p><p class='text-muted text-[0.85em]'>Then 2–3 people share.</p>",
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
      html: "<p>Scan the QR code or go to <b>forms.gle/Za5Q9QmpoCHe74QQ8</b></p><p>Voice level <b>0</b>. Work on your own.</p><p class='text-muted text-[0.85em]'>Rate yourself honestly on each \"I can\" statement.</p>",
      messages: { ready: 'Get ready.', running: 'Work on your own.', lastMinute: '1 minute left.', end: 'Time! Eyes up in 3, 2, 1.' },
    },
  ],
  'build-the-fund': [
    {
      id: 'build', tab: 'Build the Fund · 7:00', title: 'Build the Fund', secs: 420, kind: 'steps', default: true,
      steps: [
        ['Circle and total', 'Circle every essential expense, then add them up'],
        ['Find the target', 'Essential expenses × 3, not the $2,400 paycheck'],
        ['Find the timeline', 'Target ÷ monthly savings. Round up.'],
        ['Switch roles: Part 2', 'Fill in the table. What would finish in 12 months?'],
        ['Name the trade-off', 'Which line moves, and what does it cost the person?'],
      ],
      stepStarts: [0, 60, 120, 210, 330],
      messages: {
        ready: '7 minutes with your partner. Partner A calculates, Partner B checks criteria 1 and 2.',
        running: 'Partner A calculates, Partner B checks criteria 1 and 2.',
        half: 'Switch roles. Start Part 2.',
        lastMinute: '1 minute left. Finish your trade-off answer.',
        end: 'Pencils down. Eyes up in 3, 2, 1.',
      },
    },
    {
      id: 'feedback', tab: 'Move + Feedback · 2:00', title: 'Move + Peer Feedback', secs: 120, kind: 'steps',
      steps: [
        ['Move', 'Partner B moves clockwise. Partner A stays.'],
        ['Check the card', "Traveler: check the host's card against criteria 1, 2, and 3"],
        ['Write one fix', '"One thing to fix is ___ because criterion # ___ says ___."'],
      ],
      stepStarts: [0, 60, 90],
      messages: {
        ready: 'Partner B, get ready to move clockwise.',
        running: 'Partner B moves clockwise. Partner A stays.',
        half: "Seated? Traveler, read your host's card.",
        lastMinute: "1 minute left. Host: make the fix or explain why it's right.",
        end: 'Time. Flip the Emergency card.',
      },
    },
    {
      id: 'emergency', tab: 'Emergency · 5:00', title: 'Month 4: Emergency Strikes', secs: 300, kind: 'steps',
      steps: [
        ['Read', 'Flip the Emergency card. What happened in month 4?'],
        ['Weigh the options', 'What does each option cost the person?'],
        ['Recommend', '"We recommend ___ because ___ (number)."'],
        ['Count the months', 'How many extra months does this add to the timeline?'],
      ],
      stepStarts: [0, 45, 150, 240],
      messages: {
        ready: '5 minutes with your new partner.',
        running: 'Decide together. Back it up with a number.',
        half: 'Time to write your recommendation.',
        lastMinute: '1 minute left. Does your recommendation include a number?',
        end: 'Pencils down. Eyes up in 3, 2, 1.',
      },
    },
    {
      id: 'exit', tab: 'Exit ticket · 2:30', title: 'Exit ticket', secs: 150, kind: 'info',
      html: "<p>Scan the QR code on the slide.</p><p>Voice level <b>0</b>. Work on your own.</p><p class='text-muted text-[0.85em]'>Rate yourself honestly on each success criterion.</p>",
      messages: { ready: 'Get ready.', running: 'Work on your own.', lastMinute: '1 minute left.', end: 'Time! Eyes up in 3, 2, 1.' },
    },
  ],
};
