I’ll keep this phase frontend-only, with an explicit fixture mode for independent use and no database access. I’ll first check the local files and available tooling, then implement and run the requested checks.
The project has no existing frontend, so I’m creating one without touching the existing environment or Docker configuration. The documented API is explicitly proposed, so the real service layer will remain an integration starting point rather than a claim of backend compatibility.
The learner and staff screens are in place, with fixtures explicitly opt-in and labeled as temporary. The install reported dependency vulnerabilities; I’ll report those rather than apply an unreviewed forced upgrade.
Created the frontend-only React, Vite and Tailwind application in `frontend/`. It includes learner and admin screens, reusable components, an API service layer, and explicitly enabled in-memory fixtures for independent UI development.

**Verification**
- `npm test`: **5 tests passed**, covering validation, login error handling, vocabulary search, flashcard review, staff navigation and quiz submission.
- `npm run build`: **passed**.
- Browser visual checks were **not performed**. The development server was not started or independently verified.
- `npm install` reported **8 dependency vulnerabilities**: 5 moderate, 1 high and 2 critical. No forced upgrade was applied.

**Integration limits:** The API contract is proposed and was not tested against a backend. Fixture data resets on reload and must be removed during integration. Real logout currently clears client tokens only; server-side revocation remains to be implemented. Backend, MySQL and Docker were not accessed.

**Files created**
- `frontend/package.json`, `package-lock.json`, `.gitignore`, `index.html`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `README.md`
- `frontend/src/main.jsx`, `App.jsx`, `pages.jsx`, `styles.css`, `App.test.jsx`
- `frontend/src/components/Layout.jsx`, `UI.jsx`
- `frontend/src/services/client.js`, `api.js`, `fixtures.js`
- `frontend/src/test/setup.js`

**Commands executed:** `node --version`, `npm --version`, `npm install`, `npm test` (initially failed due to button-name test selectors; passed after correction), `npm run build`, and a PowerShell `Get-Content`/`Set-Content` replacement to correct those test selectors.