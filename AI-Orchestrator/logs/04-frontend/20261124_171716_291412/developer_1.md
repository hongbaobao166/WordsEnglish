I’ll check the existing frontend and the reported CEFR editing defect, then make the smallest compatible fix and run the frontend tests and production build. No backend or database access is needed.
The current editor already converts a fixture’s CEFR code to its level ID when opening the form, so the reported defect appears to have been fixed in the existing source. I’m adding a regression test against the actual fixture service to verify that editing and saving preserves the level.
**Frontend checks passed.** The existing editor already converts a fixture word’s CEFR code to its level ID. A new regression test verifies that editing “curious” and saving another field preserves its A2 level.

**Files changed**
- Added `frontend/src/AdminWords.test.jsx`.
- The production build generated files under `frontend/dist/`. No application source was changed.

**Commands executed** in `frontend/`:
- PowerShell `Get-Content` command to inspect the editor’s existing edit handler.
- `npm test` — 6 tests passed; React Router emitted future-version warnings.
- `npm run build` — passed.

**Not verified:** Browser appearance and responsive layouts, the development server, backend, database, and real API integration. The latter three were not required for this phase.