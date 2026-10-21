# Business Labs

Free interactive tools for high school business and personal finance classes. Students change the numbers, see what happens, and explain why. Built by Randy Tarasevich, a CT Business Education teacher candidate, for his own classroom, other teachers, and teaching interviews.

## Stack

- Astro 7 + Tailwind v4, plain JavaScript (no UI frameworks)
- Deployed to Cloudflare Workers via Git: every push to `main` builds and deploys
- `npm run dev` (localhost:4321), `npm run build` (outputs `dist/`)

## Hard rules

- **No accounts, no student data, no tracking.** Every tool runs entirely in the browser. Never add analytics, forms that submit, or server storage. A tool may save a student's work in `localStorage`, or to a file the student picks in their own Drive (File System Access API), only if nothing is sent to this site, the page says where the work is saved, and it offers Start over plus a backup option for browsers without file access (see Business Plan Builder).
- **Never invent a standards code.** Only add MBA Research indicators verified against the official documents. If unsure, leave `indicators: []` and say so. Jump$tart, CCSS, and CSTA go in `alsoAligned` as free text.
- Every tool must work in light and dark mode (use the tokens in `src/styles/global.css`), at phone width, and in `?embed=1` mode for projecting.
- **Tailwind only.** Style with utility classes; never add a CSS file or a `<style>` block. Use the shared strings in `src/scripts/lib/ui.js` and the components in `src/components/ui/`. For states, use `setTone()` and the `tone-*` variants, not swapped class names. See the README's Styling section.
- **Teacher content never goes on student pages.** Answer keys, routines, and misconceptions live in the tool's markdown body, which only renders on `/teachers/<slug>/` (noindex, not linked from student pages). Anything on a `/tools/` page is readable in the page source, so hiding it with CSS or JS is not protection.
- No em-dashes in any copy. Student-facing text is short, plain, and written for high schoolers.

## Adding a tool

Follow the README's "Add a tool" steps: component, behavior script exporting `init(root)`, registry entry in `src/components/tools/index.js`, and a content `.md`. Styling is Tailwind utilities (see the README's Styling section).

Share links (README "Share links"): keep input ids stable, never random, because links use them as keys. If a new tool's state isn't plain inputs, add it to `SKIP_SHARE`.

Challenges (README "Challenges"): goal cards per tool in `src/data/challenges.js`. Verify each start isn't already solved and a solution exists within the rules. Sample solutions go in teacher notes only.

Content frontmatter:
- `courses`: a list. The first course is the tool's home section on the index page; list every other course it genuinely fits so it can be cross-listed. Allowed values live in `COURSES` in `src/content.config.js`.
- `minutes`: `[low, high]` class time for the activity. Course pages add these up.
- The markdown body is the teacher notes, rendered only on `/teachers/<slug>/`. Start with "How I use it" and describe a short classroom routine (predict, test, explain).

## Roadmap decisions

- Course pages (`/courses/<course>/`) build automatically once a course has 3 or more tools (`MIN_TOOLS` in `src/data/courses.js`). They pull every tool that lists the course, not just its home tools. The suggested sequence, a one-line "why" for each step, and an optional level label (e.g. Accounting 1 vs. Advanced) live in `COURSE_GUIDES` in that same file. A tool that lists a course but isn't in its sequence shows under "Also fits this course." When you add a tool, decide where it goes in each course's sequence.
- A custom domain is planned; when it's set, update `site` in `astro.config.mjs` and put `/teachers/*` behind Cloudflare Access (email one-time PIN). Path-level Access needs a custom domain; on workers.dev it can only lock the whole site.
