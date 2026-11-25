I’ll inspect the backend structure and existing API/test coverage without reading environment secrets or touching the database. The deliverable will be a phase-specific plan only.
## Current state

The backend is a Django/MySQL foundation, not yet an application API. It has catalog and progress models, an initial migration and a seed command. `backend/config/urls.py` exposes only Django admin; no API, service layer or backend tests were found. The architecture document is a proposal and predates the current backend, so its status section is outdated.

`backend/README.md` states that **no dedicated test database has been approved**. Its test-database guard alone cannot establish that a database is safe to destroy.

## Phase plan

1. **Identity and authorization**
   - Add a maintained DRF JWT dependency, registration and password validation, login, refresh, refresh-token revocation/logout, and current-user endpoints.
   - Configure authenticated defaults; prevent public registration from granting privileges. Restrict catalog writes to staff and scope learning resources to the authenticated user.

2. **Catalog**
   - Add serializers, permissions, views, routes and a service layer for vocabulary CRUD, categories and CEFR levels.
   - Implement validated search, combined filters and stable pagination. Preserve referenced records; return a clear conflict for protected deletions.

3. **Learning**
   - Extend progress through additive migrations; add review history and scheduling fields without replacing existing data.
   - Implement due flashcards, user-scoped progress and history, and a documented deterministic spaced-repetition service. Atomically update progress and append reviews, including concurrent first reviews.

4. **Quizzes**
   - Add quiz session, question and answer models with snapshot-based questions and grading.
   - Validate options and complete submissions; conceal answers until completion. Make grading atomic and prevent repeated submissions and cross-user access.

5. **Verification and documentation**
   - Add backend tests for authentication and revocation, validation, staff permissions, CRUD, filters and pagination, user isolation, scheduling, review transactions, and quiz grading.
   - After explicit approval of an isolated local MySQL test database and its lifecycle, run migrations and tests against it, then verify real API and persistence behavior. Document observed results and setup without exposing credentials. Do not use or destroy the existing `learnenglish` database or volumes for tests.

**Approval needed before database tests:** identify an explicitly approved dedicated test database and confirm whether Django may create and destroy it. Until then, implementation planning and other independent work can continue, but database-backed checks remain blocked.

## Evidence

- **Files modified:** none.
- **Commands executed:** none; inspection used file-listing, reading and search tools.
- **Tests executed:** none. API behavior, database connectivity and migrations were not verified.