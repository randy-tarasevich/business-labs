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
- **Try it questions** go through `TryIt`. Each item has `q`, `hint`, and `a`. The hint is a nudge toward the idea and never gives the answer. The answer (`a`) stays locked until the student types a few words of their own, so they commit to an answer before they compare. Nothing they type is saved. In embed mode the box is hidden and the teacher can show any answer directly.
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

## Embed mode

Add `?embed=1` to any tool URL (or click **Project** on the tool page) to hide the site header and footer. The tool title stays, and the page scales up on wide screens so it reads from the back of the room. Use it for projecting or for linking from slides. Add `&theme=light` or `&theme=dark` to force a theme for that link without changing anyone's saved setting. The `embed:` variant styles anything that should differ in projector view.

In projector view, the explanation panel and the Try it questions start collapsed behind **Show** buttons, so answers don't appear until the teacher opens them. This covers both panels in a tool's `LOWER` section and any `TryIt` panel. Add `data-projector-collapse` to any other panel that should start collapsed (see `src/scripts/lib/projector.js`).

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
