# Wordwise frontend

React, Vite and Tailwind frontend for the Learn English project. This phase is independent of Django and MySQL.

```sh
npm install
npm run dev
npm test
npm run build
```

For isolated UI development, explicitly set `VITE_USE_FIXTURES=true` in your local shell before starting Vite. Sign in as `learner` or `admin` with any password of at least eight characters. Fixture changes exist only in memory and reset on reload; fixture authentication and quiz grading are not security implementations. Never use this mode with real user data.

Without that flag, the app uses the proposed API under `/api` (or `VITE_API_URL` if set). The contract in `docs/architecture.md` is not yet verified against a backend. Tokens are held only in memory and a page reload signs the user out; this avoids persistent browser token storage but does not replace an XSS/CSRF security review. Logout currently clears local credentials only; server-side token revocation must be implemented during integration. Remove runtime fixtures during integration. Server-side authorization is required regardless of frontend navigation.

Browser visual checks and real API integration are separate from frontend tests and build.
