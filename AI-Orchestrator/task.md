
# PROJECT: LEARN ENGLISH

## Objective

Build a complete fullstack English vocabulary
learning website.

Preserve existing backend source code.
Create frontend from scratch if missing.

## Technology Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Python + Django REST Framework
- Architecture: Django MVT + Service Layer
- Database: MySQL 8.4
- ORM: Django ORM
- Authentication: JWT
- Container: Docker Compose

## Existing Database

MySQL container already exists and is running.

- Container: learnenglish-mysql
- Host: 127.0.0.1
- Port: 3306
- Database: learnenglish
- Username: learnenglish

If backend runs inside Docker Compose,
use mysql as the database hostname.

Read database password from existing .env.
Never display or overwrite secret values.

Do not create another MySQL container.
Do not delete existing Docker volumes.

## User Features

- Registration
- Login
- Logout
- Learning dashboard
- Vocabulary by CEFR level A1-C2
- Vocabulary search
- Vocabulary categories
- English and Vietnamese meanings
- Phonetic transcription
- Pronunciation
- Example sentences
- Flashcards
- Spaced repetition
- Vocabulary quizzes
- Learning progress
- Review history

## Admin Features

- Admin dashboard
- Vocabulary CRUD
- Category management
- CEFR level management
- Vocabulary search and pagination
- User management with authorization

## Frontend Requirements

- Modern light theme
- Responsive desktop and mobile layout
- Reusable React components
- Separate pages and API services
- Loading states
- Error states
- Form validation
- Real backend API integration

Mock data is allowed only during isolated
frontend development and testing.

Remove runtime mock data during integration.

## Backend Requirements

- Django REST Framework
- Service Layer
- JWT authentication
- Role-based permissions
- Input validation
- Error handling
- Pagination
- MySQL database integration
- Database migrations
- Sample vocabulary seed data
- Automated tests

## Workflow Rules

- Missing source folders must be created.
- Preserve existing valid implementation.
- Frontend must not depend on a running database
  during its independent development phase.
- Continue independent phases if another phase
  is blocked.
- Do not repeatedly repair environment blockers.
- Never report unverified features as completed.
- Optional visual browser checks may be manual.
- Essential integration checks must pass.

## Acceptance Criteria

- Frontend starts successfully.
- Frontend production build succeeds.
- Backend starts successfully.
- Django connects to MySQL.
- Database migrations succeed.
- Registration and login work.
- Vocabulary CRUD works.
- Learning progress persists in MySQL.
- Frontend communicates with real APIs.
- Automated tests pass.
- Setup documentation is available.

## Restrictions

- Do not deploy remotely.
- Do not push to remote Git repositories.
- Do not delete existing user data.
- Do not modify AI-Orchestrator.
- Do not expose credentials.
- Do not bypass operating system security.
- Do not modify unrelated projects.
