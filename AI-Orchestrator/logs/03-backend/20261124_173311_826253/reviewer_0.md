The supplied evidence shows the essential database-backed checks did not run. I’m reviewing the implementation separately for concrete defects that can be established from source.
## Review outcome

**FAIL — one concrete study-logic defect found.** Essential API and MySQL checks are also blocked and remain unverified.

### Defect

- `backend/vocabulary/views.py:108-110` excludes a learner’s existing progress records when `due_at` is `NULL`. This is a valid state: `backend/vocabulary/models.py:33-34` defaults progress to `status="new"` and permits a null due date. Such a word is neither in `due_ids` nor considered unstarted, so it never appears in flashcards.
- **Required change:** Include that learner’s progress records with `due_at__isnull=True` in the flashcard queryset. Add a test in `backend/vocabulary/tests.py` creating a default progress record and verifying that its word appears for its owner, without affecting another user’s results.

### Verification evidence

The supplied test report says the host lacks Django, DRF and Simple JWT; the local backend image lacks Simple JWT. Django checks and migration checks therefore failed to start. Database-backed tests did not run because an isolated test database and its creation/destruction lifecycle were not approved.

The source contains tests for authentication, catalog authorization, reviews, isolation and quizzes, but their presence is not evidence that they pass. Authentication, CRUD, study logic, migrations and MySQL persistence remain unverified.

**Files modified:** None.  
**Commands executed during this review:** None. Source was inspected using read-only file tools.

STATUS: FAIL