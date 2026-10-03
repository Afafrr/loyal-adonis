# Loyalty Nest — deployment and maintenance guide

This guide reflects the project configuration and the results reported on October 2,
2026. Saving this document does not change the server. Run commands marked **EC2**
after connecting through SSH; run commands marked **Mac** locally. Proceed to the
next command only after the previous one succeeds. Replace `CURRENT_IP` and `DATE`
with your own values.

## 1. Current state and next steps

The last confirmed results showed healthy `db`, `backend`, and `frontend` containers,
a successful API `/up` response, and a working sign-in page on localhost. EC2 has
Ubuntu, Docker, Compose, Nginx, and 4 GiB of swap. The project is in `~/loyalty-nest`.
The `loyal-nest.duckdns.org` subdomain displays the default Nginx page on a phone.
The corporate filter blocks Dynamic DNS; enabling HTTPS will not remove that block.

The `DOMAIN` change, application routing in Nginx, HTTPS, backups, and CI/CD were
not yet confirmed at that point. The NFC verifier is now configured in `compose.prod.yaml`; its deployment to EC2
is still to be performed (section 9).

Complete the remaining work in this order:

1. Confirm the current EC2 address and DNS records.
2. Set `DOMAIN` in `.env.prod` and recreate the affected containers.
3. Configure Nginx to route requests to the frontend and API.
4. Enable HTTPS and automatic certificate renewal.
5. Check registration, sign-in, session persistence, and sign-out.
6. Create a backup outside the server and verify restoration.
7. Deploy the NFC verifier before testing physical tags.
8. Set up monitoring and repeatable updates, then CI/CD.

Steps 1–5 make the application available for live testing. Serving real customers
also requires production NFC and backup procedures, among other operational work.

## 2. How the environment works

```text
Phone / browser
  → DNS: the domain name resolves to the public EC2 address
  → Security Group: allows HTTPS on port 443
  → Nginx on Ubuntu: handles the certificate and routes requests
      /api/v1/* and /up → 127.0.0.1:3333 → AdonisJS backend
      other paths      → 127.0.0.1:3000 → Next.js frontend

Next.js during server rendering → http://backend:3333
Backend → db:5432 → PostgreSQL → postgres_data volume
Backend → http://nfc → NFC verifier [not yet deployed]
```

Compose manages separate containers. Nginx runs directly on Ubuntu. The browser
uses the same public origin for the website and API, simplifying cookie handling.
`backend` and `db` are names resolved inside the Docker network.

| File or component | Purpose |
| --- | --- |
| `compose.prod.yaml` | Defines containers, variables, ports, dependencies, and health checks. |
| `api/Dockerfile` | Builds and packages the API into a production image. |
| `api/bin/docker-entrypoint` | Runs pending migrations before starting the API. A migration failure prevents startup. |
| `web/Dockerfile` | Builds Next.js and packages its `standalone` output. |
| `api/.dockerignore`, `web/.dockerignore` | Limit the files included in image build contexts. |
| `.env.prod.example` | Configuration template without real secrets. |
| `.env.prod` | Actual server secrets and settings, kept outside Git. |
| `nginx/loyalty-nest.conf` | Initial HTTP template to copy onto the host. |
| `/etc/nginx/sites-available/loyalty-nest` | Host configuration that Certbot updates to enable HTTPS. |
| `/etc/letsencrypt/` | Certificates and renewal configuration managed by Certbot. |
| `postgres_data` volume | Persistent database storage that survives container replacement. It does not replace a backup. |

## 3. Connect to the server

**AWS in the browser:** check that the instance is `Running` and note its current
`Public IPv4 address`. Set the same public IPv4 address in DuckDNS. Do not use the
private `172.31...` address. Do not add an IPv6 record unless public IPv6 is configured
on the server.

The Security Group should allow SSH on port 22 from your current `My IP`, and HTTP
on port 80 and HTTPS on port 443 from the internet. Keep ports 3000, 3333, 5432, and
the verifier port closed to public access.

**Mac:**

```bash
ssh -i "$HOME/Downloads/loyal.pem" ubuntu@CURRENT_IP
```

**EC2:**

```bash
cd ~/loyalty-nest
sudo docker compose --env-file .env.prod -f compose.prod.yaml ps
free -h
df -h /
getent ahostsv4 loyal-nest.duckdns.org
```

Expect running containers, approximately 4 GiB of swap, and DNS resolving to the
current public IP. If swap is inactive after a restart, check the `/swapfile` entry
in `/etc/fstab`. Do not recreate an existing swap file.

`127.0.0.1` refers to the machine running the command, so check ports 3000 and 3333
on EC2. If SSH times out, check the IP, instance state, and port 22 rule.

## 4. Set the application domain

**EC2:**

```bash
cd ~/loyalty-nest
nano .env.prod
```

Change only this line:

```dotenv
DOMAIN=loyal-nest.duckdns.org
```

Omit `https://`, the port, and any trailing slash. Compose constructs the HTTPS
`APP_URL` and `FRONTEND_URL` values. Preserve the existing database password,
`DATABASE_URL`, and `APP_KEY`.

- `POSTGRES_USER` and `POSTGRES_DB` identify the database user and database.
- `POSTGRES_PASSWORD` is the database password; `DATABASE_URL` contains the same secret.
- `DATABASE_URL` connects the API to `db:5432` inside Docker.
- `APP_KEY` protects data including sessions; changing it invalidates existing sessions.

Changing `POSTGRES_PASSWORD` in the file after database initialization does not
change the password in PostgreSQL. Rotation requires updating both the database
credentials and API configuration.

Save with Ctrl+O, Enter, Ctrl+X. Then run:

```bash
chmod 600 .env.prod
sudo docker compose --env-file .env.prod -f compose.prod.yaml config --quiet
sudo docker compose --env-file .env.prod -f compose.prod.yaml up -d --no-build
sudo docker compose --env-file .env.prod -f compose.prod.yaml ps
```

`config --quiet` validates configuration without printing secrets. `up` recreates
containers whose configuration has changed. `restart` alone does not update their
environment variables. This change does not require rebuilding images.

## 5. Configure Nginx

This step sets up application routing for the first time. Once a certificate has
been issued, do not overwrite the host configuration with the original HTTP template
during each application update.

**EC2:** back up the current settings, copy the template, and open it:

```bash
sudo cp -a /etc/nginx "/etc/nginx.before-loyalty-$(date +%Y%m%d-%H%M%S)"
sudo cp ~/loyalty-nest/nginx/loyalty-nest.conf /etc/nginx/sites-available/loyalty-nest
sudo nano /etc/nginx/sites-available/loyalty-nest
```

Set:

```nginx
server_name loyal-nest.duckdns.org;
```

Keep the `proxy_pass` addresses using `127.0.0.1:3000` and `127.0.0.1:3333`:
Nginx on the host connects through the ports published by Docker.

```bash
sudo ln -sfn /etc/nginx/sites-available/loyalty-nest /etc/nginx/sites-enabled/loyalty-nest
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
```

The link in `sites-enabled` enables the site. Removing the default link disables
the welcome page. If validation fails, fix the error before reloading. Once the
configuration passes validation:

```bash
sudo systemctl reload nginx
curl -fsS -H 'Host: loyal-nest.duckdns.org' http://127.0.0.1/up
```

The response should contain `"status":"up"`. This checks Nginx locally; also open
`http://loyal-nest.duckdns.org/up` on your phone. Test sign-in only after enabling
HTTPS, because production cookies have the `Secure` attribute.

## 6. Enable HTTPS and certificate renewal

Prerequisites: the domain resolves to this server, ports 80 and 443 are open, and
the Nginx configuration from the previous step works. The Certbot plugin verifies
domain control over HTTP on port 80, then configures HTTPS.

**EC2:** check whether Certbot is already installed:

```bash
command -v certbot
```

If the command prints nothing, install the Ubuntu packages:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

If Certbot is already installed through Snap, use that installation instead of
adding a second one. `sudo certbot plugins` lists the available plugins.

```bash
sudo certbot --nginx -d loyal-nest.duckdns.org --redirect
```

Provide an email address and review the terms of service. Certbot obtains the
certificate, installs it in Nginx, and adds HTTP → HTTPS redirection. The certificate
is issued for the domain name, so an IP change alone does not require a new certificate.

After success:

```bash
sudo nginx -t
sudo certbot renew --dry-run
systemctl list-timers --all | grep -i certbot
curl -fsS https://loyal-nest.duckdns.org/up
curl -I http://loyal-nest.duckdns.org/sign-in
```

Expect a successful renewal test, a renewal timer, an API response, and a redirect
to HTTPS. If the timer is not enabled for an apt installation:

```bash
sudo systemctl enable --now certbot.timer
```

Snap installations use a different timer name; inspect the `list-timers` output.
Renewal cannot run while EC2 is powered off. After starting it, check DNS and run
`sudo certbot certificates` to confirm that the certificate is still valid.

Source: [Certbot documentation](https://eff-certbot.readthedocs.io/en/stable/using.html).

## 7. Verify the application behavior

On a phone or personal device that can access the domain:

1. Open `https://loyal-nest.duckdns.org/sign-up` and create your own test account.
2. Sign in at `/sign-in`, open `/dashboard`, and refresh the page.
3. Confirm that the session persists after refreshing.
4. Sign out and confirm that protected data requires signing in again.
5. Use another account to confirm that users cannot read someone else's data.

In browser developer tools, API requests should use the same domain and `/api/v1`.
The `_loyal_session` cookie should have `Secure` and `HttpOnly`. Do not share cookie
values or CSRF tokens.

`healthy` and `/up` confirm only specific checks. They do not verify sign-in, all
database queries, or NFC. Do not run the production `db:seed` command that creates
demo accounts with known passwords.

## 8. Back up the database outside the server and test restoration

The database volume survives container replacement, but not the loss of the whole
machine. Back up before updates or migrations, and regularly once the database
contains useful data.

**EC2:** prepare a directory outside the project:

```bash
mkdir -p ~/loyalty-backups
chmod 700 ~/loyalty-backups
cd ~/loyalty-nest
```

The following block assigns the final filename only after a successful dump:

```bash
(
  set -e
  umask 077
  backup_file="$HOME/loyalty-backups/loyal-$(date -u +%Y%m%d-%H%M%S).dump"
  sudo docker compose --env-file .env.prod -f compose.prod.yaml exec -T db \
    sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' \
    > "${backup_file}.partial"
  mv "${backup_file}.partial" "$backup_file"
  printf 'Saved: %s\n' "$backup_file"
)
```

`pg_dump` creates a consistent logical backup while the database is running. The
custom format supports restoration through `pg_restore`. Incomplete backups retain
the `.partial` suffix.

**Mac, a new local terminal:** substitute the existing archive filename and IP:

```bash
mkdir -p ~/loyalty-backups
chmod 700 ~/loyalty-backups
scp -i "$HOME/Downloads/loyal.pem" ubuntu@CURRENT_IP:~/loyalty-backups/loyal-DATE.dump ~/loyalty-backups/
```

Keep backups on a secured personal device or in encrypted storage outside EC2.
Separately preserve `.env.prod` and NFC keys: the database dump does not
contain them. Keep the source code history in Git.

Having a file alone does not guarantee recovery. Test restoration into a separate
database. **EC2, a one-time restoration check:**

```bash
sudo docker compose --env-file .env.prod -f compose.prod.yaml exec -T db \
  sh -c 'createdb -U "$POSTGRES_USER" loyal_restore_check'
```

If the name already exists, choose a new one and substitute it in the following
commands. Do not import after database creation fails. After successful creation,
use the correct dump filename:

```bash
sudo docker compose --env-file .env.prod -f compose.prod.yaml exec -T db \
  sh -c 'pg_restore --exit-on-error --no-owner --no-privileges -U "$POSTGRES_USER" -d loyal_restore_check' \
  < ~/loyalty-backups/loyal-DATE.dump
sudo docker compose --env-file .env.prod -f compose.prod.yaml exec -T db \
  sh -c 'psql -U "$POSTGRES_USER" -d loyal_restore_check -c "SELECT count(*) FROM users;"'
```

After checking its contents, you can remove only this temporary database:

```bash
sudo docker compose --env-file .env.prod -f compose.prod.yaml exec -T db \
  sh -c 'dropdb -U "$POSTGRES_USER" loyal_restore_check'
```

Before serving customers, configure scheduled backups, transfer outside EC2,
retention, and failure notifications. This guide covers manual backups; the schedule
has not yet been deployed. Choose a frequency based on acceptable data loss.

## 9. Deploy the NFC verifier

Production Compose now includes `nfc`, using a pinned multi-platform image verified
for ARM64 and AMD64. The backend calls `http://nfc` inside Docker; no NFC port is
published on EC2, and no new Security Group rule is needed. The backend waits for
the verifier's health check at startup. This checks the key format and the Flask
home page, not the correctness of a physical tag's cryptographic configuration.

`docker/nfc/nginx.conf` is mounted inside the verifier. It disables its Nginx access
and error logs because requests contain sensitive query parameters. uWSGI request
logging is disabled too. Process startup logs and health status remain available;
Nginx request error details will not be available for troubleshooting.
This file is separate from the public Nginx configuration installed on Ubuntu.

### 9.1 Transfer the updated configuration — Mac

From the repository root, replace `CURRENT_IP` and run:

```bash
rsync -av -e "ssh -i $HOME/Downloads/loyal.pem" compose.prod.yaml docker DEPLOYMENT.md ubuntu@CURRENT_IP:~/loyalty-nest/
```

### 9.2 Set the production key — EC2

```bash
cd ~/loyalty-nest
nano .env.prod
chmod 600 .env.prod
```

Add `NFC_MASTER_KEY=YOUR_32_HEX_CHARACTERS`. Keep the actual key outside Git and
never share it in logs or screenshots. This is a separate key from `APP_KEY`.
The Compose configuration explicitly uses `DERIVE_MODE: legacy`, matching the
development image's default. The master key and derivation mode must match how
the physical tags were programmed. Do not replace a key used by existing tags.
For a new production tag setup, generate a unique 16-byte key with:

```bash
openssl rand -hex 16
```

Save it securely and use the corresponding derivation setup when programming tags.
Generating a server key does not reprogram a tag. The health check rejects the
all-zero demo key and keys that are not 16 bytes long.

### 9.3 Start the verifier and update the backend — EC2

Take a database backup as described in section 8 first: recreating the backend
runs its normal migration entrypoint. These commands use existing application
images and do not rebuild the frontend:

```bash
sudo docker compose --env-file .env.prod -f compose.prod.yaml config --quiet
sudo docker compose --env-file .env.prod -f compose.prod.yaml pull nfc
sudo docker compose --env-file .env.prod -f compose.prod.yaml up -d --no-build nfc backend
sudo docker compose --env-file .env.prod -f compose.prod.yaml ps
```

Expect `nfc`, `backend`, and `db` to become healthy. Confirm that the backend can
reach the verifier through Docker DNS:

```bash
sudo docker compose --env-file .env.prod -f compose.prod.yaml exec backend node -e "fetch('http://nfc/').then(r => { console.log('NFC HTTP status:', r.status); process.exit(r.ok ? 0 : 1) }).catch(() => process.exit(1))"
```

Expected status: `200`. This is a connectivity check, not a successful NFC scan.

### 9.4 Verify the complete scan flow

`POST /api/v1/tag_scans` exists. Before testing physical tags:

1. Confirm HTTPS, authentication, and the phone flow from the tag URL to an API
   POST with session and CSRF protection.
2. Prepare production venue, program, and tag records through administrative
   features or a controlled process, without the demo seeder.
3. Configure the public host Nginx and application logging to exclude full NFC
   URLs and `picc_data`, `enc`, and `cmac`. The verifier's log settings do not
   configure the public Nginx instance.
4. Check a valid scan, an invalid signature, an inactive tag, a repeated counter,
   and concurrent requests. The same counter must not grant another stamp.

The backend resolves the user, tag, venue, and program. Preserve server validation
and database counter uniqueness. `/api/v1/dev/nfc_tags/inspect` is not for production.

## 10. Update the application manually

The update cycle is: check code → back up → transfer code → build → replace
containers → verify behavior. You do not need to reinstall Docker, generate new
secrets, or obtain a new certificate.

Before updating, make the backup from section 8, record the Git version identifier,
and preserve the previous working code and images. Replacing containers on a single
instance causes a short interruption; building may slow down the running website.

**Mac**, after local checks appropriate to the changes:

```bash
cd "$HOME/Projects - pers/loyal-adonis"
rsync -av \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='build' \
  --exclude='tmp' \
  --exclude='*.tsbuildinfo' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='*.pem' \
  --exclude='*.dump' \
  -e "ssh -i $HOME/Downloads/loyal.pem" \
  ./ ubuntu@CURRENT_IP:~/loyalty-nest/
```

Each `\` must be the last character on its line, with no space after it. Server
secrets remain outside synchronization. This command does not remove files deleted
locally: when an update removes files, compare and delete the specific stale files
or deploy a clean release directory. Do not add `--delete` without reviewing the
contents, because the server may hold files that do not exist locally.

**EC2:**

```bash
cd ~/loyalty-nest
sudo docker compose --env-file .env.prod -f compose.prod.yaml config --quiet
sudo docker compose --env-file .env.prod -f compose.prod.yaml build backend
sudo docker compose --env-file .env.prod -f compose.prod.yaml build frontend
sudo docker compose --env-file .env.prod -f compose.prod.yaml up -d --no-build
sudo docker compose --env-file .env.prod -f compose.prod.yaml ps
curl -fsS https://loyal-nest.duckdns.org/up
```

Proceed only after each command succeeds. Separate builds reduce simultaneous RAM
usage; a previous parallel build exited with code 137. Pending migrations run when
the backend starts. Do not stop the entire application with `down` before building:
the previous version can keep running during the build.

After deployment, also check sign-in and the changed feature. Do not overwrite the
active Nginx configuration with the repository template, as that would remove the
HTTPS settings added by Certbot.

Rolling back code does not roll back migrations. Returning to a previous image is
safe only when the database schema is compatible. Do not run `migration:rollback`
without reviewing its effects. If data is damaged, stop writes and plan recovery
from a backup, accounting for changes made after the backup was created.

## 11. Stop/start EC2 and update DuckDNS

After starting the instance again:

1. Check its public IPv4 address and update DuckDNS if it changed.
2. Check the SSH `My IP` source if your client network changed.
3. Connect through SSH and check Compose `ps`, `free -h`, and `sudo systemctl status nginx`.
4. If the containers were stopped manually, start them with the production
   `docker compose ... up -d --no-build` command.
5. Check HTTPS and certificate validity. An IP change does not require a new build.

`restart: unless-stopped` normally brings containers back when Docker starts,
unless they were stopped manually. Enable host services at boot with:

```bash
sudo systemctl enable docker nginx
```

If you stop the instance frequently, consider a systemd service that updates
DuckDNS at startup and a timer that runs, for example, every 5 minutes. Store the
token in a file readable only by the service owner. `OK` indicates success; `KO`
requires attention. An empty `ip` parameter and an IPv4 connection let DuckDNS
detect the server's public IPv4 address. Keep the token out of Git and logs.
Source: [DuckDNS API](https://www.duckdns.org/spec.jsp).

DNS automation has not yet been deployed; update the address manually until then.
A DNS update does not immediately clear every client's cached records.

## 12. Monitoring and troubleshooting

**EC2, from the project directory:**

```bash
sudo docker compose --env-file .env.prod -f compose.prod.yaml ps
sudo docker compose --env-file .env.prod -f compose.prod.yaml logs --tail=100 backend
sudo docker compose --env-file .env.prod -f compose.prod.yaml logs --tail=100 frontend
sudo docker stats --no-stream
free -h
df -h /
sudo docker system df
```

`stats` shows container resource usage, `free` shows system memory, and `df` shows
disk usage. Used swap alone does not indicate a failure, but constant movement
between RAM and disk can slow down the application. For Nginx, run
`sudo tail -n 50 /var/log/nginx/error.log`. Remove user and NFC data before sharing logs.

| Symptom | What to check |
| --- | --- |
| SSH timeout | Running state, public address, SSH rule, and current client IP. |
| Nginx welcome page | `server_name`, the `sites-enabled` link, DNS, and reload. |
| 502 Bad Gateway | Containers, logs, and localhost ports 3000/3333. |
| HTTPS error | DNS, port 443, certificate, and Certbot output. |
| Sign-in or CSRF issue | HTTPS, matching DOMAIN, cookies, and API on the same origin. |
| Build exits with 137 | Memory, kernel log, and active swap; 137 alone does not prove OOM. |
| Scan returns 503 | Verifier, its logs, and the backend's `NFC_SERVICE_URL`. |
| Dynamic DNS blocked | Corporate filtering, independent of application configuration. |

Before handling more traffic, set up an external HTTPS check with alerts, backup
monitoring, Docker log limits and rotation, regular Ubuntu and image updates, and
monitoring of RAM, disk, and T4g CPU credits. Determine traffic limits by testing
real operations with test data, rather than counting registered accounts alone.

The current Compose configuration does not set up these mechanisms automatically.
An AWS budget provides notifications; it is not an automatic spending cap.
Do not routinely run `docker compose down -v` or delete volumes: doing so deletes
the database data.

## 13. CI/CD — the next automation step

Set up CI/CD after a successful manual deployment. The target flow is:

```text
commit/push → CI checks → Docker images → image registry
  → database backup → pull release onto EC2 → migrations and container replacement
  → health checks and application verification over HTTPS
```

Implement the following in a separate task:

1. A workflow, such as GitHub Actions, that runs linting, API type checking, tests
   with a separate database ending in `_test`, and builds both applications.
   Never use the production `DATABASE_URL` for tests.
2. Build `linux/arm64` images for the current EC2 instance using an ARM runner or
   a correctly configured multiplatform build.
3. Publish to a registry such as GHCR, using the commit identifier as the release tag.
4. Add a deployment file or override with `image:` entries for a specific release.
   The current Compose file uses local `build:` entries and does not yet pull
   releases from a registry.
5. Configure server authentication to the registry and a controlled deployment path.
   For SSH, verify the host key and allow the deployment runner's connection;
   the laptop's `My IP` rule alone will not allow a CI runner to connect.
6. Back up before migrations, allow only one deployment at a time, and check the result.
7. Preserve the previous image tag for rollback. Code rollback requires a compatible
   schema; automatically restoring an old database could lose new data.

Production secrets remain outside the repository and images. Building in CI reduces
EC2 load, and deployment mainly involves downloading prepared images. A single server
still represents a shared point of failure for the website, API, and PostgreSQL.

## 14. Completion criteria

For live testing: correct DNS, Nginx routing, working HTTPS and renewal, successful
registration/sign-in/sign-out, and an initial database backup outside EC2.

For physical tag scanning: also a production verifier, matching keys and tag
configuration, application scan handling, signature and repeated-counter checks,
and logs without secrets or full NFC URLs.

For serving customers: also regular backups with verified restoration, alerts,
update and recovery procedures, verified authorization, and load testing that
matches the expected usage.

## 15. Adminer through an SSH tunnel

The production Compose file includes optional Adminer access under the `tools`
profile. A regular `up` does not start it automatically. On EC2 it listens only on
`127.0.0.1:8080` and connects to the database over the Docker network. It does not
require public ports 8080 or 5432, Nginx configuration, or DuckDNS.
The `adminer:6.1.1` image supports ARM64
([official image list](https://github.com/docker-library/official-images/blob/master/library/adminer)).

For the initial setup, transfer the updated Compose file. **Mac:**

```bash
cd "$HOME/Projects - pers/loyal-adonis"
scp -i "$HOME/Downloads/loyal.pem" compose.prod.yaml ubuntu@CURRENT_IP:~/loyalty-nest/
```

**EC2:** validate the configuration, then start the specified service:

```bash
cd ~/loyalty-nest
sudo docker compose --env-file .env.prod -f compose.prod.yaml config --quiet
sudo docker compose --env-file .env.prod -f compose.prod.yaml up -d adminer
sudo docker compose --env-file .env.prod -f compose.prod.yaml ps adminer
```

Explicitly targeting `adminer` activates its profile and required `db` dependency.
This does not require rebuilding the frontend or API. Expect `Up` status and
`127.0.0.1:8080->8080/tcp` (Adminer has no separate `healthy` check here).
Source: [Compose profiles](https://docs.docker.com/compose/how-tos/profiles/).

**Mac, a separate terminal:** start the tunnel and leave the terminal open:

```bash
ssh -i "$HOME/Downloads/loyal.pem" \
  -o ExitOnForwardFailure=yes \
  -L 127.0.0.1:8081:127.0.0.1:8080 \
  -N ubuntu@CURRENT_IP
```

Port 8081 on the Mac forwards through encrypted SSH to port 8080 on EC2. Using
8081 locally avoids a conflict with the development Adminer on port 8080.
`-N` does not open a shell, so the absence of a new prompt is normal.
`ExitOnForwardFailure` closes the connection if forwarding cannot be established.

In the Mac browser, open `http://127.0.0.1:8081` and sign in:

| Field | Value |
| --- | --- |
| System | PostgreSQL |
| Server | `db` |
| Username | `POSTGRES_USER` from the server's `.env.prod` |
| Password | `POSTGRES_PASSWORD` from the server's `.env.prod` |
| Database | `POSTGRES_DB` from the server's `.env.prod` |

These are PostgreSQL credentials, not an application user account. This is the
actual production database; changes in Adminer affect the application immediately.
HTTP is used on the local connection, while the Mac–EC2 connection is encrypted by SSH.

When finished, sign out of Adminer and close the tunnel with Ctrl+C. **EC2:**

```bash
sudo docker compose --env-file .env.prod -f compose.prod.yaml stop adminer
```

For later sessions, run `up -d adminer`, open the tunnel, and sign in.
`restart: 'no'` means Adminer will not start automatically after an EC2 restart.
Closing the tunnel does not stop the container. If local port 8081 is occupied,
choose a different port on the left side of the forwarding rule and use that
port in the browser URL.
