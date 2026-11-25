I’ll inspect the local project and `docs/architecture.md`, then outline the backend phase and its verification prerequisites. I won’t create files, install dependencies, or touch a database in this planning-only pass.
## Phase plan

1. Create the Django backend and document an isolated virtual environment. Pin Django, DRF and the PostgreSQL driver only after confirming compatibility with an installed, supported Python version.
2. Configure PostgreSQL exclusively through documented environment variables; fail clearly when configuration is missing. Do not fall back to SQLite.
3. Implement the models, relationships, constraints and indexes in `docs/architecture.md`, then generate and commit their migrations as project files.
4. Add a repeatable synthetic catalog seed command that does not overwrite user records.
5. Once a dedicated local test PostgreSQL database is explicitly identified as separate from existing data, run Django checks, migration consistency checks, migrations and the seed command; query the database to verify persistence. Record the actual commands and results.

## Evidence and prerequisites

- `docs/architecture.md` is present and specifies the data model and database safety requirements. No backend source was found in the project listing.
- `python --version` returned **Python 3.15.2**; `py -0p` listed that as the only installed Python. Its compatibility with pinned dependencies remains unverified.
- `Get-Command psql, pg_isready -ErrorAction SilentlyContinue` found neither command on `PATH`. This does not establish whether a PostgreSQL server exists.
- Database availability, dedicated test credentials and dependency availability remain **unverified**. If they cannot be safely established, the required database checks are blocked.

**Modified files:** none. No dependencies were installed and no database was accessed.