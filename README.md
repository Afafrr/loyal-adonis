# Loyalty Nest

Loyalty Nest is a loyalty application for venues. Its backend was migrated from
Rails 8.1 to AdonisJS 7 while preserving PostgreSQL, session authentication, CSRF
protection, API contracts, and the Docker Compose service layout (`backend`, `db`,
and `nfc`).

## Project structure

```text
loyal-adonis/
├── api/                     # AdonisJS API and business logic
│   ├── app/
│   │   ├── controllers/    # HTTP request handlers
│   │   ├── models/         # Lucid ORM models
│   │   ├── services/       # Domain logic, including loyalty and NFC
│   │   └── validators/     # Request validation
│   ├── database/
│   │   ├── migrations/     # PostgreSQL migrations
│   │   └── seeders/        # Seed and demo data
│   ├── start/                   # Routes and startup configuration
│   └── tests/                   # Japa tests
├── web/                     # Next.js application
│   └── src/
│       ├── app/                 # App Router pages and layouts
│       │   ├── (public)/        # Pages available without authentication
│       │   └── (protected)/     # Authenticated pages
│       │       ├── dashboard/
│       │       │   ├── _components/ # Dashboard-only UI
│       │       │   └── _lib/        # Dashboard-only data access and types
│       │       └── profile/
│       │           └── _lib/        # Profile-only data access and types
│       ├── components/ui/       # Shared UI components
│       ├── features/            # Application feature modules
│       │   └── auth/            # Authentication shared by multiple routes
│       └── lib/                 # Shared infrastructure and utilities
├── docker/                  # Containerized service configuration
└── compose.yaml            # Local Docker Compose environment
```

The frontend uses a hybrid structure. `app/` owns routing and page composition, and
code used by only one route is colocated with that route in private `_components/`
and `_lib/` directories. Reusable business capabilities live in `features/`.
Domain-independent elements belong in `components/ui/`, while shared infrastructure,
such as API request and route handling, belongs in `lib/`.

## Running with Docker

1. Copy `.env.example` to `.env` and set secure `APP_KEY` and `NFC_MASTER_KEY`
   values.
2. Run `docker compose up --build`.

Services:

- API: `http://localhost:3000`
- PostgreSQL: `localhost:5433`
- NFC service: `http://localhost:5000`

The backend container runs migrations before starting the server. The `api/` source
directory is mounted into the container, while dependencies are stored in a separate
`backend_node_modules` volume. When the PostgreSQL volume is created for the first
time, the initialization script also creates a separate `loyal_test` database used
exclusively by tests.

## Running locally

Node.js 24+ and npm 11+ are required.

```bash
cd api
npm ci
cp .env.example .env
node ace generate:key
npm run dev
```

When using the PostgreSQL service from Docker Compose, set the local `DATABASE_URL`
to use port `5433`.

Ready-to-use requests for the VS Code REST Client extension are available in
`api/requests/auth.http` and `api/requests/tag_scan.http`.

## API contract

- `GET /up`
- `POST /api/v1/users`
- `POST /api/v1/users/sign_in`
- `DELETE /api/v1/users/sign_out`
- `GET /api/v1/me`
- `POST /api/v1/tag_scans`

State-changing requests require the `_loyal_session` cookie and a CSRF token.
AdonisJS exposes the token in the `XSRF-TOKEN` cookie, and browser clients must send
its value in the `X-XSRF-TOKEN` header. Requests must use `credentials: 'include'`.

## Verification

```bash
cd api
npm run typecheck
npm run lint
npm run build
npm test
```

Functional tests use the `loyal_test` database configured in `api/.env.test`. The
test runner includes an additional safety check and refuses to migrate or reset a
database whose name does not end with `_test`. If the PostgreSQL volume predates the
test database setup, create the database once with:

```bash
docker compose exec db createdb -U loyal loyal_test
```

When using custom PostgreSQL credentials, update the URL in `api/.env.test` as well.

## Migrating existing data

The schema preserves the Rails table and column names, including
`users.encrypted_password`. Bcrypt cost 12 allows existing Devise passwords to be
verified. Rails and AdonisJS session cookies are not cryptographically compatible,
so users must sign in again after the migration.

The migration creates a clean target schema. Before using an existing Rails database
that already contains data, either mark the baseline migration as completed or run a
controlled import into a new database. Do not run the baseline migration directly
against a database that already contains these tables.
