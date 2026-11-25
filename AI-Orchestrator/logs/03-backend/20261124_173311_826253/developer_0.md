I’ll inspect the existing backend and its test configuration first, then implement the API without accessing secret values or using the existing application database for tests.
The existing models can be extended additively. Database-backed testing remains blocked because no dedicated test database or create/destroy lifecycle has been approved; I’ll still add tests and run checks that do not touch a database.
The API and study services are in place; this local Python environment does not currently have Django installed, so framework checks cannot run here without dependencies. I’m adding the migration and focused tests without connecting to MySQL.
Implemented the backend phase, but **database-backed behavior remains unverified**.

The changes add JWT registration, login, refresh and logout; staff-authorized catalog CRUD; search and pagination; user-scoped reviews, progress and flashcards; spaced repetition; and quizzes. They also add an additive migration, backend tests and API documentation.

**Verification:** Python syntax parsing passed for 18 files. The local Python environment lacks Django, so Django checks did not run. MySQL tests were not run because no isolated test database or create/destroy lifecycle has been approved. API behavior, migrations, authentication and persistence must not yet be considered verified.

**Files modified:** `backend/requirements.txt`, `backend/config/settings.py`, `backend/config/urls.py`, `backend/vocabulary/models.py`, `backend/README.md`.

**Files added:** `backend/vocabulary/services.py`, `serializers.py`, `views.py`, `urls.py`, `tests.py`, and `migrations/0002_review_quiz_quizquestion.py`.

**Commands executed:**
- Python import check for Django, DRF and Simple JWT — failed because Django is absent.
- Python AST syntax check across backend `.py` files — passed.
- `docker --version` and `docker image ls learnenglish-backend-local --format "{{.Repository}}:{{.Tag}}"` — confirmed Docker and a local image are present.

No database was accessed and no container or volume was modified. To complete verification, an explicitly approved dedicated MySQL test database and permission for Django’s test-database lifecycle are needed.