The Django source and migrations are still absent, so there is no PostgreSQL configuration to replace. I’ll create a limited MySQL-backed Django foundation for this phase, preserving the existing Compose setup and data; a separate test database has not yet been approved.
The MySQL container is healthy and has the `mysql` alias on `learnenglish_default`. The host only reports Python 3.15, with no Django or MySQL driver installed, so I’ll use a local Python 3.12 Linux image rather than alter the host or Compose file.
The Linux backend connected to `learnenglish` on MySQL 8.4.13; Django reports no system-check issues or model/migration drift. The database currently reports no tables, so the initial migration plan can be reviewed without touching existing records.
**MySQL-backed Django foundation created and connected.** There was no existing Django backend, PostgreSQL configuration, model, or migration to reuse. The existing `compose.yaml`, MySQL container and volume were preserved.

### Verification

- Connected to the `learnenglish` database on MySQL **8.4.13** through the existing Compose network.
- Django system check passed; `makemigrations --check --dry-run` reported no changes.
- Reviewed the migration plan, then applied all initial migrations successfully. The database reported no tables before migration.
- Ran the seed twice. A subsequent connection found six levels, one sample category and two sample words.
- **Blocked:** destructive automated tests were not run because no separate test database has been approved. Learning-progress persistence, backend startup and application APIs were not verified.

### Files created

`backend/Dockerfile`, `.dockerignore`, `requirements.txt`, `manage.py`, `README.md`; `backend/config/{__init__.py,settings.py,urls.py,wsgi.py}`; and `backend/vocabulary/` model, migration, package and seed-command files, including `migrations/0001_initial.py`.

### Commands executed

- Inspection: `python --version`, `py -0p`, `python -m pip show Django mysqlclient python-dotenv djangorestframework`, Docker container/image/network inspection, and a key-name-only `.env` check.
- `docker build -t learnenglish-backend-local ./backend`
- Using temporary backend containers on `learnenglish_default`, with the root `.env` mounted read-only: `python manage.py makemigrations vocabulary`, `check`, `makemigrations --check --dry-run`, `migrate --plan`, `migrate --noinput`, and `seed_vocabulary` twice.
- Django shell queries checked the database identity, version, existing tables and persisted seed counts.

Local setup instructions are in `backend/README.md`.