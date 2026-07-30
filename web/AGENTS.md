<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Web — Agent Guidelines

This file supplements the repository-level `AGENTS.md` for work in `web/`.

* Use the Next.js 16 App Router in `app/`, TypeScript, and the existing Tailwind CSS conventions.
* Prefer server components for authenticated data rendering. Use client components only for interaction or browser-only APIs.
* The API owns business logic and database access. Do not duplicate authorization rules or access PostgreSQL from Next.js.
* Authentication is the AdonisJS `_loyal_session` cookie. Do not add Auth.js/NextAuth or a second session system.
* Browser API requests must use `credentials: 'include'`. Use `app/csrf.ts` for CSRF-aware mutations.
* Put API URLs in `app/routes.ts`; do not scatter hard-coded API origins.
* Pages that read `headers()` or cookies are dynamic by design. Do not force-cache personalized output.
* Do not expose secrets, database credentials, or NFC keys through `NEXT_PUBLIC_*` environment variables.
* Run `npm run lint` after frontend changes, and run `npm run build` when the change affects rendering, routing, or configuration.
