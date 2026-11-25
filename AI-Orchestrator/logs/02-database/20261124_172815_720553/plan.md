The project root has no `backend` directory, so I’m checking whether Django source exists elsewhere in this project before identifying what the plan can safely assume.
## Phase plan

**Blocked for implementation:** No Django backend was found in the current project. Searches found no `manage.py`, `settings.py`, or migration files. The existing `docs/architecture.md` describes a proposed backend, not an implemented one. The requested reuse of existing models and migrations therefore cannot be verified; their source must be supplied or creation explicitly authorized.

1. **Resolve the backend dependency.** Locate or obtain the existing Django source, dependency manifest, models, migrations and seed mechanism within this project. If they do not exist, agree on creating `backend/` and those missing components rather than assuming they can be reused.
2. **Configure MySQL.** Once the backend is available, select compatible supported Python, Django and `mysqlclient` versions. Load `MYSQL_PASSWORD` from the root `.env` at runtime without displaying it. Use `127.0.0.1:3306` on the host; use `mysql:3306` in a Linux backend container only after verifying the existing network alias. Do not alter `compose.yaml`, the MySQL container or its volume.
3. **Verify development database safely.** Confirm the connection target and MySQL version, run Django checks and migration consistency checks, review migration effects, then apply migrations to the designated `learnenglish` development database. Verify seed idempotence and persistence without overwriting or deleting existing records.
4. **Isolate destructive tests.** Obtain explicit approval for a separate test database and configure Django’s `TEST.NAME` and permissions before running tests. Do not create, reuse or destroy a database without confirmation.
5. **Document and report.** Record the actual setup, commands, results and any blockers; do not claim acceptance until essential checks pass.

## Inspection and evidence

- Root `.env` exists; its contents were not read or displayed. `compose.yaml` structurally references a `mysql:8.4` service and `mysql_data` volume.
- No database connection, Django checks, migrations, seed verification or tests were run: this was a **plan-only** request. The running container, driver availability and database credentials remain unverified.
- No files modified.
- Shell commands executed:
  - `Get-ChildItem -Force | Select-Object Name,Mode`
  - `Get-ChildItem -Force -Name .env,backend,requirements.txt,pyproject.toml -ErrorAction SilentlyContinue`
  - A filtered `Get-Content compose.yaml` command to inspect service, image and volume structure without displaying configuration values.
- File searches and a read of `docs/architecture.md` were also performed.