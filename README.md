# Business Labs

Interactive tools for high school business and personal finance classes.
Astro + Tailwind v4, plain JavaScript, deployed on Cloudflare Pages.

**No accounts, no student data.** Every tool runs entirely in the browser. Nothing is stored on a server.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
```

## Deploy (Cloudflare Workers)

Connected to Cloudflare through Git: every push to `main` builds and deploys.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy` (reads `wrangler.jsonc`, uploads `dist/` as static assets)
- Custom domain: add it in the Worker's Settings → Domains & Routes, then update `site` in `astro.config.mjs`.

## Add a tool

1. **Component:** `src/components/tools/MyTool.astro` (markup) and `src/scripts/tools/my-tool.js` (behavior, exports an `init(root)` function).
2. **Styles:** Tailwind utility classes only, no CSS files. See [Styling](#styling).
3. **Register it:** import it in `src/components/tools/index.js`.
4. **Content:** add `src/content/tools/my-tool.md`. Frontmatter is the tool's metadata (courses, unit, class minutes, standards). `courses` is a list: the first is the tool's home section on the index page, the rest show as "Also fits". The markdown body becomes the teacher notes page at `/teachers/<slug>/`.
5. **Course sequence:** if the tool belongs in a course's suggested order, add it to `COURSE_GUIDES` in `src/data/courses.js`. Course pages appear on their own once a course has 3 tools.

The home page, tool page, teacher notes pages, and standards coverage page all build from the content files automatically.

## Styling

Everything is styled with Tailwind v4 utilities. There are no per-tool CSS files.

- **Colors** are the tokens in `src/styles/global.css` (`bg-panel`, `text-muted`, `border-line`, `text-good`, `bg-bad-soft`, ...). They switch for dark mode on their own, so never hard-code a hex color.
- **Shared pieces** live in `src/scripts/lib/ui.js` as class strings (`PANEL`, `BTN`, `VERDICT`, `TABLE`, ...), plus three components in `src/components/ui/`: `RangeField` (slider + number box), `Stat`, and `TryIt`. Use them so every tool looks the same.
- **Markup built in scripts** uses the same `ui.js` strings or literal classes. Write every class out in full (`'bg-good'`, not `` `bg-${tone}` ``): Tailwind only generates classes it can find as complete strings in the source.
- **State colors:** scripts call `setTone(el, 'good' | 'bad' | 'warn' | 'info')` from `util.js`, which sets `data-tone`. Markup styles each state with the `tone-good:`, `tone-bad:`, `tone-warn:`, `tone-info:` variants (and `group-tone-*:` for children). Other states use attributes too (`aria-pressed`, `data-changed`), never swapped class names.
- **Theme:** the page's theme lives in `data-theme="light|dark"` on `<html>`, set before paint by `Base.astro` from the header toggle, `?theme=`, or the device. Use the `dark:` variant if you need it (it follows `data-theme`). Charts that read colors with `cssVar()` must redraw on `onThemeChange()`; colors written as `var(--token)` update on their own.
- **Phone results bar:** add `data-live` (or `live` on `<Stat>`) to one or two key results, or to the `VERDICT` line if the tool has no stats. On phones, those results pin to the bottom of the screen while the student is working the inputs. Mark every tool whose inputs sit above its chart.
- **Slider ranges:** `linkRange`'s `sync()` sizes each slider to the value it loads (`fitRange` in `util.js`), so a $2 price isn't stuck at the left of a $50 track. Call `sync()` when a preset loads, never on every edit. Pass `fit: false` if your script sets that slider's max itself. Tools with their own slider code call `fitRange` on preset load.
- **Money boxes:** a `RangeField` with `unit="$"` and a fractional `step` shows two decimals. Write values into number boxes with `setBox()` from `util.js` (`linkRange` already does).
- **Course colors:** each course has a color token (`--c-intro`, `--c-acct`, ...) in `global.css`, mapped from the course name in `COURSE_COLORS` in `src/data/courses.js`. Put `style={courseStyle(course)}` on a wrapper, then use `bg-(--course)`, `text-(--course)`, or `border-(--course)` inside it. Use them for wayfinding only (dots, borders, chips), never for good/bad meaning. A new course needs a token in both themes and an entry in `COURSE_COLORS`.
- **Gotcha:** a class on an element loses to a parent's `[&_td]:...` rule. If a table cell needs to differ from the table's defaults, use `!` (`font-semibold!`) or give the table its own class string.

## Teacher notes

Teacher notes live at `/teachers/` (bookmark it). Those pages are marked `noindex` and are not linked from any student page, so student tool pages never contain answer keys. This is not a login: anyone with the URL can open it. Once the site has a custom domain, protect `/teachers/*` with Cloudflare Access.

## Standards

Only add MBA Research indicator codes you've verified against the official documents. Tools with no codes show up as "Not yet aligned" on `/standards/`.

Current codes were checked word for word against MBA Research's published standards pages (October 2026): the [Business Administration Core](https://www.mbaresearch.org/local-educators/teaching-resources/standards/business-administration-core/) and the Marketing & Sales, Financial Services, and Management & Entrepreneurship cluster pages. Copy the indicator text and level (PQ, CS, SP, SU, MN, ON) exactly as written there.

## Print

Every tool page (except the class timer and the Business Plan Builder, which prints itself) has a **Print** button. It prints a worksheet: name, date, and class lines, the student's current numbers, the chart and results, "The math," and the "Try it" questions with blank answer lines. Sliders, preset buttons, and hints are left off, and it always prints in light colors. Print rules live in `global.css`; the answer lines come from `src/scripts/lib/print.js`. New tools get this for free as long as their Try it list uses `QS` (or the `TryIt` component).

## Embed mode

Add `?embed=1` to any tool URL (or click **Project** on the tool page) to hide the site header and footer. The tool title stays, and the page scales up on wide screens so it reads from the back of the room. Use it for projecting or for linking from slides. Add `&theme=light` or `&theme=dark` to force a theme for that link without changing anyone's saved setting. The `embed:` variant styles anything that should differ in projector view.

In projector view, the explanation panel and the Try it questions start collapsed behind **Show** buttons, so answers don't appear until the teacher opens them. This covers both panels in a tool's `LOWER` section and any `TryIt` panel. Add `data-projector-collapse` to any other panel that should start collapsed (see `src/scripts/lib/projector.js`).

## Share links

Every tool page (except the class timer, Business Plan Builder, Budget Balancer, Accounting Equation Lab, T-Account Lab, and Adjusting Entries Lab) keeps its current numbers in the URL. Change a value and the address bar updates; **Copy link** copies it. Anyone who opens the link sees the tool exactly as it was left: same preset, same numbers, same results. Post a scenario in Google Classroom so the class starts from the same place, or have students turn in a link as their answer. The **Project** button carries the current numbers into projector view too. Nothing is sent to the site; the state lives only in the link.

New tools get this for free (`src/scripts/lib/share-state.js`). It saves number boxes, checkboxes, selects, radio groups, and the last pick in each `[data-presets]` or `[data-tabs]` group. Keep input ids stable (no random suffixes), since links use them as keys; inputs without an id are saved by position. Put `data-no-share` on anything that shouldn't be saved. A tool whose state isn't plain inputs goes in `SKIP_SHARE` in `src/pages/tools/[slug].astro`.

## Copy my results

Every tool with share links also has a **Copy results** button. It copies a plain-text summary to the clipboard: the tool name, the example picked, the student's numbers with labels and units, the results (every `Stat`, the verdict line), and a share link that reopens the tool with those numbers. Students paste it into a Google Form or Doc as an exit ticket. Nothing is sent anywhere.

New tools get this for free (`src/scripts/lib/copy-results.js`, with input labels from `describeFields()` in `share-state.js`). For results that aren't in `Stat` boxes, mark them: `data-copy="Label"` on an element, or `data-copy-table` on a results table (one line per row). Give inputs real labels (`<label for>` or `aria-label`) and put repeated groups in a `<fieldset>` with a `<legend>` so the summary can tell Saver A from Saver B.

## Predict first

A tool can have prediction cards above its challenges. Each asks one question ("The T-shirt shop's forecast doubles. What happens to break-even?") and students pick Goes up, Goes down, or Stays the same. The tool measures before and after right away, then replays it on screen (the scenario, then the change a beat later) so students watch the sliders and chart move, and shows before → after next to the guess. While one card replays, the others wait. The right answer comes from the tool's own math, so there's no answer key on the page.

Predictions live in `src/data/predictions.js`, keyed by tool slug: `question`, `start` and `change` (share-link params), and `measure` (`label`, `value(s)`, `fmt(n)`). Aim each question at a misconception, and mix the answers across a tool so "Stays the same" isn't a safe guess. The why and follow-up questions go in the tool's teacher notes under "Predict first." Every tool with share links has two.

## Challenges

A tool can have challenge cards under it: a goal ("get break-even down to 75 shirts"), a few rules ("price stays at $20 or less"), and a **Start** button that loads the scenario. Cards check themselves live as students work and show Not yet, Rule broken, or Done. Start loads the scenario as a share link (with `ch=` marking the active card), so after pressing Start the address bar holds a link you can post for the class. Cards work in projector view and are left off printouts.

Challenges live in `src/data/challenges.js`, keyed by tool slug. Each has `title`, `goal`, `start` (share-link params: `g0` preset, `g1` tab, input ids for overrides), `met(s)`, and `rules`. Checks read inputs with `s.v('id')` and should reuse the tool's own exported math (`schedule()`, `funnel()`) so a card never disagrees with the screen. Before adding one, confirm the start scenario isn't already solved and that a solution exists within the rules. Goal text is student-facing; **sample solutions go in the tool's teacher notes** under "Challenges," never in the data file. Every tool with share links has three. The guided-practice tools in `SKIP_SHARE` (T-Account, Adjusting Entries, and the like) check each step themselves instead.

Inputs without an id are keyed by position in share links (`f0`, `f1`, ...), so checks read them that way too; `s.raw('id')` reads a radio or select as text. Many tools clear the preset button once a number changes, so a check that needs preset data the inputs don't hold (a factory or country you aren't editing) names its preset rather than reading `s.pick(0)`.

## Checks

Every pull request runs automatic checks on GitHub (`.github/workflows/checks.yml`). A green check means it's safe to merge; a red X means something broke. Click **Details** next to it to see which check failed and why.

The browser tests are split across 3 machines that run at the same time, so a PR takes a few minutes. One summary job named **checks** passes only when everything else passed, and branch protection on `main` requires it, so the merge button stays locked until it's green. Keep that job's name if you edit the workflow.

What's checked:

- **Math** (`tests/unit/math.test.js`): depreciation, inventory costing, ratios, the marketing funnel, credit card payoff, savings growth, and the T-Account Lab's trial balance. Each expected answer is worked out a different way than the tool does it (a textbook formula or by hand), so the tests catch the tool being wrong, not just changing.
- **House rules** (`tests/unit/content.test.js`): no em-dashes anywhere in `src/`; every challenge and prediction belongs to a real tool, is complete, and has a matching section in that tool's teacher notes.
- **In a real browser** (`tests/browser/`): every page loads with no errors; every tool fits a 390px phone with no sideways scrolling in light, dark, and projector view; teacher notes never show up on student pages, even hidden; share links reopen the same numbers on every tool; Copy results gives a clean summary; every challenge starts unsolved, reaches Done with a real solution, and shows Rule broken when a rule is broken; every prediction marks the right guess; and the full T-Account Lab walkthrough balances at $26,400.
- **Accessibility** (`tests/browser/accessibility.spec.js`): every page passes axe-core's WCAG 2.2 AA checks in light, dark, phone width, and projector view; every control can be reached by keyboard and shows a focus ring; sliders speak their units ("$2.50", not "2.5"); tools reflow at 320px. Charts need an `aria-label` that says what they show in words (the current numbers, not just "Break-even chart"), updated on every render. Sliders and sideways-scrolling tables get this for free from `src/scripts/lib/a11y.js`.

Run them yourself:

```bash
npm test              # math and house rules (seconds)
npm run test:browser  # builds, then the browser tests (a few minutes)
npm run check         # both
```

The first time, install the browser with `npx playwright install chromium`.

When you add a challenge or prediction, add its answer to `tests/browser/fixtures.js` (solutions are safe there; `tests/` never ships). The checks will remind you if you forget. New tools are picked up automatically.

## Structure

```
src/
  content/tools/        one .md per tool (metadata + teacher notes)
  content.config.js     schema for tool metadata
  components/tools/     tool markup + registry (index.js)
  scripts/tools/        tool behavior (plain JS)
  components/ui/        shared tool parts: RangeField, Stat, TryIt
  scripts/lib/util.js   shared helpers (money format, chart scale, SVG, setTone, beep)
  scripts/lib/ui.js     shared Tailwind class strings
  styles/global.css     Tailwind setup, color tokens, tone variants
  pages/                home, tools/[slug], teachers/ (index + [slug]), standards, 404
  layouts/Base.astro    site shell, embed mode
```
