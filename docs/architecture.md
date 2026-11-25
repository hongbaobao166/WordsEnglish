# LearnEnglish architecture

## Status and scope

This is a **proposed design**, not a description of implemented features.
The project root inspected for this document contained neither `frontend/` nor
`backend/`; there is no application source to inspect. Create those directories
during implementation, preserving any valid work. The existing Compose and
environment files were not inspected for secret values. Database and API
availability have not been verified.

The target stack is React + Vite with Tailwind CSS, Django and
Django REST Framework (DRF), MySQL 8.4 via the Django ORM and migrations,
and Django's user model with JWT authentication. Use synthetic seed data only.

## Data model

All IDs below are primary keys. Timestamps are timezone-aware. Use
`settings.AUTH_USER_MODEL` for user references. Vocabulary and categories are
shared; learning records are owned by a user.

| Model | Key fields and relationships | Constraints and behavior |
| --- | --- | --- |
| User | Django user model: username, password hash, optional email | Django validates passwords and hashes them; never store raw passwords. |
| Category | name, unique slug, description | One category has many words; indexed unique slug. |
| CEFRLevel | unique code (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`), name, description, sort order | Seed the six codes; administrators manage labels and descriptions, not the standardized codes. Protect referenced levels from deletion. |
| Vocabulary | word, English meaning, Vietnamese meaning, optional phonetic transcription, optional pronunciation audio URL, optional example sentence, level FK, category FK, created/updated timestamps | Level and category are required and protected. Index level, category and word for catalog filtering/search. Validate audio URLs; pronunciation playback is available when audio exists. |
| VocabularyProgress | user FK, vocabulary FK, status (`new`, `learning`, `mastered`), due_at, interval_days, ease_factor, repetition_count, last_reviewed_at | Unique `(user, vocabulary)`; index `(user, due_at)` and `(user, status)`. An absent row means `new` and immediately due. |
| Review | user FK, vocabulary FK, reviewed_at, rating (`again`, `hard`, `good`, `easy`), resulting status and next_due_at | Append-only learning history; index `(user, reviewed_at)`. Snapshot results so later schedule changes do not rewrite history. |
| QuizSession | user FK, status (`in_progress`, `completed`), created_at, completed_at, score, question_count | Score is correct answers on completion; index `(user, created_at)`. |
| QuizQuestion | session FK, vocabulary FK, position, prompt and answer-option snapshots, correct-option key | Unique `(session, position)` and `(session, vocabulary)`; snapshot content makes grading stable if catalog changes. Never return the correct key before submission. |
| QuizAnswer | question one-to-one, selected-option key, is_correct, answered_at | At most one answer per question; derive ownership through session. |

User deletion cascades to that user's progress, reviews and quiz sessions;
session deletion cascades to its questions and answers. Vocabulary deletion is
protected while referenced by progress, review or quiz records, preserving
history; category and vocabulary delete endpoints therefore report a conflict
when protected. These are application deletion semantics, not permission to
remove existing data during development.

Progress scheduling fields are server-managed, not editable through catalog or
progress APIs. Store `due_at`, `last_reviewed_at`, and `completed_at` as
nullable where a review or completion has not yet occurred. A persisted
progress row must have a nonnegative interval and repetition count and a
positive ease factor; enforce these invariants in validation and database
constraints where supported. Define a deterministic ordering for absent
progress in due-card queries before applying pagination.

## API contract

Proposed JSON REST API under `/api/`; all routes require a valid access token
unless explicitly marked public. Paginated lists use DRF page-number pagination
with `count`, `next`, `previous`, and `results`; filters combine with AND.
Validation errors use field-to-message mappings, authentication/permission
errors use `detail`, and protected deletion returns HTTP 409. Dates are ISO
8601 with timezone. These contracts should be tested and refined before client
integration.

| Method and route | Purpose |
| --- | --- |
| `POST /auth/register/` | Public registration with username and password; return safe user fields, not tokens or password. |
| `POST /auth/token/` | Public username/password login; return access and refresh JWTs. |
| `POST /auth/token/refresh/` | Public refresh-token exchange for an access token. |
| `POST /auth/logout/` | Authenticated logout; submit the refresh token for revocation and clear client credentials. Access tokens expire naturally. |
| `GET /auth/me/` | Current authenticated user's safe profile. |
| `GET /categories/`, `GET /categories/{id}/` | List and retrieve shared categories; list is paginated. |
| `POST /categories/`, `PATCH /categories/{id}/`, `DELETE /categories/{id}/` | Admin-only category management. |
| `GET /levels/`, `GET /levels/{id}/` | List and retrieve CEFR levels in sort order. |
| `PATCH /levels/{id}/` | Admin-only update of level name, description and sort order; standardized codes are immutable. |
| `GET /vocabulary/`, `GET /vocabulary/{id}/` | Shared catalog; list supports `search` on word/meaning, `category`, `level`, `status`, and `page`. Status is evaluated for the requesting user, including missing progress as `new`. |
| `POST /vocabulary/`, `PATCH /vocabulary/{id}/`, `DELETE /vocabulary/{id}/` | Admin-only vocabulary management. Validate level and category. |
| `GET /progress/` | Paginated current-user progress, optionally filtered by `status`; missing rows are not listed. |
| `GET /flashcards/due/` | Paginated vocabulary due for the current user, including words without progress; stable ordering by due time then ID. |
| `POST /vocabulary/{id}/reviews/` | Submit a rating; atomically update current-user progress and append a review. Return updated progress and review. |
| `POST /quizzes/` | Create a quiz from available catalog words, optionally filtered by category and level; return question IDs, prompts and options without correct answers. Reject insufficient eligible words/options. |
| `GET /quizzes/{id}/` | Retrieve an owned session and its questions; expose correct answers only after completion. |
| `POST /quizzes/{id}/submit/` | Submit one selected option for every question; atomically grade and complete the owned session. Reject invalid, incomplete or repeated submissions. |
| `GET /history/reviews/`, `GET /history/quizzes/` | Paginated current-user review and completed-quiz history, newest first. |
| `GET /dashboard/` | Current-user summary: catalog total, counts by progress status (including unstarted words as new), due count, review count and completed quiz count. |
| `GET /admin/dashboard/` | Admin-only aggregate counts for users, catalog, categories and learning activity. |
| `GET /admin/users/`, `GET /admin/users/{id}/` | Admin-only paginated user list and safe profile detail, with search. |
| `PATCH /admin/users/{id}/` | Admin-only update of allowed account fields and active/staff status; validate privilege changes and prevent self-lockout. Never expose password hashes. |

Use standard `201` for creation, `200` for reads/updates and `204` for
successful deletion. Unknown or other-user resource IDs return `404`; unauthenticated
requests return `401`, and non-admin writes to shared catalog return `403`.

Contract examples (paths have the `/api` prefix):

* Register: `POST /api/auth/register/` with `{"username":"learner","password":"<password>","email":"learner@example.test"}` returns `201` with `id`, `username`, and `email`.
* Login: `POST /api/auth/token/` with username and password returns `200` with `access` and `refresh`; logout accepts `{"refresh":"<refresh-token>"}` and returns `204`.
* Catalog: `GET /api/vocabulary/?search=book&level=A1&category=1&page=1` returns the pagination envelope. Each item includes `id`, `word`, `meaning_en`, `meaning_vi`, `phonetic`, `audio_url`, `example_sentence`, `level` and `category`; level is a CEFR code in filters and level/category IDs in writes.
* Review: `POST /api/vocabulary/1/reviews/` with `{"rating":"good"}` returns `201` with `progress` and `review`. The server determines the user and schedule.
* Quiz: `POST /api/quizzes/` accepts `{"question_count":5,"level":"A1","category":1}` (filters optional); submission accepts `{"answers":[{"question_id":1,"selected_option":"A"}]}`. A completed response includes the score and correct options.

Catalog responses represent `level` as its code and `category` as its numeric
ID; create and update requests supply numeric IDs for both relationships.
`GET /flashcards/due/` orders never-reviewed words first by vocabulary ID,
followed by scheduled words ordered by `due_at` and vocabulary ID; scheduled
words are due when `due_at` is at or before the server's current UTC time.
Quiz submissions must contain each question ID exactly once and select an
option belonging to that question. History and dashboard values are derived
from records owned by the authenticated user, except for explicitly identified
catalog totals and the staff-only aggregate dashboard.

Invalid input returns `400` with field errors; duplicate or expired/revoked token
use fails authentication. Implement refresh rotation and a server-side refresh
token blacklist for logout; do not log token values.

## Authentication and security

Use a maintained DRF JWT implementation with short-lived access tokens and
refresh tokens. The client sends `Authorization: Bearer <access>`; it must
handle expiry, failed refresh and logout without exposing credentials in logs.
Choose and document a token storage and refresh-rotation policy during
implementation, accounting for XSS and CSRF. Registration never grants staff
privileges. Catalog writes require Django staff/admin permission; user-owned
querysets and object lookups are always scoped server-side to `request.user`,
never to a client-supplied user ID. Validate request data and use HTTPS outside
local development. No real credentials or secrets belong in the repository.

## Boundaries and behavior

* **Frontend:** create a React + Vite + Tailwind CSS application from scratch,
  preserving valid work produced during implementation. A central API client
  owns the base URL, authentication headers and refresh/error handling;
  feature-level hooks or components own loading, empty, success and error states.
  Connect features to the real API and replace any development mock data
  incrementally. Configure a local API URL through Vite environment variables.
* **Django/DRF:** models and migrations define persistence; serializers
  validate input and control output; views/viewsets handle HTTP and permissions.
  Django admin may manage catalog records, subject to the same constraints.
* **Services:** review scheduling and quiz creation/grading live outside views.
  Review submission uses a transaction and row locking or equivalent concurrency
  protection, including first-time progress creation. A simple SM-2-inspired
  scheduler can map ratings to interval/ease changes, with documented bounds
  and UTC due dates. Quiz creation snapshots questions and options; grading
  checks membership and completes the session in one transaction.
* **Persistence:** MySQL 8.4 stores shared catalog and user-scoped learning
  data. Migrations own schema changes; synthetic fixtures or a management command
  provide repeatable local seed data without overwriting user records.

## Implementation and verification phases

1. **Foundation:** create the frontend application and establish the backend
   project, local-only MySQL configuration, migrations and synthetic seed
   mechanism. Document actual setup commands and environment variable names when
   implemented.
2. **Identity and catalog:** implement registration, JWT, permissions,
   categories, vocabulary, filtering and pagination; test invalid credentials,
   token expiry/refresh/logout and admin versus ordinary users. Add level and
   category management, admin dashboard and authorized user management.
3. **Learning:** implement progress, due cards, review service and history;
   test scheduling boundaries, transactions, absent progress and isolation.
4. **Quizzes and dashboard:** implement quiz snapshots, grading, history and
   aggregate summaries; test invalid/repeated submissions and user isolation.
5. **Integration:** connect the new UI to APIs with loading/error states,
   replacing any development mock data; document actual migration, seed, API
   and test commands, and run end-to-end integration checks. Preserve valid work
   produced during implementation. Manual browser visual review may be recorded
   separately and is not a substitute for automated checks.

All database and integration tests must use a **dedicated local test database**,
explicitly configured and confirmed separate from development and production
data before running migrations or tests. Test migrations against that database,
and exercise real MySQL, registration/login/refresh/logout, authorization,
cross-user isolation, catalog, reviews, quiz grading and frontend/API integration.
Do not target an existing production database. Runtime tests are not applicable
to this documentation-only phase.

## Local configuration and implementation plan

Use the existing `learnenglish-mysql` container and its existing volume; do not
create a second MySQL container or remove volumes. For a backend on the host,
configure `127.0.0.1:3306`; for a Compose backend use `mysql:3306` only after
verifying that the existing container is reachable by that service/network
alias. Use database `learnenglish` and user `learnenglish`. Read the password
from the existing local `.env` at runtime without printing or overwriting it;
do not assume a variable name until configuration is inspected safely.
Use Django's MySQL backend, a compatible MySQL driver, InnoDB, `utf8mb4`, and
strict SQL mode. Connection and migration success remain unverified.

Create `backend/` with Django settings, URL routing, application models,
migrations, DRF serializers/views/permissions, services, seed command and tests.
Create `frontend/` with Vite, Tailwind, reusable components, separate pages and
API services. Include registration/login, dashboard, catalog/search, level and
category browsing, flashcards/reviews, quizzes, history/progress, and authorized
admin pages. Implement responsive light layouts, form validation and loading,
empty and error states. Frontend development may use isolated mocks without a
database; remove runtime mocks on integration. Continue independent work if
another phase is blocked; do not repeatedly repair environment blockers.

Before any database test or test migration, obtain confirmation of a dedicated
local test database and configure its explicit Django `TEST.NAME` and appropriate
permissions. Never point test creation or teardown at `learnenglish` or another
existing user database. Essential integration checks must exercise the real API
and persistence before acceptance; document observed results rather than assuming
success. Compose changes, if needed later, must preserve existing services and
volumes, without deployment or changes to unrelated projects.
