<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI/UX Pro Max Integration (EARTH)

- UI/UX Pro Max is installed for GitHub Copilot under `.github/prompts/`.
- For UI/UX tasks (new pages, redesigns, accessibility, design-system, component styling), use the `ui-ux-pro-max` workflow/prompt and its local search data first.
- Prefer recommendations aligned with this project stack: **Next.js + React + Tailwind CSS**.
- For EARTH historical archive work (especially `/egypt`), run the local search/design-system commands documented in `README.md` before implementing UI changes.
