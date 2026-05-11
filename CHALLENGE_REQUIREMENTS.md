# Mini Campaign Manager — Challenge Requirements

## Overview

A simplified MarTech tool for marketers to create, manage, schedule, send, and track email campaigns.

**Domain:** Email campaign management only. No trading, market, portfolio, order book, watchlist, or financial concepts.

---

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express + TypeScript
- **Database:** PostgreSQL
- **ORM:** Sequelize (with migrations)
- **Auth:** JWT (in-memory / httpOnly cookie in production)
- **Validation:** zod
- **Tests:** Jest or Mocha (≥3 meaningful tests)

### Frontend
- **Build:** Vite
- **Framework:** React 18+ TypeScript
- **Data fetching:** React Query (SWR acceptable)
- **State:** Zustand (auth/UI), React Query (server state)
- **Styling:** Tailwind or component library
- **Routing:** React Router

### Monorepo
- Yarn workspace at root
- `/server` and `/client` subdirectories
- Root `package.json` defines `workspaces: ['server', 'client']`

---

## Database Schema

### Entity Relationship

```
User (1) ←→ (N) Campaign (1) ←→ (N) CampaignRecipient (N) ←→ (1) Recipient
```

### Tables

**users**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

**campaigns**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| created_by | UUID | FK → users.id, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| subject | VARCHAR(500) | NOT NULL |
| body | TEXT | HTML email body |
| status | ENUM | `'draft'`, `'scheduled'`, `'sending'`, `'sent'` — default `'draft'` |
| scheduled_at | TIMESTAMP | NULL — future send time |
| sent_at | TIMESTAMP | NULL — audit field, not required |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**recipients**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

**campaign_recipients**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| campaign_id | UUID | FK → campaigns.id, NOT NULL |
| recipient_id | UUID | FK → recipients.id, NOT NULL |
| status | ENUM | `'pending'`, `'sent'`, `'failed'` — default `'pending'` |
| sent_at | TIMESTAMP | NULL |
| opened_at | TIMESTAMP | NULL — represents opened; status remains `'sent'` |
| created_at | TIMESTAMP | NOT NULL |

### Indexes
- `users: email` UNIQUE
- `recipients: email` UNIQUE
- `campaigns: created_by`
- `campaigns: status`
- `campaigns: created_at`
- `campaigns: scheduled_at`
- `campaign_recipients: campaign_id`
- `campaign_recipients: recipient_id`
- `campaign_recipients: status`
- `campaign_recipients: (campaign_id, recipient_id)` UNIQUE

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register: `{ email, password, name }` |
| POST | `/auth/login` | Login: `{ email, password }` → JWT |

### Campaigns
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/campaigns` | Required | List user's campaigns |
| POST | `/campaigns` | Required | Create campaign (status=`draft`) |
| GET | `/campaigns/:id` | Required | Campaign + recipient list + stats summary |
| PATCH | `/campaigns/:id` | Required | Update — **only if status=`draft`** |
| DELETE | `/campaigns/:id` | Required | Delete — **only if status=`draft`** |
| POST | `/campaigns/:id/schedule` | Required | Schedule — body: `{ scheduled_at }` — **only if status=`draft` and future time** |
| POST | `/campaigns/:id/send` | Required | Simulate send — random sent/failed; sets `opened_at` on ~60% of sent; **cannot if status=`sent`** |
| GET | `/campaigns/:id/stats` | Required | Stats |

### Recipients
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/recipients` | Required | List all recipients |
| POST | `/recipients` | Required | Create recipient |
| POST | `/recipient` | Required | Alias for POST /recipients |

### Campaign Recipients (Helper)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/campaigns/:id/recipients` | Required | List recipients in a campaign |
| POST | `/campaigns/:id/recipients` | Required | Add recipient(s) to a campaign |

### Status Codes
| Code | Meaning |
|---|---|
| 400 | Validation error (zod fail, missing fields) |
| 401 | Missing or invalid JWT |
| 403 | Access denied (not owner) |
| 404 | Resource not found |
| 409 | Invalid state transition |

### State Transition Rules
- **PATCH /campaigns/:id** → 409 if status ≠ `draft`
- **DELETE /campaigns/:id** → 409 if status ≠ `draft`
- **POST /campaigns/:id/schedule** → 409 if status ≠ `draft` or `scheduled_at` ≤ now
- **POST /campaigns/:id/send** → 409 if status = `sent`

### Stats Response
```json
{
  "total": 0,
  "sent": 0,
  "failed": 0,
  "opened": 0,
  "open_rate": 0,
  "send_rate": 0
}
```
- `open_rate` = opened / sent (0 if sent = 0)
- `send_rate` = (sent + failed) / total

---

## Frontend Pages

### Routes
| Path | Component | Auth |
|---|---|---|
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/campaigns` | CampaignsPage | Required |
| `/campaigns/new` | NewCampaignPage | Required |
| `/campaigns/:id` | CampaignDetailPage | Required |

### Page Details

**`/login`** — Email + password form, link to `/register`, error display, redirect to `/campaigns` on success.

**`/register`** — Name + email + password form, redirect to `/campaigns` on success.

**`/campaigns`** — Table of campaigns (name, subject, status badge, scheduled_at, open_rate). "New Campaign" button → `/campaigns/new`. Delete button per row (draft only). Empty state when none.

**`/campaigns/new`** — Form: name, subject, body (textarea), recipient emails (textarea, one email per line). Submit creates campaign + creates/attaches recipients. Redirects to `/campaigns/:id` on success.

**`/campaigns/:id`** — Header (name, subject, status badge). Stats bar (total/sent/failed/opened/open_rate/send_rate). Action buttons (state-driven). Recipient section (add single, bulk add, list with status badges). PATCH form (draft only). Schedule form (draft only).

### Action Button Rules
| Campaign Status | Edit/PATCH | Delete | Schedule | Send |
|---|---|---|---|---|
| `draft` | Enabled | Enabled | Enabled | Enabled |
| `scheduled` | Disabled | Disabled | Disabled | Enabled |
| `sending` | Disabled | Disabled | Disabled | Disabled |
| `sent` | Disabled | Disabled | Disabled | Disabled |

### Component Inventory
- `<StatusBadge>` — `draft`/`scheduled`/`sending`/`sent` pill
- `<StatsBar>` — 6-cell grid: total, sent, failed, opened, open_rate, send_rate
- `<RecipientRow>` — name, email, status badge
- `<CampaignRow>` — list item with name, subject, status, dates, open_rate
- `<ActionButtons>` — state-driven action buttons
- `<ScheduleForm>` — datetime picker + schedule button
- `<ApiError>` — inline error display

### State Management
- **Zustand `authStore`:** `{ token: string | null, user, isAuthenticated, login(), logout() }` — **in-memory only, page refresh logs user out**
- **React Query:** server state
- **Production note:** httpOnly cookie auth recommended for production

### React Query Keys
| Key | Query |
|---|---|
| `['campaigns']` | GET /campaigns |
| `['campaign', id]` | GET /campaigns/:id |
| `['campaignStats', id]` | GET /campaigns/:id/stats |
| `['recipients']` | GET /recipients |
| `['campaignRecipients', id]` | GET /campaigns/:id/recipients |

---

## Simulated Sending

1. POST `/campaigns/:id/send` sets campaign status to `sending`
2. Each recipient is randomly marked `sent` (~85%) or `failed` (~15%) with 1–3s simulated delay
3. `sent_at` set for `sent` recipients
4. `opened_at` set on ~60% of `sent` recipients for demo stats
5. Campaign status set to `sent`
6. Cannot be called again (409 if already `sent`)

---

## Testing (≥3 meaningful tests)

1. **Auth register + login** — Register a user, login, receive JWT, access protected route with JWT
2. **Draft-only update + delete** — Create campaign, update succeeds while draft, delete succeeds while draft, verify 409 on either after status changes
3. **Schedule future timestamp rule** — Create campaign, schedule with future time succeeds, schedule with past time returns 409
4. **Send campaign + stats** — Attach recipients, send campaign, verify sent/failed distribution, verify stats calculation (total, sent, failed, opened, open_rate, send_rate)

---

## Docker / Local Setup

### docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: campaign_user
      POSTGRES_PASSWORD: campaign_password
      POSTGRES_DB: campaign_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

### .env.example
```
# Server
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://campaign_user:campaign_password@localhost:5432/campaign_db
JWT_SECRET=your_jwt_secret_here

# Client
VITE_API_URL=http://localhost:3001
```

### Commands
```bash
# Install
yarn install

# Migrate
yarn workspace server migrate

# Seed (optional)
yarn workspace server seed

# Run (dev)
yarn dev

# Run tests
yarn workspace server test
```

---

## README Requirements

The README must include:

1. **Local setup** — Prerequisites, install steps, env config, migration, running the app
2. **API overview** — Core endpoints table
3. **Frontend routes** — Page routes table
4. **Test commands** — How to run tests
5. **Walkthrough summary** — Quick end-to-end flow (register → create campaign → add recipients → send → view stats)
6. **"How I Used Claude Code"** section — Specific section with that exact title, describing the AI-assisted workflow

---

## Project Structure

```
mini-campaign-manager/
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── migrations/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── index.ts
│   └── package.json
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── main.tsx
│   └── package.json
├── docker-compose.yml
├── .env.example
├── package.json
└── README.md
```
