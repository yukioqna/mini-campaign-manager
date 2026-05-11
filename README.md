# Mini Campaign Manager

A MarTech tool for creating, managing, scheduling, sending, and tracking email campaigns.

## Tech Stack

- **Backend:** Express + TypeScript, PostgreSQL, Sequelize, JWT, zod
- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, React Query, Zustand
- **Monorepo:** Yarn workspaces

---

## Local Setup

Two workflows are available depending on your needs.

### Option A — Full Stack with Docker (simplest)

Get the entire app running with a single command.

```bash
# 1. Configure environment
cp server/.env.production.example server/.env.production

# 2. Start all services (postgres + api + web)
docker compose up -d --build

# 3. Run migrations (first time only)
docker compose exec api yarn workspace server migrate

# 4. Open the app
open http://localhost:8080
```

Services: postgres → api → web (health-checked startup order)
- Frontend: http://localhost:8080
- API via proxy: http://localhost:8080/api (internal: api:3001)
- Health: http://localhost:8080/health → `{"ok":true}`

Stopping: `docker compose down` (data persists) or `docker compose down -v` (destroys data)

---

### Option B — Local Development (docker compose for DB only)

Run postgres in Docker; start the API and frontend locally with `yarn dev`.

**Prerequisites:** Node.js 18+, Yarn, Docker.

```bash
# 1. Install dependencies
yarn install

# 2. Start postgres in Docker (exposed on localhost:5432)
docker compose up -d postgres

# 3. Configure environment
cp server/.env.example server/.env

# 4. Run migrations
yarn workspace server migrate

# 5. Start dev servers
yarn dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:5173

**Running tests (postgres must be running):**
```bash
docker compose up -d postgres
yarn workspace server test   # 36/36 backend tests
yarn test:e2e              # 4/4 E2E tests
```

**Stopping dev postgres:**
```bash
docker compose down
```

---

## Verification

```bash
# Backend tests (requires postgres)
docker compose up -d postgres
yarn workspace server test

# Build checks (no postgres required)
yarn workspace server build
yarn workspace client build

# E2E tests (requires running backend)
yarn test:e2e
```

---

## Docker Production Deployment

For production VPS deployments, use the dedicated production compose file. It is equivalent to `docker compose up` but makes the production intent explicit.

### Prerequisites

- Docker and Docker Compose v2 installed

### 1. Configure environment

```bash
cp server/.env.production.example server/.env.production
# Edit server/.env.production — set JWT_SECRET to a random string
```

### 2. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 3. Run migrations inside the api container

```bash
docker compose -f docker-compose.prod.yml exec api yarn workspace server migrate
```

### 4. Verify

```bash
# Frontend — served by nginx on port 80
curl http://localhost/health
# → {"ok":true}

# API via nginx proxy
curl http://localhost/api/auth/me
# → 401 (unauthenticated, as expected)
```

- Frontend: http://localhost (port 80)
- API via proxy: http://localhost/api (internal: api:3001)
- Note: the default `docker compose up` serves the frontend on port **8080**; the production compose uses port **80**.

### Updating / Redeploying

```bash
# Pull latest changes and rebuild
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations after code update
docker compose -f docker-compose.prod.yml exec api yarn workspace server migrate
```

### Stopping

```bash
# Stop containers (data persists in named volume)
docker compose -f docker-compose.prod.yml stop

# Remove containers and networks (data volume preserved)
docker compose -f docker-compose.prod.yml down

# ⚠️ WARNING: Remove containers AND postgres data volume (irreversible)
docker compose -f docker-compose.prod.yml down -v
```

---

## API Overview

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Campaigns

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/campaigns | List campaigns |
| POST | /api/campaigns | Create campaign |
| GET | /api/campaigns/:id | Get campaign details |
| PATCH | /api/campaigns/:id | Update campaign (draft only) |
| DELETE | /api/campaigns/:id | Delete campaign (draft only) |
| POST | /api/campaigns/:id/schedule | Schedule campaign |
| POST | /api/campaigns/:id/send | Send campaign |
| GET | /api/campaigns/:id/stats | Get campaign stats |

### Recipients

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/recipients | List all recipients |
| POST | /api/recipients | Create recipient |
| POST | /api/recipient | Create recipient (singular alias, required by challenge spec) |
| POST | /api/campaigns/:id/recipients | Add recipients to campaign |

### Stats Response

```json
{
  "total": 100,
  "sent": 70,
  "failed": 30,
  "opened": 45,
  "open_rate": 0.6429,
  "send_rate": 0.70
}
```

---

## Database Schema & Indexing

### Tables

**users** — `id` (UUID PK), `email` (VARCHAR 255, UNIQUE), `password_hash`, `name`, `created_at`

**campaigns** — `id` (UUID PK), `created_by` (FK→users.id), `name`, `subject`, `body` (TEXT), `status` (ENUM: draft/scheduled/sending/sent), `scheduled_at`, `sent_at`, `created_at`, `updated_at`

**recipients** — `id` (UUID PK), `email` (VARCHAR 255, UNIQUE), `name`, `created_at`

**campaign_recipients** — `id` (UUID PK), `campaign_id` (FK→campaigns.id), `recipient_id` (FK→recipients.id), `status` (ENUM: pending/sent/failed), `sent_at`, `opened_at`, `created_at`

### Key Indexes

| Table | Index | Purpose |
|---|---|---|
| users | `email` UNIQUE | Prevent duplicate registrations |
| recipients | `email` UNIQUE | Prevent duplicate recipients |
| campaigns | `created_by` | List campaigns by user |
| campaigns | `status` | Filter by campaign state |
| campaigns | `scheduled_at` | Identify campaigns ready to send |
| campaign_recipients | `(campaign_id, recipient_id)` UNIQUE | Prevent duplicate recipient assignments |
| campaign_recipients | `campaign_id` | List all recipients of a campaign |
| campaign_recipients | `status` | Filter by delivery status |

---

## Frontend Routes

| Path | Page | Auth |
|---|---|---|
| /login | Login | Public |
| /register | Register | Public |
| /campaigns | Campaign list | Required |
| /campaigns/new | Create campaign | Required |
| /campaigns/:id | Campaign detail | Required |

---

## Walkthrough

1. Register a new account at `/register`
2. Log in at `/login`
3. Click **New Campaign** to create a campaign — add a name, subject, and recipient emails (one per line, format: `email,name` or just `email`)
4. Click **Create Campaign** — you land on the campaign detail page
5. Add more recipients using the form on the right panel
6. Click **Send** — the campaign enters `sending` state and transitions to `sent` within a few seconds; stats cards update automatically
7. After sending, view stats: open rate, send rate, sent/failed/opened counts per recipient

---

## Demo Script (Manual UI Walkthrough)

Follow these steps in the running application to exercise all features:

### 1. Register
- Visit `/register`
- Fill in name, email, and password
- Click **Create Account**
- You are redirected to `/campaigns`

### 2. Create a Campaign
- Click **New Campaign**
- Enter a campaign name (e.g., "Summer Sale 2026")
- Enter an email subject (e.g., "Don't miss our deals!")
- Optionally enter an email body
- Add recipients — one per line, format: `alice@example.com, Alice` or just `alice@example.com`
- Click **Create Campaign**
- You land on the campaign detail page

### 3. Add More Recipients
- With the campaign still in **Draft** status, use the recipient form on the right panel to add individual recipients by email and name
- Recipients cannot be added once the campaign is scheduled or sent

### 4. Schedule the Campaign
- Click **Schedule** in the Actions panel
- Pick a future date and time
- Click **Schedule** in the modal
- The campaign status changes to **Scheduled**

### 5. Send the Campaign
- With the campaign **Scheduled** (or **Draft**), click **Send Now**
- Confirm in the modal
- The campaign status transitions to **Sending** then to **Sent** within a few seconds
- Stats cards update automatically as recipients are processed

### 6. View Stats
- After sending, the stats bar shows:
  - **Total** — total recipients
  - **Sent** — successfully sent
  - **Failed** — failed to send
  - **Opened** — opened email (simulated for ~60% of sent)
  - **Open Rate** — `opened / sent`
  - **Send Rate** — `sent / total`

### Stats Formulas

```
send_rate = sent / total
open_rate = opened / sent
```
Both return `0` when the denominator is `0`.

### Simulated Sending

Sending is simulated — there is no real SMTP/SES/SendGrid integration. Each recipient is randomly marked **sent** (~85%) or **failed** (~15%) with a 1–3 second delay per recipient. Approximately 60% of sent recipients are assigned a simulated `opened_at` timestamp for demo stats purposes. This behavior matches the challenge requirements.

---

## Known Limitations

**Auth token is in-memory only.** The JWT is stored in a Zustand store and is not persisted. Refreshing the page logs the user out. For production, the token should be stored in an `httpOnly` cookie instead.

**Sending is simulated.** There is no real SMTP integration. The `simulateSend` utility randomly marks recipients as `sent` or `failed` (85%/15%) and randomly assigns `opened_at` timestamps (60%) after a 1–3 second delay. This is intentional for development and demo purposes.

---

## How I Used Claude Code

This project was built entirely through an AI-assisted workflow using Claude Code and the Superpowers agentic development framework. This is an MVP challenge implementation, not a production email platform.

**Workflow:**

1. **Brainstorming** — Used the `superpowers:brainstorming` skill to clarify requirements. Explored scope, campaign state rules, sending simulation strategy, state management, and project structure. Every design decision was validated by the user before proceeding.

2. **Design** — Two documents were created: `CHALLENGE_REQUIREMENTS.md` (backend schema, API, state rules, testing, Docker setup) and `DESIGN.md` (frontend UI design with wireframes, component inventory, color system, interaction details).

3. **Planning** — Used the `superpowers:writing-plans` skill to decompose the implementation into bite-sized, testable tasks. Each task has explicit file paths, complete code, expected command outputs, and commit messages.

4. **Implementation** — Used the `superpowers:subagent-driven-development` skill to dispatch independent agents per task with two-stage review (spec compliance + code quality) between tasks.

5. **Verification** — Used the `superpowers:verification-before-completion` skill before marking each task done, requiring actual command output evidence rather than assertions.

**Real prompts used during this project:**

- *"We are continuing the Mini Campaign Manager project. Do not resume the previous broken conversation state. Read these files... Continue from the existing implementation plan. Use Superpowers. Execute Task 1 only."* — This established the task-based workflow where each task had to be verified before proceeding.

- *"Task 5 verification failed. Issue 1: sequelize.sync() → sequelize.authenticate(). Issue 2: POST /recipient alias incorrectly mounted."* — The assistant had used `sequelize.sync()` on startup and mounted the `/recipient` alias inside the wrong router, causing it to resolve to `/api/recipients/recipient`. Both were caught and fixed.

- *"Before continuing to Task 11, fix the frontend Vite proxy configuration... The Vite proxy is likely rewriting /api away before forwarding to the backend."* — The assistant had configured the Vite proxy with `rewrite: (path) => path.replace(/^\/api/, '')` which stripped the `/api` prefix before forwarding, breaking all frontend API calls.

**Where Claude Code was wrong or needed correction:**

1. **Wrong domain (trading dashboard drift)** — An early session produced a trading dashboard rather than a campaign manager. The mismatch was caught by reviewing the output against `CHALLENGE_REQUIREMENTS.md`. The project was restarted cleanly.

2. **Broken Vite proxy rewrite** — Claude configured the Vite dev server proxy with a `rewrite` that stripped `/api` from all request paths. The fix was removing the rewrite entirely so `target: 'http://localhost:3001'` received `/api/auth/register` unchanged and the backend routed it correctly to `/api/auth/register`.

3. **Silent frontend-only business rules** — Claude initially implemented the "send only when draft/scheduled" rule in the frontend by hiding buttons, but the backend had no enforcement. A campaign could be sent via direct API curl after the UI hid the button. Backend guards were added to `CampaignService.send()` and `CampaignService.addToCampaign()`.

4. **Environment variable loading failure** — `dotenv.config()` without a path looked for `.env` in the CWD, which was `/server` when running `yarn workspace server dev`. Since `server/.env` didn't exist, `DATABASE_URL` was `undefined` and Sequelize initialization crashed. The fix was explicit path loading: `dotenv.config({ path: path.resolve(__dirname, '..', envFile) })` using `__dirname` to always resolve relative to the source directory.

**What I did not let Claude Code do and why:**

- **Proceed without verification** — I required actual command output evidence (build logs, test results, test counts) before advancing to the next task. Claude was not permitted to claim tests passed without running them.

- **Silently change the product domain** — When the output diverged into trading/portfolio features, I stopped and reset. The domain is email campaigns only.

- **Treat frontend button hiding as sufficient for business rules** — Campaign state transition rules (can only update/delete when draft, can only add recipients when draft, cannot send when already sent) must be enforced server-side. A user can always call the API directly; UI hiding is UX, not security or correctness.

**Key decisions made during brainstorming:**

- Simulated sending only (no real SMTP) to keep scope achievable
- In-memory JWT via Zustand (not localStorage) for the MVP — accepted limitation noted in README
- Service-layer backend pattern for testability
- Stats computed from CampaignRecipient rows at read time (no pre-aggregation)
- Migrations only for schema management (`sequelize.authenticate()` on startup, never `sequelize.sync()`)
- Express 4 async error propagation handled via an `asyncHandler` utility wrapper
