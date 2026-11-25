I’ll inspect the project structure and existing frontend configuration without opening environment files or changing source code, then outline a frontend-only implementation and verification plan.
## Phase plan

**Inspection result:** There is no `frontend/` or `backend/` directory and no detected Vite, Tailwind, or `package.json` configuration. `docs/architecture.md` provides a proposed—not verified—API contract. No source files were modified.

1. **Initialize `frontend/`** with React, Vite, Tailwind CSS, routing, and frontend test tooling. Add local setup instructions.
2. **Create reusable UI** for the responsive light-theme layout, navigation, forms, tables, pagination, dialogs, and loading, empty, and error states.
3. **Create learner pages:** registration, login, dashboard, searchable vocabulary with CEFR and category filters, flashcards and review ratings, quizzes, progress, and learning history.
4. **Create admin pages:** dashboard, vocabulary CRUD, category and level management, and user management. Include client-side validation and staff-only navigation; server-side authorization remains a later integration requirement.
5. **Separate API services** by feature behind a shared client, using the proposed contract as a starting point. Provide explicitly selected, synthetic fixtures for independent UI development and tests; do not silently fall back to fixtures on API errors. Remove runtime fixtures during integration.
6. **Verify independently:** run frontend tests covering navigation, validation, key learning and admin interactions, and loading/error states; run the production build. Record actual results and any blockers. Backend and database availability are not prerequisites for this phase.

**Checks in this planning-only request:** No shell commands, tests, builds, or browser checks were run. Browser visual checks remain unverified and should be reported separately during implementation. No files were modified.