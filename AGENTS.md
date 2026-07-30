# Loyalty Nest — Shared Agent Guidelines

## Project

Loyalty Nest is a loyalty application for venues. It has a TypeScript monorepo-style layout:

* `api/`: AdonisJS 7 API, Lucid ORM, PostgreSQL, VineJS validation, and Japa tests.
* `web/`: Next.js 16 App Router frontend, React 19, TypeScript, and Tailwind CSS 4.
* `docker/` and `compose.yaml`: local development services, including PostgreSQL and the NFC SDM verifier.

The AdonisJS API is the source of truth for business data, authentication, authorization, and all state-changing loyalty operations. The Next.js app is a frontend and server-rendering layer; it must not duplicate business rules or access PostgreSQL directly.

Read the nearest nested `AGENTS.md` before working in `api/` or `web/`; it adds framework-specific requirements.

## Current phase

Authentication is implemented. The next product work should build vertical slices around the existing domain:

1. Owner/company and venue management for the current schema.
2. Loyalty-program configuration.
3. Cryptographically verified NFC scans that create loyalty accounts and stamps.
4. Customer-facing loyalty-account and reward views.

Build against the current schema and API contracts. Do not redesign multi-venue ownership, add JWT, Redis, OAuth, or other infrastructure unless the requested feature genuinely requires it.

## Cross-cutting security

* Keep the AdonisJS session guard and encrypted, HttpOnly `_loyal_session` cookie as the single authentication system.
* Do not introduce Auth.js/NextAuth, JWT in `localStorage`, or a second session system without an explicit architecture change.
* Never trust client-provided user IDs, ownership, authorization data, or NFC-verifier output that was not validated server-side.
* Keep secrets outside Git. Do not expose database credentials, NFC keys, session keys, or tokens in frontend environment variables.

## Loyalty domain

The current schema contains `companies`, `venues`, `loyalty_programs`, `nfc_tags`, `users`, `loyalty_accounts`, and `stamps`.

* A loyalty account is created lazily on a user's first valid scan for a program.
* A user can have one loyalty account per program. Preserve the unique constraint on `(user_id, loyalty_program_id)`.
* A tag belongs to a venue. Resolve its venue and program server-side from the verified tag identifier.
* A stamp records one accepted dynamic NFC counter. Preserve the unique constraint on `(nfc_tag_id, nfc_counter)`.

## Code style and change discipline

* Use TypeScript and established AdonisJS/Next.js naming conventions.
* Prefer small, explicit changes over new dependencies and premature abstractions.
* Preserve existing user changes and avoid editing generated files.
* Before implementing a non-trivial change, state the files and approach briefly. Afterward, summarize changed files and checks run.
