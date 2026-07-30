# API — Agent Guidelines

This file supplements the repository-level `AGENTS.md` for work in `api/`.

## AdonisJS architecture

* Use AdonisJS 7, TypeScript, Lucid ORM, VineJS validators, and Japa tests.
* Keep controllers thin: validate the request, invoke a service, and return JSON.
* Put multi-step domain operations in `app/services/`.
* Define versioned routes in `start/routes.ts` under `/api/v1`.
* Protect authenticated routes with `middleware.auth()` and use `auth.getUserOrFail()` in protected handlers.
* Keep all API responses and errors JSON.
* Use Lucid models for database access. Do not edit `database/schema.ts` manually: it is generated from migrations.
* Use database constraints for invariants and transactions for multi-write operations.

## Authentication and HTTP

* Authentication uses the AdonisJS session guard and encrypted, HttpOnly `_loyal_session` cookies.
* Cookie-authenticated mutating requests require CSRF verification through Shield.
* Keep CORS restrictive. Development origins come from `FRONTEND_URL`; production must use explicit HTTPS origins.
* Validate every request parameter with VineJS. Resolve ownership and permissions from `auth`, not request bodies or query parameters.

## NFC and SDM

* NFC verification stays behind `app/services/nfc/verify_tag_service.ts`; never put SDM cryptography in a controller.
* The SDM verifier checks encrypted PICC data, encrypted file data, and AES-CMAC. Treat a scan as verified only after a successful upstream response.
* Map verified `uid` to `nfc_tags.identifier`. Do not place venue names, PII, balances, secrets, JWTs, or authorization data in tag `file_data`.
* Treat NFC URLs and their query values as sensitive. Do not log full `picc_data`, `enc`, `cmac`, or complete scan URLs.
* A scan that grants a stamp changes state and must use a `POST` endpoint, for example `POST /api/v1/tag_scans`.
* Create the loyalty account and stamp in one transaction. Rely on the unique NFC-counter constraint for idempotency; `last_accepted_counter` is optional additional replay policy, not the sole source of truth.
* `NFC_MASTER_KEY` and all tag keys are server-side secrets. Keep them outside Git and use a unique 16-byte hex key in production.

## Testing and verification

* Add or update Japa functional tests in `tests/functional/` for API behavior, authentication, validation, authorization, and constraints.
* NFC scan tests must cover invalid verifier input, unknown/inactive tags, first scan/account creation, repeat counters, and concurrent/idempotent behavior where applicable.
* Run the narrowest relevant checks first. Before handoff, run relevant commands: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
* The test database must end in `_test`; never run destructive test migrations against a non-test database.
