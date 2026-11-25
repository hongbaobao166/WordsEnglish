I’ll check the backend’s available test setup and run only checks that do not touch the existing application database. Database-backed tests will require an approved isolated test database.
The host Python lacks Django, but a local backend image is available. I’ll use it with a read-only source mount and networking disabled for framework checks; it cannot reach the application database.
**Backend phase checks are blocked.** The available backend image lacks Simple JWT, and no approved isolated MySQL test database was provided. Authentication, authorization, user isolation, CRUD, study logic, migrations, and MySQL persistence remain unverified.

**Commands and results:**
- `python -c "import importlib.util; ..."` — Django, DRF, and Simple JWT were unavailable on the host.
- `docker image ls learnenglish-backend-local --format "{{.Repository}}:{{.Tag}}"` — local image found.
- `docker ps --format "{{.Names}}"` — `learnenglish-mysql` is running.
- `docker run --rm --network none --mount "type=bind,source=D:\ProjectPerson\LearnEnglish\backend,target=/app,readonly" -e PYTHONDONTWRITEBYTECODE=1 learnenglish-backend-local:latest python manage.py check` — failed: `No module named 'rest_framework_simplejwt'`.
- The same isolated Docker command with `manage.py makemigrations --check --dry-run` — failed on the same missing module.
- The same isolated Docker command with `manage.py test` — stopped because `MYSQL_TEST_DATABASE` was not set to an approved test database; no tests ran.

**Files modified:** none. Existing containers and volumes were preserved; no database was accessed. To proceed, provide an environment with the declared backend dependencies and approve a dedicated MySQL test database and Django’s test-database lifecycle.

STATUS: BLOCKED