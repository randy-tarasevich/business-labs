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
2. **Styles:** `src/styles/tools/my-tool.css`, prefixed with the tool's class so nothing leaks. Use the color tokens in `src/styles/global.css` (`var(--good)`, `var(--bad)`, etc.) so light and dark mode both work.
3. **Register it:** import it in `src/components/tools/index.js`.
4. **Content:** add `src/content/tools/my-tool.md`. Frontmatter is the tool's metadata (courses, unit, standards). `courses` is a list: the first is the tool's home section on the index page, the rest show as "Also fits". The markdown body becomes the teacher notes page at `/teachers/<slug>/`.

The home page, tool page, teacher notes pages, and standards coverage page all build from the content files automatically.

## Teacher notes

Teacher notes live at `/teachers/` (bookmark it). Those pages are marked `noindex` and are not linked from any student page, so student tool pages never contain answer keys. This is not a login: anyone with the URL can open it. Once the site has a custom domain, protect `/teachers/*` with Cloudflare Access.

## Standards

Only add MBA Research indicator codes you've verified against the official documents. Tools with no codes show up as "Not yet aligned" on `/standards/`.

## Embed mode

Add `?embed=1` to any tool URL to hide the site header and footer. Use it for projecting or for linking from slides.

## Structure

```
src/
  content/tools/        one .md per tool (metadata + teacher notes)
  content.config.js     schema for tool metadata
  components/tools/     tool markup + registry (index.js)
  scripts/tools/        tool behavior (plain JS)
  scripts/lib/util.js   shared helpers (money format, chart scale, SVG, beep)
  styles/               global tokens + per-tool CSS
  pages/                home, tools/[slug], teachers/ (index + [slug]), standards, 404
  layouts/Base.astro    site shell, embed mode
```
