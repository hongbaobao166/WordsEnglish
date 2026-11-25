# Local Django/MySQL foundation

This local backend provides JWT authentication, catalog and study APIs. Install
`requirements.txt` and apply migrations before running it. These APIs and
migrations have not yet been verified against an approved MySQL test database.

The existing root `.env` must provide `MYSQL_PASSWORD`. Django reads it without
printing it; an already-set environment variable takes precedence. The host
default is `127.0.0.1:3306`, database/user `learnenglish`. The local container
uses the verified `mysql` alias on `learnenglish_default`. No Compose changes
are required. The development-only fallback secret key is not for deployment.

From the project root in PowerShell:

```powershell
docker build -t learnenglish-backend-local ./backend
$source = (Get-Location).Path
docker run --rm --network learnenglish_default -e MYSQL_HOST=mysql --mount "type=bind,source=$source\backend,target=/app" --mount "type=bind,source=$source\.env,target=/.env,readonly" learnenglish-backend-local python manage.py check
docker run --rm --network learnenglish_default -e MYSQL_HOST=mysql --mount "type=bind,source=$source\backend,target=/app" --mount "type=bind,source=$source\.env,target=/.env,readonly" learnenglish-backend-local python manage.py migrate
docker run --rm --network learnenglish_default -e MYSQL_HOST=mysql --mount "type=bind,source=$source\backend,target=/app" --mount "type=bind,source=$source\.env,target=/.env,readonly" learnenglish-backend-local python manage.py seed_vocabulary
docker run --rm --network learnenglish_default -p 127.0.0.1:8000:8000 -e MYSQL_HOST=mysql --mount "type=bind,source=$source\backend,target=/app" --mount "type=bind,source=$source\.env,target=/.env,readonly" learnenglish-backend-local
```

The seed adds six levels, one sample category and two sample words where absent;
it does not update existing records. Django's test runner creates and destroys
databases. Do not run it until a separate test database name and permissions are
explicitly approved; then set `MYSQL_TEST_DATABASE` to that name. The settings
reject an unset name or `learnenglish`, but cannot establish approval or ensure
another existing database is safe to destroy. No test database has been approved.

## API

All endpoints are under `/api/`. Register at `auth/register/` (username,
password, optional email), obtain tokens at `auth/login/`, rotate a refresh
token at `auth/refresh/`, revoke it at `auth/logout/` (authenticated, JSON
`refresh`), and read the current user at `auth/me/`. Send access tokens as
`Authorization: Bearer <access>`. Logout revokes the refresh token; already
issued access tokens remain valid until expiry.

Authenticated users can read `levels/`, `categories/`, and `vocabulary/`;
staff can create, update and delete them. Vocabulary supports `search`, `level`
(CEFR code) and `category` (slug) query parameters. Lists are paginated with
`page`; referenced catalog records return 409 on deletion.

`flashcards/` lists unstarted or due words. POST `reviews/` with a vocabulary
ID and rating 0–5 to update progress and append history. Ratings below 3 reset
the repetition count with a one-day interval; successful reviews use intervals
of 1, 3, then twice the previous interval in days. `progress/` and `reviews/`
are scoped to the current user.

POST `quizzes/` with a `count` from 1 to 50 (default 5); at least four distinct
Vietnamese meanings and the requested number of words must exist. Submit once
to `quizzes/<id>/submit/` with `answers` mapping question IDs to selected option
strings. Answers are revealed only after submission. Quiz questions are
snapshotted and scoped to their owner.

Once an isolated MySQL test database and its creation/destruction have been
explicitly approved, configure `MYSQL_TEST_DATABASE` and run
`python manage.py test vocabulary`. Never point this at an existing user
database. The test suite and API behavior remain unverified until this succeeds.
