**Review outcome: blocked by PostgreSQL verification.** The inspected source contains the requested models, initial migration, PostgreSQL settings, synthetic seed command, and setup instructions. No source was edited and no commands were run during this review.

The supplied evidence reports that Django checks and migration consistency checks passed only with a non-connecting dummy backend. PostgreSQL startup failed because application control blocked the psycopg binary and `libpq` was unavailable. Applying migrations, running the seed twice, and verifying persisted data remain unverified.

To unblock, provide an approved PostgreSQL driver or `libpq` and a confirmed dedicated local test database with credentials. Then run the PostgreSQL checks, migration, repeat seed, and persisted-data query documented in `backend/README.md`.

STATUS: BLOCKED