# Mini Campaign Manager — Frontend Design

## 1. Concept & Vision

A focused MarTech SaaS dashboard for marketers to manage email campaigns end-to-end. The interface communicates reliability and professionalism — it should feel like a trusted operational tool, not a flashy consumer app. Clean, spacious, and purposeful. Every element earns its place.

**Personality:** Calm confidence. Data-dense but not cluttered. Professional without being corporate-sterile.

---

## 2. Design Language

### Aesthetic Direction
**Style:** Professional SaaS Dashboard — clean lines, generous whitespace, subtle depth via shadows not gradients. Inspired by tools like Linear, Notion, and Vercel's dashboard.

**Anti-patterns to avoid:**
- No trading terminal aesthetics (dark backgrounds, neon accents, dense financial grids)
- No heavy gradients, glassmorphism, or AI-flashy visuals
- No portfolio/order book/financial terminology
- No crypto or market-data visual language

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `background` | `#FFFFFF` | Page background |
| `surface` | `#F8FAFC` | Cards, sidebars |
| `surface-hover` | `#F1F5F9` | Hover states |
| `border` | `#E2E8F0` | Dividers, card borders |
| `text-primary` | `#0F172A` | Headings, body |
| `text-secondary` | `#64748B` | Labels, captions |
| `text-muted` | `#94A3B8` | Placeholders, disabled |

| Status | Color | Tailwind | Hex |
|---|---|---|---|
| `draft` | Gray | `bg-slate-100 text-slate-700` | `#F1F5F9` / `#475569` |
| `scheduled` | Blue | `bg-blue-100 text-blue-700` | `#DBEAFE` / `#1D4ED8` |
| `sending` | Amber | `bg-amber-100 text-amber-700` | `#FEF3C7` / `#B45309` |
| `sent` | Green | `bg-emerald-100 text-emerald-700` | `#D1FAE5` / `#047857` |
| `failed` (recipient) | Red | `bg-red-100 text-red-700` | `#FEE2E2` / `#B91C1C` |
| `pending` | Slate | `bg-slate-100 text-slate-600` | `#F1F5F9` / `#475569` |
| `opened` | Green | `bg-emerald-50 text-emerald-700` | `#ECFDF5` / `#047857` |

### Typography
- **Font:** Inter (Google Fonts) — clean, professional, highly legible
- **Fallback:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Scale:**
  - `h1`: 24px / 700 / slate-900
  - `h2`: 20px / 600 / slate-900
  - `h3`: 16px / 600 / slate-900
  - `body`: 14px / 400 / slate-700
  - `caption`: 12px / 400 / slate-500
- **Line-height:** 1.5 for body, 1.3 for headings

### Spacing System
- Base unit: 4px
- Standard spacing scale: 4, 8, 12, 16, 24, 32, 48, 64
- Card padding: 24px
- Section gap: 32px
- Form field gap: 16px

### Shadow Scale
| Name | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle card lift |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Modals, dropdowns |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Dialogs |

### Motion
- Duration: 150–200ms for micro-interactions
- Easing: `ease-out` for enter, `ease-in` for exit
- Use `transition-colors`, `transition-opacity`, `transition-transform` only
- Avoid animating width/height
- Respect `prefers-reduced-motion`

### Border Radius
- Buttons, inputs, badges: `rounded-md` (6px)
- Cards: `rounded-lg` (8px)
- Modals: `rounded-xl` (12px)

---

## 3. Layout & Structure

### App Shell
```
┌─────────────────────────────────────────────┐
│  HEADER (fixed, 64px)                      │
│  Logo left | Nav center | User menu right   │
├─────────────────────────────────────────────┤
│                                             │
│  MAIN CONTENT (max-w-6xl, centered)        │
│  Padding: 32px top, 24px sides             │
│                                             │
└─────────────────────────────────────────────┘
```

### Header
- Left: App name "Campaigns" (text logo, no icon)
- Right: User avatar/initials + dropdown (logout)
- Background: white with bottom border `border-slate-200`
- No sidebar — single-column layout keeps focus on content

### Page Layouts

**Login / Register:** Centered card on white background. Max-w-md centered vertically and horizontally.

**Campaigns (list):** Full-width table with generous row height (56px). Filters/search above table.

**Campaigns/new:** Single-column form, max-w-2xl. Sections grouped visually with subtle dividers.

**Campaigns/:id:** Two-column on desktop (stats + actions left, recipients right). Single column on mobile. Stats bar fixed at top of campaign section.

### Responsive Strategy
- Mobile-first
- Breakpoints: `sm` 640px, `md` 768px, `lg` 1024px
- Table collapses to card list on mobile
- Two-column detail view stacks on mobile
- Max content width: `max-w-6xl` (1152px)

---

## 4. Pages

### 4.1 `/login` — Login Page

**Layout:** Centered single card on white background.

**Visual:**
```
┌─────────────────────────────────┐
│                                 │
│         [Logo] Campaigns         │
│                                 │
│     Welcome back                │
│     Sign in to continue         │
│                                 │
│     Email                       │
│     [________________________]  │
│                                 │
│     Password                    │
│     [________________________]  │
│                                 │
│     [  Sign In Button  ]        │
│                                 │
│     Don't have an account?      │
│     → Create one                │
│                                 │
└─────────────────────────────────┘
```

**States:**
- Default: Clean form, no errors
- Loading: Button shows spinner + "Signing in...", inputs disabled
- Error: Red border on invalid field, error message below field in red

**Behavior:**
- Enter key submits form
- Redirect to `/campaigns` on success
- Error display: inline per-field where possible, or top of form

---

### 4.2 `/register` — Register Page

**Layout:** Same centered card as login.

**Visual:**
```
┌─────────────────────────────────┐
│                                 │
│         [Logo] Campaigns        │
│                                 │
│     Create your account         │
│                                 │
│     Name                        │
│     [________________________]  │
│                                 │
│     Email                       │
│     [________________________]  │
│                                 │
│     Password                    │
│     [________________________]  │
│                                 │
│     [  Create Account  ]        │
│                                 │
│     Already have an account?    │
│     → Sign in                   │
│                                 │
└─────────────────────────────────┘
```

**States:** Same pattern as login.

---

### 4.3 `/campaigns` — Campaign List

**Layout:** Full-width page with header row + table.

**Visual:**
```
┌─────────────────────────────────────────────────────────────┐
│  Campaigns                          [+ New Campaign]        │
├─────────────────────────────────────────────────────────────┤
│  [Search campaigns...]                                       │
├─────────────────────────────────────────────────────────────┤
│  Name       Subject        Status      Rate    Actions      │
│  ─────────────────────────────────────────────────────────  │
│  Summer     Summer Sale    [sent]      64%    [Delete]     │
│  Launch     New Product    [draft]      —     [Delete]      │
│  Weekly     Weekly Update  [scheduled]  —     [Delete]     │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

**Campaign Row Columns:**
| Column | Content |
|---|---|
| Name | Campaign name, bold |
| Subject | Campaign subject, truncated |
| Status | `<StatusBadge>` component |
| Rate | Open rate % (if sent), "—" otherwise |
| Actions | Delete icon button (draft only), always visible |

**States:**
- Loading: Skeleton rows (5 rows of shimmer)
- Empty: Illustration + "No campaigns yet" + "Create your first campaign" CTA
- Error: Error alert banner at top with retry

**Interactions:**
- Click row → navigate to `/campaigns/:id`
- Delete: confirmation dialog before action
- New Campaign button → `/campaigns/new`

---

### 4.4 `/campaigns/new` — Create Campaign

**Layout:** Single-column form, max-w-2xl.

**Visual:**
```
┌─────────────────────────────────────────────────┐
│  ← Back to Campaigns                            │
│                                                 │
│  New Campaign                                   │
│                                                 │
│  Campaign Name *                                │
│  [________________________________]             │
│                                                 │
│  Email Subject *                                │
│  [________________________________]             │
│                                                 │
│  Email Body                                     │
│  [                                            ] │
│  [  (textarea, 6 rows)                        ] │
│  [                                            ] │
│                                                 │
│  Recipients *                                   │
│  [                                            ] │
│  [  One email address per line                ] │
│  [                                            ] │
│  [                                            ] │
│                                                 │
│  [          Save Campaign          ]            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Fields:**
| Field | Type | Validation |
|---|---|---|
| Campaign Name | text input | Required, max 255 chars |
| Email Subject | text input | Required, max 500 chars |
| Email Body | textarea | Optional, no limit |
| Recipients | textarea | Required, at least one valid email, one per line |

**States:**
- Default: Empty form
- Submitting: Button disabled, spinner
- Validation error: Red border + error message below each invalid field
- API error: Error alert at top of form

**Behavior:**
- On submit: POST `/campaigns`, then POST `/campaigns/:id/recipients` for each recipient
- On success: Redirect to `/campaigns/:id`
- Cancel/Back: Navigate to `/campaigns`

---

### 4.5 `/campaigns/:id` — Campaign Detail

**Layout:** Two-column on desktop.

**Desktop layout:**
```
┌──────────────────────────────┬──────────────────────────────┐
│  LEFT COLUMN (flex-1)        │  RIGHT COLUMN (flex-1)       │
│                              │                              │
│  Campaign Header             │  Recipients                  │
│  ─────────────────           │  ───────────                  │
│  Name                       │  [+ Add Recipient]            │
│  Subject                    │  [________________ Email]     │
│  [Status Badge]             │  [ Name ]                     │
│                              │  [  Add  ]                   │
│  Stats Bar                  │                              │
│  ─────────────────           │  OR Bulk Add:                 │
│  ┌────┬────┬────┐          │  [________________ textarea]  │
│  │Total│Sent│Fail│          │  [  Bulk Add  ]             │
│  └────┴────┴────┘          │                              │
│  ┌────┬────┬────┐          │  Recipients List             │
│  │Open│Op.R│Sn.R│          │  ───────────                  │
│  └────┴────┴────┘          │  john@x.com  [sent]          │
│                              │  jane@x.com  [failed]       │
│  Action Buttons              │  bob@x.com   [pending]       │
│  ─────────────────           │                              │
│  [Edit] [Schedule] [Send]   │                              │
│                              │                              │
│  OR (if sent):              │                              │
│  Sent on [date]             │                              │
└──────────────────────────────┴──────────────────────────────┘
```

**Campaign Header:**
- Campaign name as `<h1>`
- Subject as subtitle in `text-secondary`
- `<StatusBadge>` beside title

**Stats Bar:**
Six `<StatCard>` components in a 3×2 grid:

| Stat | Label | Format |
|---|---|---|
| total | Total | Integer |
| sent | Sent | Integer |
| failed | Failed | Integer |
| opened | Opened | Integer |
| open_rate | Open Rate | Percentage (e.g., `64.3%`) |
| send_rate | Send Rate | Percentage (e.g., `80.0%`) |

**StatCard visual:**
```
┌──────────────┐
│  64.3%       │  ← value, large (20px, font-semibold)
│  Open Rate   │  ← label, small (12px, text-secondary)
└──────────────┘
```
White card, subtle border, 8px radius.

**Action Buttons (state-driven):**

| Campaign Status | Edit/PATCH | Delete | Schedule | Send |
|---|---|---|---|---|
| `draft` | Enabled | Enabled | Enabled | Enabled |
| `scheduled` | Disabled | Disabled | Disabled | Enabled |
| `sending` | Disabled | Disabled | Disabled | Disabled |
| `sent` | Disabled | Disabled | Disabled | Disabled |

- Edit → reveals inline PATCH form below header
- Schedule → opens Schedule Modal
- Send → confirmation dialog → POST `/campaigns/:id/send`
- Delete → confirmation dialog → DELETE `/campaigns/:id` → redirect to `/campaigns`

**Schedule Modal:**
```
┌─────────────────────────────────────┐
│  Schedule Campaign              [X] │
│                                     │
│  Select date and time               │
│  [____/____/____] [__:__] [AM/PM]  │
│                                     │
│  [Cancel]          [Schedule]       │
└─────────────────────────────────────┘
```
- Date picker input
- Time picker input
- Future validation enforced client + server side
- Only shown when status = draft

**PATCH/Edit Form (draft only):**
- Pre-filled with current name/subject/body
- "Save Changes" button → PATCH `/campaigns/:id`
- Hides when status ≠ draft

**Recipients Section:**
- "Add Recipient" form: email input + name input + "Add" button
- "Bulk Add" toggle: expands textarea for multiple emails (one per line, format: `email,name` or just `email`)
- Recipient list: table with email, name, status badge
- Status badges: `pending`, `sent`, `failed`

**States:**
- Loading: Full page skeleton
- Error: Error alert with retry
- Sending: "Sending..." state on campaign, action buttons disabled

---

## 5. Component Inventory

### `<StatusBadge status="draft|scheduled|sending|sent|pending|sent|failed" />`
- Pill shape, 6px radius
- Icon (dot or checkmark) + text label
- Colors per status palette above
- Text: 12px, font-medium

### `<StatCard value={number|string} label={string} />`
- White card with border
- Value: 20px, font-semibold, slate-900
- Label: 12px, text-secondary
- Subtle shadow-sm

### `<Button variant="primary|secondary|danger" size="sm|md" disabled={bool} loading={bool} />`
| Variant | Usage |
|---|---|
| `primary` | Main CTA (Save, Send, Schedule) — blue-600 bg, white text |
| `secondary` | Secondary actions (Cancel, Back) — white bg, slate-700 text, border |
| `danger` | Delete — red-600 bg, white text |

- Sizes: `sm` h-8 px-3 text-sm, `md` h-10 px-4 text-sm
- Loading state: spinner icon + disabled
- Focus: ring-2 ring-blue-500 ring-offset-2

### `<Input label={string} type="text|email|password" error={string} required={bool} />`
- Label above input (not placeholder-only)
- `required` shows asterisk
- Error: red border + error message below in red-600 text-sm
- Focus: ring-2 ring-blue-500

### `<Textarea label={string} rows={number} error={string} />`
- Same label/error pattern as Input
- `rows` default: 6

### `<Card>` / `<CardBody>`
- White background, border, rounded-lg, shadow-sm
- Padding: 24px

### `<Table>` / `<TableRow>` / `<TableCell>`
- Alternating row backgrounds (white / slate-50)
- Row height: 56px
- Hover: surface-hover background
- Border-bottom: border color

### `<Modal>` / `<ConfirmDialog>`
- Overlay: `bg-black/40`, centered card
- Card: white, rounded-xl, shadow-lg, max-w-md
- Close: X button top-right
- ConfirmDialog: title + message + Cancel/Confirm buttons

### `<EmptyState icon={svg} title={string} description={string} action={button} />`
- Centered in container
- Icon: 48px SVG in slate-300
- Title: 18px font-semibold
- Description: 14px text-secondary
- Optional action button below

### `<LoadingSkeleton rows={number} />`
- Shimmer animation on gray blocks
- Matches approximate shape of real content

### `<ErrorAlert message={string} onRetry={fn} />`
- Red-50 background, red-800 text, red-500 icon
- Retry button optional

### `<NavHeader logo={string} user={user} onLogout={fn} />`
- Fixed top, white bg, border-b
- Logo left, user menu right
- User menu: avatar circle with initials, dropdown with logout

---

## 6. Interaction Details

### Form Submission Flow
1. User fills form → clicks submit
2. Button enters loading state (spinner, disabled)
3. On success: redirect to target page or show success toast
4. On error: show error alert (top of form) or inline field errors, button re-enabled

### Delete Confirmation
- Click delete icon → `<ConfirmDialog>` appears
- "Are you sure you want to delete [campaign name]? This cannot be undone."
- Cancel / Delete (danger button)
- On confirm → DELETE request → redirect

### Send Confirmation
- Click Send → `<ConfirmDialog>` appears
- "Send this campaign to [N] recipients? This cannot be undone."
- Cancel / Send
- On confirm → POST `/campaigns/:id/send`
- Campaign status changes to `sending` (polling or polling via React Query refetch)

### State Polling
- After send triggered, poll GET `/campaigns/:id` every 2s until status = `sent` or `failed`
- Update UI reactively via React Query

### Navigation
- Auth guard: if unauthenticated, redirect to `/login`
- After login/register, redirect to `/campaigns`
- Back navigation via header link or browser back

---

## 7. Technical Notes

### Stack
- **Vite** + React 18 + TypeScript
- **Tailwind CSS** (utility classes)
- **React Query** (TanStack Query) — server state
- **Zustand** — auth state (in-memory, not persisted)
- **React Router v6** — routing

### File Structure (frontend)
```
client/src/
├── api/
│   └── client.ts          # Axios instance + interceptors
├── components/
│   ├── ui/                # Shared UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── StatCard.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   └── ErrorAlert.tsx
│   └── layout/
│       └── NavHeader.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── CampaignsPage.tsx
│   ├── NewCampaignPage.tsx
│   └── CampaignDetailPage.tsx
├── store/
│   └── authStore.ts       # Zustand store
├── hooks/
│   └── useAuth.ts         # Auth guard hook
├── router/
│   └── AppRouter.tsx     # Route definitions with auth guards
└── main.tsx
```

### API Client
- Axios instance with base URL from `VITE_API_URL`
- Request interceptor: attach `Authorization: Bearer <token>` from Zustand store
- Response interceptor: on 401, clear auth store and redirect to `/login`

### Auth State (Zustand)
```ts
interface AuthStore {
  token: string | null;
  user: { id: string; email: string; name: string } | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```
- In-memory only — refresh clears state
- Production would use httpOnly cookie JWT

### React Query Config
- `staleTime`: 30s for lists, 15s for detail
- `refetchOnWindowFocus`: true for lists
- Retry: 2 times on failure

---

## 8. Accessibility

- All form inputs have `<label>` elements linked via `htmlFor`
- Error messages use `role="alert"` for screen readers
- Buttons have descriptive text or `aria-label`
- Status badges convey meaning via color + text (not color alone)
- Modals trap focus and close on Escape key
- Focus ring visible on all interactive elements (ring-2 ring-blue-500)
- Color contrast ratios meet WCAG AA (4.5:1 for text)
- `prefers-reduced-motion` respected for animations

---

## 9. Color & Status Summary

### Campaign Status Colors
| Status | Badge BG | Badge Text |
|---|---|---|
| draft | `bg-slate-100` | `text-slate-700` |
| scheduled | `bg-blue-100` | `text-blue-700` |
| sending | `bg-amber-100` | `text-amber-700` |
| sent | `bg-emerald-100` | `text-emerald-700` |

### Recipient Status Colors
| Status | Badge BG | Badge Text |
|---|---|---|
| pending | `bg-slate-100` | `text-slate-600` |
| sent | `bg-blue-100` | `text-blue-700` |
| failed | `bg-red-100` | `text-red-700` |
| opened | `bg-emerald-50` | `text-emerald-700` |

### Primary Action Color
- Button primary: `bg-blue-600` / hover `bg-blue-700` / text `white`
- Focus ring: `ring-blue-500`
