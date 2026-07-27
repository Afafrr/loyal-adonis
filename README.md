# Loyal Nest — AdonisJS API

Backend przepisany z Rails 8.1 na AdonisJS 7. Zachowuje PostgreSQL, sesyjne logowanie,
CSRF, kontrakt endpointów oraz układ usług Docker Compose (`backend`, `db`, `nfc`).

## Uruchomienie w Dockerze

1. Skopiuj `.env.example` do `.env` i ustaw bezpieczne `APP_KEY` oraz `NFC_MASTER_KEY`.
2. Uruchom `docker compose up --build`.

Usługi:

- API: `http://localhost:3000`
- PostgreSQL: `localhost:5433`
- serwis NFC: `http://localhost:5000`

Kontener backendu uruchamia migracje przed serwerem. Kod `api/` jest podmontowany,
a zależności są przechowywane w osobnym wolumenie `backend_node_modules`.
Przy pierwszym utworzeniu wolumenu PostgreSQL skrypt inicjalizacyjny tworzy też
oddzielną bazę `loyal_test` używaną wyłącznie przez testy.

## Lokalnie

Wymagane są Node.js 24+ i npm 11+.

```bash
cd api
npm ci
cp .env.example .env
node ace generate:key
npm run dev
```

Przy lokalnym PostgreSQL z Compose `DATABASE_URL` wskazuje port `5433`.

Gotowe requesty dla rozszerzenia VS Code REST Client znajdują się w
`api/requests/auth.http` i `api/requests/tag_scan.http`.

## Kontrakt API

- `GET /up`
- `GET /api/v1/csrf`
- `POST /api/v1/users`
- `POST /api/v1/users/sign_in`
- `DELETE /api/v1/users/sign_out`
- `GET /api/v1/me`
- `GET /api/v1/tag_scan?picc_data=...&enc=...&cmac=...`

Żądania zmieniające stan wymagają cookie `_loyal_session` i nagłówka
`X-CSRF-Token`. Token pobiera się z `GET /api/v1/csrf`; po rejestracji lub
logowaniu trzeba pobrać go ponownie. Klient przeglądarkowy musi używać
`credentials: 'include'`.

## Weryfikacja

```bash
cd api
npm run typecheck
npm run lint
npm run build
npm test
```

Testy funkcjonalne używają `loyal_test` z `api/.env.test`. Runner ma dodatkową
blokadę bezpieczeństwa i odmówi migracji/resetu bazy, której nazwa nie kończy się
na `_test`. Jeśli wolumen PostgreSQL powstał przed dodaniem bazy testowej, utwórz
ją jednorazowo:

```bash
docker compose exec db createdb -U loyal loyal_test
```

Przy niestandardowych danych PostgreSQL zaktualizuj także URL w `api/.env.test`.

## Migracja istniejących danych

Schema zachowuje nazwy tabel i kolumn z Rails, w tym `users.encrypted_password`.
Bcrypt kosztu 12 pozwala weryfikować istniejące hasła Devise. Ciasteczka sesji
Rails i AdonisJS nie są kryptograficznie zgodne, więc po przełączeniu użytkownicy
będą musieli zalogować się ponownie.

Migracja tworzy czysty schemat docelowy. Jeśli ma zostać użyta istniejąca baza
Rails z danymi, najpierw należy oznaczyć migrację bazową jako wykonaną albo
wykonać kontrolowany import do nowej bazy; nie uruchamiaj jej bezpośrednio na
bazie, która ma już te tabele.
