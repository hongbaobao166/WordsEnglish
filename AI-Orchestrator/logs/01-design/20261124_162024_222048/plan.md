I’ll inspect the project’s existing frontend and provide a documentation plan only. I won’t create or modify `docs/architecture.md` in this phase because you explicitly requested no edits.
## Inspection outcome

The frontend is a React/Vite dashboard using Tailwind dependencies. `frontend/src/App.jsx` uses eight local mock words from `frontend/src/data/vocabulary.js` for dashboard counts, client-side search and status filtering, and flashcard navigation. Existing tests describe those interactions; they were not run.

No files were modified. In particular, `docs/architecture.md` was **not created**, in accordance with your final instruction: “No edits.” The requested document-existence check therefore remains unmet.

## Architecture document plan

When edits are authorized, document:

- **Data model:** Django users; shared categories and vocabulary with CEFR levels; per-user vocabulary progress and review schedules; review history; quiz sessions and answers. Specify foreign keys, uniqueness, deletion behavior and indexes.
- **API:** JWT registration, login and refresh; searchable, paginated vocabulary and categories; admin-only vocabulary management; user-scoped progress, due flashcards and reviews, quizzes, history and dashboard summaries.
- **Boundaries:** React API client and loading/error states; DRF views, serializers and permissions; service-layer scheduling and quiz logic; Django ORM and PostgreSQL migrations.
- **Implementation phases:** local isolated database and backend foundation; authentication and catalog; progress and spaced repetition; quizzes, history and dashboard; frontend integration and verification.
- **Verification:** dedicated test database, authentication and cross-user isolation tests, migration and API integration checks, plus optional manual browser visual review.

**Evidence:** Read `frontend/package.json`, `frontend/src/App.jsx`, `frontend/src/data/vocabulary.js`, `frontend/src/App.test.jsx` and `frontend/src/main.jsx`. A lookup for `docs` reported that the directory does not exist. No shell commands or runtime tests were run.