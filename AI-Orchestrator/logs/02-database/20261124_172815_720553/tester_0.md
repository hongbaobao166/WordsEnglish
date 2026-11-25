I’ll verify the existing backend and run the phase checks against the configured development database without changing application source or exposing credentials. I’ll avoid destructive tests unless a separate approved test database is available.
The existing MySQL container is healthy, and the backend image is available. The project explicitly says no separate test database has been approved, so I won’t run Django’s database-creating test runner.
**All required checks for this MySQL configuration phase passed.** Django connected to the existing `learnenglish` database on MySQL 8.4.13. No application source files were modified.

| Check | Actual result |
|---|---|
| Dependency versions | Python 3.12.16, Django 5.2.19, mysqlclient 2.2.8 |
| `manage.py check` | No issues |
| `makemigrations --check --dry-run` | No changes detected |
| `migrate --noinput` | No migrations to apply |
| `seed_vocabulary` | Completed; a separate connection found 6 levels, 1 sample category and 2 sample words |

The seed counts were the same before and after the seed command. This verifies persistence of the existing sample records; it does not verify learning-progress persistence.

**Commands executed:** `docker ps`, `docker image ls`, and temporary `docker run --rm` containers running the version check, the Django commands above, and Django shell queries for the database identity, version and seed counts. Backend source and `.env` were mounted read-only; secret values were not displayed.

Destructive automated tests were not run: no separate test database has been approved. The existing Compose configuration, MySQL container and volume were preserved.

STATUS: PASS