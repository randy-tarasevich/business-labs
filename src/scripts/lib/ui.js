// Shared Tailwind class strings for the tools.
// .astro markup and markup built in tool scripts both use these, so a panel, button, or table
// looks the same wherever it comes from. Keep every class written out in full: Tailwind only
// generates classes it can find as complete strings in the source.
//
// State colors: scripts set data-tone="good" | "bad" | "warn" | "info" (see setTone in util.js)
// and the classes below style each tone with the tone-* variants defined in global.css.

/** Outer wrapper of every tool. */
export const TOOL = 'grid gap-[18px]';

/** Card that holds a group of inputs, a chart, or the lower "The math" and "Try it" sections. */
export const PANEL = 'bg-panel border border-line rounded-[10px] p-[18px] grid gap-4 content-start min-w-0';

/** Same card with tighter spacing, for a chart and the results under it. Never combine PANEL with another gap class. */
export const PANEL_TIGHT = 'bg-panel border border-line rounded-[10px] p-[18px] grid gap-3 content-start min-w-0';

/** Two equal columns under the main bench ("The math" + "Try it"). */
export const LOWER = 'grid grid-cols-2 gap-[18px] max-[860px]:grid-cols-1';

export const H2 = 'font-display font-semibold text-[18px]';
export const H3 = 'font-display font-semibold text-[15px]';
export const HINT = 'text-[12.5px] text-muted';
/** Explanatory paragraph in a panel. */
export const PROSE = 'max-w-[65ch]';

/** Preset buttons are created by presetButtons() in util.js, so the wrapper styles its children. */
export const PRESETS =
  'flex flex-wrap gap-1.5 *:font-sans *:font-medium *:text-[13px] *:leading-[normal] *:text-ink *:bg-transparent *:border *:border-line *:rounded-full *:py-[5px] *:px-[11px] *:cursor-pointer *:hover:border-accent *:aria-pressed:bg-accent *:aria-pressed:border-accent *:aria-pressed:text-panel';

/** Number box next to a slider. Add a width class (w-[100px] is the usual). */
export const NUM_INPUT =
  'font-mono font-medium text-[15px] leading-[normal] text-ink bg-bg border border-line rounded-md py-1 px-2 text-right tabular-nums';
/** Smaller number box for table cells and line items. Add a width class. */
export const NUM_INPUT_SM =
  'font-mono font-medium text-[14px] leading-[normal] text-ink bg-bg border border-line rounded-md py-[3px] px-1.5 text-right tabular-nums';
export const NUM_UNIT = 'text-muted font-mono';
export const RANGE = 'w-full accent-accent';
export const SELECT = 'font-sans font-medium text-[14px] leading-[normal] text-ink bg-bg border border-line rounded-md py-1.5 px-2';

/** Free-text inputs for written answers. */
export const TEXT_INPUT = 'w-full font-sans text-[15px] leading-[1.4] text-ink bg-bg border border-line rounded-lg py-2 px-2.5';
export const TEXTAREA = 'w-full font-sans text-[15px] leading-[1.4] text-ink bg-bg border border-line rounded-lg py-2 px-2.5 resize-y';

/** Bordered group of inputs with a legend. */
export const FIELDSET = 'border border-line rounded-lg pt-2.5 px-3 pb-3 m-0 grid gap-3 min-w-0';
export const LEGEND = 'font-semibold text-[14px] px-1';

/** Chart legend row; each child is a <span> holding a swatch <i> and a label. */
export const CHART_KEY = 'flex flex-wrap gap-3.5 text-[13px] text-muted *:inline-flex *:items-center *:gap-1.5';
export const SWATCH = 'w-3 h-3 rounded-[2px] inline-block';
/** SVG chart. Text inside gets the chart font unless an element sets its own style. */
export const SVG = 'block w-full h-auto [&_text]:font-mono [&_text]:text-[12px] [&_text]:fill-muted';

/** Row of four result stats (two on phones). */
export const RESULTS = 'grid grid-cols-4 gap-2.5 max-[620px]:grid-cols-2';
export const STAT = 'group border-t-2 border-line pt-2 grid gap-0.5 min-w-0 content-start';
export const STAT_KEY = 'group border-t-2 border-accent pt-2 grid gap-0.5 min-w-0 content-start';
export const STAT_K = 'text-[12px] text-muted';
export const STAT_V =
  'font-mono font-medium text-[20px] leading-[normal] tabular-nums wrap-anywhere group-tone-good:text-good group-tone-bad:text-bad group-tone-warn:text-warn';

/** One-line takeaway under a chart. Hidden while empty. */
export const VERDICT =
  'rounded-lg py-2.5 px-3.5 text-[14.5px] empty:hidden tone-good:bg-good-soft tone-bad:bg-bad-soft tone-warn:bg-warn-soft tone-info:bg-accent/12';

/** Worked math. The first line is plain text; each child <span> is a line of work under it. */
export const FORMULA =
  'font-mono font-medium text-[15px] leading-[normal] bg-bg rounded-lg py-3 px-3.5 overflow-x-auto whitespace-nowrap *:block *:mt-1 *:text-muted *:text-[13.5px]';

export const BTN =
  'font-sans font-semibold text-[14px] leading-[normal] text-panel bg-accent border border-accent rounded-lg py-2 px-3.5 cursor-pointer disabled:opacity-45 disabled:cursor-default';
export const BTN_GHOST =
  'font-sans font-medium text-[14px] leading-[normal] text-ink bg-transparent border border-line rounded-lg py-2 px-3.5 cursor-pointer hover:border-accent';

/** "Try it" questions. Hint buttons carry data-reveal (see wireReveals in util.js). */
export const QS = 'm-0 pl-5 grid gap-2.5 list-decimal';
export const REVEAL =
  'font-sans font-medium text-[13px] leading-[normal] bg-transparent border border-line text-accent rounded-md py-[3px] px-[9px] cursor-pointer ml-1';
export const ANS = 'block mt-1 text-muted text-[14px]';

/** Data table: headers muted, numbers right-aligned in mono, row labels on the left. */
export const TABLE_BOX = 'overflow-x-auto';
export const TABLE =
  'w-full border-collapse text-[14px] [&_th]:py-1.5 [&_th]:px-2 [&_td]:py-1.5 [&_td]:px-2 [&_th]:border-b [&_td]:border-b [&_th]:border-line [&_td]:border-line [&_th]:text-right [&_td]:text-right [&_thead_th]:text-[12.5px] [&_thead_th]:text-muted [&_thead_th]:font-semibold [&_thead_th]:border-b-2 [&_tbody_th]:text-left [&_tbody_th]:font-normal [&_tbody_th]:pl-0 [&_td]:font-mono [&_td]:font-medium [&_td]:leading-[normal] [&_td]:tabular-nums [&_td]:whitespace-nowrap';
/** Visually hidden, still read by screen readers. */
export const SR = 'sr-only';
