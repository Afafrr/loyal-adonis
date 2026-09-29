# First live deployment (one VPS)

`compose.prod.yaml` runs the Next.js frontend, AdonisJS API, and PostgreSQL.
Nginx runs on the VPS and serves them on one HTTPS domain. The frontend and API
publish ports only on `127.0.0.1`; PostgreSQL has no published host port. The
browser uses `/api/v1/*` and `/up` on the same origin as the frontend, so
session and CSRF cookies work with server-rendered pages.

## Prerequisites

- A Linux server with Docker Engine, the Docker Compose plugin, Nginx, and
  [Certbot's Nginx plugin](https://certbot.eff.org/instructions?os=snap&ws=nginx).
- A domain (for example, `loyalty.example.com`) with an A/AAAA record pointing to
  the server. Open inbound TCP 80 and 443.
- Enough disk space for the PostgreSQL volume and off-server backups.

## Initial setup

1. Copy the repository to the server and create the private environment file:

   ```bash
   cp .env.prod.example .env.prod
   chmod 600 .env.prod
   ```

2. Edit `.env.prod`. Set `DOMAIN` to the DNS name (without `https://`), choose a
   long random PostgreSQL password, and put the same password in `DATABASE_URL`.
   URL-encode characters such as `@`, `:`, `/`, and `#` in the URL password.
   Generate `APP_KEY` with `cd api && node ace generate:key --show` and copy the
   printed value into `.env.prod`. Keep this key stable across deployments;
   changing it invalidates existing sessions.

3. Validate and start the containers from the repository root:

   ```bash
   docker compose --env-file .env.prod -f compose.prod.yaml config --quiet
   docker compose --env-file .env.prod -f compose.prod.yaml up -d --build
   docker compose --env-file .env.prod -f compose.prod.yaml ps
   ```

   The API container applies migrations before starting. Do **not** run
   `db:seed` in production: the demo seeder creates accounts with known passwords.

4. Copy `nginx/loyalty-nest.conf` to
   `/etc/nginx/sites-available/loyalty-nest` and replace
   `loyalty.example.com` in `server_name` with the domain from `.env.prod`.
   Enable this site, disable the default site if present, and validate Nginx:

   ```bash
   sudo cp nginx/loyalty-nest.conf /etc/nginx/sites-available/loyalty-nest
   sudoedit /etc/nginx/sites-available/loyalty-nest
   sudo ln -s /etc/nginx/sites-available/loyalty-nest /etc/nginx/sites-enabled/loyalty-nest
   sudo nginx -t
   sudo systemctl reload nginx
   ```

   The site is initially available over HTTP only so Certbot can complete the
   HTTP challenge. Obtain the certificate and enable HTTPS with a redirect:

   ```bash
   sudo certbot --nginx -d <DOMAIN> --redirect
   sudo certbot renew --dry-run
   ```

   Certbot's Nginx plugin edits the enabled site configuration and its installed
   timer renews certificates. Keep the resulting configuration and Let's Encrypt
   files when updating the application.

5. Check `https://<DOMAIN>/up` for a JSON response with `"status":"up"`, then
   open `https://<DOMAIN>/sign-up`, register a test account, sign in, visit the
   dashboard, and sign out. Check the browser network panel if authentication
   fails: requests should go to the same domain under `/api/v1/*` and the session
   cookie should be `Secure` and `HttpOnly`.

## Updates and backups

Take a database backup before an update. This command writes a PostgreSQL custom
archive to the current host directory; move it to secure off-server storage:

```bash
docker compose --env-file .env.prod -f compose.prod.yaml exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' \
  > loyal-$(date +%Y%m%d-%H%M%S).dump
```

After backing up, pull the intended revision and run:

```bash
docker compose --env-file .env.prod -f compose.prod.yaml up -d --build
docker compose --env-file .env.prod -f compose.prod.yaml ps
```

Keep the `postgres_data` volume. `docker compose down -v` deletes the database.
Nginx and Certbot are managed by the host, outside Docker Compose.

## NFC status

`POST /api/v1/tag_scans` already exists, but this first deployment does not run
the NFC verifier. Scan requests return a temporary-unavailable response and do
not create stamps. Add and validate the verifier and a unique production key
before testing physical tags. The `/api/v1/dev/nfc_tags/inspect` route returns
404 in production.
