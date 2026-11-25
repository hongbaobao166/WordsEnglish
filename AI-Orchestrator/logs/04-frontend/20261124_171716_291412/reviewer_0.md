## Review findings

**FAIL — Editing an existing word does not retain its CEFR level in fixture mode.** Fixture words store `level` as a code such as `A2` (`frontend/src/services/fixtures.js:3–8`), but the editor’s level options use numeric IDs and the save handler converts the selected value to a number (`frontend/src/pages.jsx:49–51`). The existing level therefore does not match an option when editing.

**Changes needed:** Normalize the word’s level code to its corresponding level ID when opening the editor, and add a test that edits an existing fixture word without changing its level.

## Evidence and limits

- Inspected the frontend source and five test cases. The tests mock the API and do not cover vocabulary editing.
- The supplied test report records **5 tests passed** and a successful production build. Those results were not independently rerun in this review.
- **MANUAL CHECK:** Browser appearance and responsive behavior were not verified.
- No files were modified and no terminal commands were run. Backend, database and real API integration were not checked, as required for this phase.

STATUS: FAIL