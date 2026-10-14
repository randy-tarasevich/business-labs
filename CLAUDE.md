# Business Lab

Free interactive tools for high school business and personal finance classes. Students change the numbers, see what happens, and explain why. Built by Randy Tarasevich, a CT Business Education teacher candidate, for his own classroom, other teachers, and teaching interviews.

## Stack

- Astro 7 + Tailwind v4, plain JavaScript (no UI frameworks)
- Deployed to Cloudflare Workers via Git: every push to `main` builds and deploys
- `npm run dev` (localhost:4321), `npm run build` (outputs `dist/`)

## Hard rules

- **No accounts, no student data, no tracking.** Every tool runs entirely in the browser. Never add analytics, forms that submit, or server storage.
- **Never invent a standards code.** Only add MBA Research indicators verified against the official documents. If unsure, leave `indicators: []` and say so. Jump$tart, CCSS, and CSTA go in `alsoAligned` as free text.
- Every tool must work in light and dark mode (use the tokens in `src/styles/global.css`), at phone width, and in `?embed=1` mode for projecting.
- No em-dashes in any copy. Student-facing text is short, plain, and written for high schoolers.

## Adding a tool

Follow the README's "Add a tool" steps: component, behavior script exporting `init(root)`, CSS prefixed with the tool's class, registry entry in `src/components/tools/index.js`, and a content `.md`.

Content frontmatter:
- `courses`: a list. The first course is the tool's home section on the index page; list every other course it genuinely fits so it can be cross-listed. Allowed values live in `COURSES` in `src/content.config.js`.
- The markdown body is the "For teachers" notes. Start with "How I use it" and describe a short classroom routine (predict, test, explain).

## Roadmap decisions

- Course pages (`/courses/<course>/`) get built once a course has 3 or more tools. They should pull every tool that lists the course, not just its home tools, and add a suggested sequence and time needed.
- A custom domain is planned; when it's set, update `site` in `astro.config.mjs`.
