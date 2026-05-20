# Camping Packing App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first web app where a small group of friends coordinates who brings what to a camping weekend — joinable via share-link, no account, realtime sync, comments per item.

**Architecture:** Next.js 15 (App Router) frontend with Server Components + Server Actions, talking to Supabase (Postgres + Realtime). RLS enforces trip-scoped data access via a session-cookie → GUC mechanism inside Server Actions. Coolify deploys a Docker container.

**Tech Stack:** Next.js 15, TypeScript (strict), TailwindCSS, shadcn/ui, Supabase (DB + Realtime), Vitest, Playwright, Docker, Coolify.

**Spec:** `docs/superpowers/specs/2026-05-20-camping-packing-app-design.md`

**Conventions:**
- Atomic commits per task (Conventional Commits: `feat:`, `chore:`, `test:`, `docs:`).
- TDD where pure functions are involved (codes, session, templates). UI tasks ship with an E2E smoke at the end.
- No npm script invented — use the standard `next`, `vitest`, `playwright`, `supabase` CLIs.
- All commands assume working directory = repo root `/Users/yschleich/Developer/Packing App`.

---

## File Structure (target end-state)

```
.
├── app/
│   ├── layout.tsx                     Root layout, fonts, metadata
│   ├── page.tsx                       Landing (create / join)
│   ├── globals.css                    Tailwind globals
│   └── t/[code]/
│       ├── page.tsx                   Trip main view (Server Component)
│       ├── join/page.tsx              Name-input gate for new participants
│       └── trip-client.tsx            Client wrapper for realtime + filters
├── components/
│   ├── ItemCard.tsx
│   ├── ItemSheet.tsx
│   ├── CategorySection.tsx
│   ├── AddItemFAB.tsx
│   ├── ParticipantAvatars.tsx
│   ├── ShareButton.tsx
│   ├── Filter.tsx
│   └── ui/                            shadcn/ui primitives (button, sheet, input, toast)
├── server-actions/
│   ├── trips.ts                       createTrip, joinTrip
│   ├── items.ts                       addItem, deleteItem
│   ├── claims.ts                      claimItem, unclaimItem
│   └── comments.ts                    addComment
├── lib/
│   ├── supabase/
│   │   ├── admin.ts                   Service-Role-Client (server-side, bypasses RLS)
│   │   └── browser.ts                 Browser anon client (Realtime subscriptions only)
│   ├── auth.ts                        getCurrentParticipant — cookie → participant + trip
│   ├── realtime.ts                    useTripRealtime hook
│   ├── session.ts                     Session token + cookie name
│   ├── codes.ts                       Join-code generator
│   ├── templates.ts                   Camping template seed
│   └── database.types.ts              Generated Supabase types
├── db/
│   └── migrations/
│       ├── 0001_init.sql
│       └── 0002_rls.sql
├── tests/
│   ├── unit/
│   │   ├── codes.test.ts
│   │   ├── session.test.ts
│   │   └── templates.test.ts
│   └── e2e/
│       └── happy-path.spec.ts
├── public/
│   ├── manifest.webmanifest
│   └── icons/                         PWA icons (192, 512)
├── Dockerfile
├── .dockerignore
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
├── vitest.config.ts
├── playwright.config.ts
├── .env.example
├── .env.local                         (gitignored)
└── README.md
```

---

## Phase 0 — Project Setup

### Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `tailwind.config.ts`, `postcss.config.js`, `.env.example`

- [ ] **Step 1: Scaffold via create-next-app**

```bash
cd "/Users/yschleich/Developer/Packing App"
# create-next-app refuses non-empty dirs. Move docs/ aside, scaffold, move back.
mv docs /tmp/_packing_docs_stash
npx create-next-app@latest . \
  --typescript --tailwind --app --src-dir false \
  --import-alias "@/*" --eslint --use-npm --no-turbopack --skip-install \
  --yes
mv /tmp/_packing_docs_stash docs
```

If interactive prompts appear, accept all defaults that match (TypeScript yes, Tailwind yes, App Router yes, src/ no).
Note: `.git`, `.gitignore`, `README.md` are tolerated; `.claude/` and `docs/` are not. Only `docs/` needs stashing because `.claude/` predates the scaffold and is ignored by the CLI's safety check.

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: clean install, no peer warnings.

- [ ] **Step 3: Smoke-test the dev server**

```bash
npm run dev &
sleep 4
curl -fsS http://localhost:3000 | head -5
kill %1
```

Expected: HTTP 200, HTML containing `<title>`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 app with Tailwind and TypeScript"
```

---

### Task 2: Install runtime + dev dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Supabase, shadcn dependencies, utilities**

```bash
npm install @supabase/supabase-js @supabase/ssr nanoid clsx tailwind-merge class-variance-authority lucide-react
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D vitest @vitest/ui @testing-library/react jsdom @types/node @playwright/test
```

- [ ] **Step 3: Verify package.json scripts**

Add the following scripts to `package.json` if missing:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 4: Verify typecheck passes on the scaffold**

```bash
npm run typecheck
```

Expected: no output, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install runtime and dev dependencies"
```

---

### Task 3: Setup shadcn/ui

**Files:**
- Create: `components.json`, `components/ui/button.tsx`, `components/ui/sheet.tsx`, `components/ui/input.tsx`, `components/ui/toast.tsx`, `components/ui/sonner.tsx`, `lib/utils.ts`

- [ ] **Step 1: Init shadcn**

```bash
npx shadcn@latest init --yes --defaults
```

Accept defaults; New York style; base color Neutral.

- [ ] **Step 2: Add primitives we need**

```bash
npx shadcn@latest add button sheet input textarea sonner badge
```

- [ ] **Step 3: Verify build still works**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add shadcn/ui primitives"
```

---

### Task 4: Configure Vitest

**Files:**
- Create: `vitest.config.ts`, `tests/unit/.gitkeep`

- [ ] **Step 1: Create vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 2: Add a sentinel test and verify it runs**

```ts
// tests/unit/sentinel.test.ts
import { describe, it, expect } from 'vitest'
describe('sentinel', () => {
  it('runs', () => expect(1 + 1).toBe(2))
})
```

```bash
npm test
```

Expected: 1 passed.

- [ ] **Step 3: Delete sentinel, commit config only**

```bash
rm tests/unit/sentinel.test.ts
git add vitest.config.ts
git commit -m "chore: configure vitest"
```

---

## Phase 1 — Pure Utility Modules (TDD)

### Task 5: Join-code generator

**Files:**
- Create: `lib/codes.ts`, `tests/unit/codes.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/codes.test.ts
import { describe, it, expect } from 'vitest'
import { generateJoinCode, isValidJoinCode } from '@/lib/codes'

describe('generateJoinCode', () => {
  it('returns a 6-character string', () => {
    expect(generateJoinCode()).toMatch(/^[A-Z2-9]{6}$/)
  })
  it('avoids lookalikes 0, O, 1, I', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateJoinCode()
      expect(code).not.toMatch(/[01OI]/)
    }
  })
  it('is reasonably unique across many calls', () => {
    const set = new Set(Array.from({ length: 1000 }, generateJoinCode))
    expect(set.size).toBeGreaterThan(990)
  })
})

describe('isValidJoinCode', () => {
  it('accepts canonical codes', () => {
    expect(isValidJoinCode('ABC234')).toBe(true)
  })
  it('rejects too short / too long', () => {
    expect(isValidJoinCode('ABC23')).toBe(false)
    expect(isValidJoinCode('ABCD234')).toBe(false)
  })
  it('rejects forbidden characters', () => {
    expect(isValidJoinCode('ABCO23')).toBe(false)
    expect(isValidJoinCode('abc234')).toBe(false)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- codes
```

Expected: FAIL with "Cannot find module '@/lib/codes'".

- [ ] **Step 3: Implement**

```ts
// lib/codes.ts
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0,O,1,I

export function generateJoinCode(): string {
  let out = ''
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
  return out
}

export function isValidJoinCode(input: string): boolean {
  return /^[A-Z2-9]{6}$/.test(input) && !/[01OI]/.test(input)
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- codes
```

Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/codes.ts tests/unit/codes.test.ts
git commit -m "feat: add join code generator with lookalike avoidance"
```

---

### Task 6: Session helpers (cookie types only — pure logic)

**Files:**
- Create: `lib/session.ts`, `tests/unit/session.test.ts`

> Cookie I/O lives in Next.js's `cookies()` API and is exercised inside server actions. Here we only test the pure helpers: token generation + cookie name constants.

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/session.test.ts
import { describe, it, expect } from 'vitest'
import { SESSION_COOKIE, newSessionToken } from '@/lib/session'

describe('SESSION_COOKIE', () => {
  it('is a stable string', () => {
    expect(SESSION_COOKIE).toBe('camping_session')
  })
})

describe('newSessionToken', () => {
  it('produces a long random token', () => {
    const t = newSessionToken()
    expect(t).toMatch(/^[A-Za-z0-9_-]{20,}$/)
  })
  it('is unique across calls', () => {
    const set = new Set(Array.from({ length: 100 }, newSessionToken))
    expect(set.size).toBe(100)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npm test -- session
```

- [ ] **Step 3: Implement**

```ts
// lib/session.ts
import { nanoid } from 'nanoid'

export const SESSION_COOKIE = 'camping_session'

export function newSessionToken(): string {
  return nanoid(32)
}
```

- [ ] **Step 4: Run — expect pass**

```bash
npm test -- session
```

- [ ] **Step 5: Commit**

```bash
git add lib/session.ts tests/unit/session.test.ts
git commit -m "feat: add session token helpers"
```

---

### Task 7: Camping template data

**Files:**
- Create: `lib/templates.ts`, `tests/unit/templates.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/templates.test.ts
import { describe, it, expect } from 'vitest'
import { CAMPING_TEMPLATE, categoryOrder } from '@/lib/templates'

describe('CAMPING_TEMPLATE', () => {
  it('has items in five distinct categories', () => {
    const cats = new Set(CAMPING_TEMPLATE.map((i) => i.category))
    expect(cats.size).toBeGreaterThanOrEqual(4)
  })
  it('each item has a name and quantity_needed >= 1', () => {
    for (const item of CAMPING_TEMPLATE) {
      expect(item.name).toBeTruthy()
      expect(item.quantity_needed).toBeGreaterThanOrEqual(1)
    }
  })
  it('contains the essentials', () => {
    const names = CAMPING_TEMPLATE.map((i) => i.name.toLowerCase())
    expect(names).toContain('zelt')
    expect(names.some((n) => n.includes('schlafsack'))).toBe(true)
    expect(names.some((n) => n.includes('gaskocher'))).toBe(true)
  })
})

describe('categoryOrder', () => {
  it('lists all six categories in stable order', () => {
    expect(categoryOrder).toEqual([
      'schlafen', 'kochen', 'essen', 'equipment', 'persoenlich', 'sonstiges',
    ])
  })
})
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Implement**

```ts
// lib/templates.ts
export type Category =
  | 'schlafen' | 'kochen' | 'essen' | 'equipment' | 'persoenlich' | 'sonstiges'

export const categoryOrder: Category[] = [
  'schlafen', 'kochen', 'essen', 'equipment', 'persoenlich', 'sonstiges',
]

export interface TemplateItem {
  name: string
  category: Category
  quantity_needed: number
}

export const CAMPING_TEMPLATE: TemplateItem[] = [
  { name: 'Zelt',          category: 'schlafen',  quantity_needed: 2 },
  { name: 'Schlafsack',    category: 'schlafen',  quantity_needed: 4 },
  { name: 'Isomatte',      category: 'schlafen',  quantity_needed: 4 },
  { name: 'Gaskocher',     category: 'kochen',    quantity_needed: 1 },
  { name: 'Topf',          category: 'kochen',    quantity_needed: 1 },
  { name: 'Pfanne',        category: 'kochen',    quantity_needed: 1 },
  { name: 'Besteck-Set',   category: 'kochen',    quantity_needed: 4 },
  { name: 'Wasser (5l)',   category: 'essen',     quantity_needed: 2 },
  { name: 'Frühstück',     category: 'essen',     quantity_needed: 1 },
  { name: 'Snacks',        category: 'essen',     quantity_needed: 1 },
  { name: 'Pavillon',      category: 'equipment', quantity_needed: 1 },
  { name: 'Stirnlampe',    category: 'equipment', quantity_needed: 4 },
  { name: 'Feuerzeug',     category: 'equipment', quantity_needed: 2 },
  { name: 'Müllsäcke',     category: 'equipment', quantity_needed: 1 },
  { name: 'Klappstuhl',    category: 'equipment', quantity_needed: 4 },
]
```

- [ ] **Step 4: Run — expect pass**

- [ ] **Step 5: Commit**

```bash
git add lib/templates.ts tests/unit/templates.test.ts
git commit -m "feat: add camping template seed list"
```

---

## Phase 2 — Supabase Local + Schema

### Task 8: Initialize Supabase locally

**Files:**
- Create: `supabase/config.toml` (via CLI), `.env.local`, update `.env.example`

- [ ] **Step 1: Initialize**

```bash
npx supabase init
```

When prompted about VSCode/IntelliJ — say no.

- [ ] **Step 2: Start local stack**

```bash
npx supabase start
```

Expected: Studio URL, API URL, anon key, service_role key printed.

- [ ] **Step 3: Populate `.env.local` with output values**

```bash
cat <<'EOF' > .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EOF
```

Manually copy the values from `supabase start` into `.env.local` (gitignored).

- [ ] **Step 4: Confirm `.env.local` is gitignored**

```bash
grep -q '.env.local' .gitignore || echo '.env.local' >> .gitignore
```

- [ ] **Step 5: Commit**

```bash
git add supabase/config.toml .env.example .gitignore
git commit -m "chore: initialize supabase local development"
```

---

### Task 9: DB schema migration

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0001_init.sql
create extension if not exists "pgcrypto";

create table trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  date_from   date not null,
  date_to     date not null,
  location    text,
  join_code   text not null unique,
  created_at  timestamptz not null default now(),
  created_by  uuid
);

create table participants (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references trips(id) on delete cascade,
  name          text not null,
  avatar_emoji  text not null default '🏕️',
  joined_at     timestamptz not null default now(),
  session_token text not null unique
);

alter table trips
  add constraint trips_created_by_fk
  foreign key (created_by) references participants(id) on delete set null;

create table items (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references trips(id) on delete cascade,
  name            text not null,
  category        text not null check (category in
                    ('schlafen','kochen','essen','equipment','persoenlich','sonstiges')),
  quantity_needed int  not null default 1 check (quantity_needed >= 1),
  note            text,
  created_at      timestamptz not null default now(),
  created_by      uuid references participants(id) on delete set null
);

create table claims (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references items(id) on delete cascade,
  participant_id  uuid not null references participants(id) on delete cascade,
  quantity        int  not null default 1 check (quantity >= 1),
  trip_id         uuid not null references trips(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (item_id, participant_id)
);

create table comments (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references items(id) on delete cascade,
  participant_id  uuid not null references participants(id) on delete set null,
  trip_id         uuid not null references trips(id) on delete cascade,
  text            text not null,
  created_at      timestamptz not null default now()
);

create index on participants (trip_id);
create index on items        (trip_id);
create index on claims       (trip_id);
create index on comments     (trip_id);
create index on claims       (item_id);
create index on comments     (item_id);
```

> Note: `claims.trip_id` and `comments.trip_id` are denormalized so RLS can scope by `trip_id` without a join — matches the spec's RLS strategy.

- [ ] **Step 2: Apply locally**

```bash
npx supabase db reset
```

Expected: migration applies cleanly, no errors.

- [ ] **Step 3: Verify schema via psql**

```bash
npx supabase db dump --schema public --data-only=false | grep -E "^create table"
```

Expected: 5 `create table` lines.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "feat(db): initial schema for trips, participants, items, claims, comments"
```

---

### Task 10: RLS + Realtime publication

**Files:**
- Create: `supabase/migrations/0002_rls.sql`

> **Design decision (revised from spec):** The original spec called for a per-transaction GUC (`current_trip_id`) read by RLS policies. That approach is incompatible with supabase-js: each PostgREST call is a separate HTTP request and a separate Postgres transaction, so a transaction-local GUC set via one RPC is gone before the next query runs. Session-local GUCs leak across pooled connections and are also unsafe.
>
> **Revised approach for the MVP:**
> - **Server Actions are the trust boundary.** They read the session cookie, resolve the participant → `trip_id`, validate that the resource being touched belongs to that trip, and use the **service-role client** for the mutation.
> - **RLS stays enabled** as defense-in-depth: anon role gets SELECT on the four trip-scoped tables (data is friends-only — packing lists, not PII), and all writes are denied for anon. Service-role bypasses RLS by design, so server actions still work.
> - **Realtime** uses the anon key with `postgres_changes` filters (`trip_id=eq.<uuid>`). The filter is enforced server-side by Realtime; an attacker would need to guess a 36-char UUID to listen to a trip.
>
> This is YAGNI-appropriate for ~5–10 friends sharing a packing list. Tighten later if the app outgrows that audience.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/0002_rls.sql
alter table trips         enable row level security;
alter table participants  enable row level security;
alter table items         enable row level security;
alter table claims        enable row level security;
alter table comments      enable row level security;

-- Anon may SELECT (data isn't sensitive; access requires guessing a trip UUID).
-- All writes go through Server Actions using the service_role key, which bypasses RLS.
create policy anon_select_trips        on trips        for select to anon using (true);
create policy anon_select_participants on participants for select to anon using (true);
create policy anon_select_items        on items        for select to anon using (true);
create policy anon_select_claims       on claims       for select to anon using (true);
create policy anon_select_comments     on comments     for select to anon using (true);

-- No INSERT/UPDATE/DELETE policies for anon → those operations are denied for anon.
-- (Server actions use service_role and bypass RLS entirely.)

-- Realtime publication
alter publication supabase_realtime add table items;
alter publication supabase_realtime add table claims;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table participants;
```

- [ ] **Step 2: Apply**

```bash
npx supabase db reset
```

Expected: both migrations succeed.

- [ ] **Step 3: Smoke test the RLS posture**

```bash
# As anon: SELECT works
npx supabase db psql -c "set role anon; select count(*) from items;"
# As anon: INSERT fails
npx supabase db psql -c "set role anon; insert into items (trip_id, name, category) values (gen_random_uuid(), 'x', 'sonstiges');" || echo "INSERT denied (expected)"
```

Expected: SELECT succeeds (count 0), INSERT errors out with "new row violates row-level security policy".

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_rls.sql
git commit -m "feat(db): RLS with anon SELECT-only + realtime publication"
```

---

## Phase 3 — Supabase Clients

### Task 11: Three Supabase clients

**Files:**
- Create: `lib/supabase/admin.ts`, `lib/supabase/server.ts`, `lib/supabase/browser.ts`, `lib/types.ts`

- [ ] **Step 1: Generate DB types**

```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

- [ ] **Step 2: Write `lib/supabase/admin.ts`**

```ts
// lib/supabase/admin.ts
import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Service-Role: ONLY for session resolution + migrations. Never for user mutations.
export function supabaseAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}
```

- [ ] **Step 3: Write `lib/supabase/browser.ts`**

```ts
// lib/supabase/browser.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

// Used only for client-side Realtime subscriptions. All SELECT queries
// for the trip page run server-side via the admin client.
export function supabaseBrowser() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

> **Note:** No `lib/supabase/server.ts` is needed. Server Actions and Server Components use `supabaseAdmin()` and validate trip ownership in the action layer. The original server-client-with-GUC pattern was removed in the spec revision (see Task 10 note).

- [ ] **Step 4: Verify typecheck**

```bash
npm run typecheck
```

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/ lib/database.types.ts
git commit -m "feat: add admin and browser Supabase clients"
```

---

## Phase 4 — Server Actions

### Task 12: trips.ts — createTrip + joinTrip

**Files:**
- Create: `server-actions/trips.ts`

- [ ] **Step 1: Implement**

```ts
// server-actions/trips.ts
'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateJoinCode } from '@/lib/codes'
import { SESSION_COOKIE, newSessionToken } from '@/lib/session'
import { CAMPING_TEMPLATE } from '@/lib/templates'

const EMOJI_POOL = ['🏕️','🌲','🔥','🎒','🌞','🏔️','🐻','🦊','🌿','⛺']

function pickEmoji() {
  return EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]
}

export async function createTrip(formData: FormData): Promise<void> {
  const name      = String(formData.get('name') || '').trim()
  const dateFrom  = String(formData.get('date_from') || '')
  const dateTo    = String(formData.get('date_to') || '')
  const yourName  = String(formData.get('your_name') || '').trim()
  const useTemplate = formData.get('use_template') === 'on'

  if (!name || !dateFrom || !dateTo || !yourName) {
    throw new Error('Bitte alle Felder ausfüllen')
  }

  const admin = supabaseAdmin()
  // 1) Create trip with NULL created_by
  let joinCode = ''
  for (let i = 0; i < 5; i++) {
    joinCode = generateJoinCode()
    const { error } = await admin.from('trips').insert({
      name, date_from: dateFrom, date_to: dateTo, join_code: joinCode,
    })
    if (!error) break
    if (i === 4) throw new Error('Konnte keinen Join-Code generieren')
  }
  const { data: trip, error: tErr } = await admin
    .from('trips').select('id').eq('join_code', joinCode).single()
  if (tErr || !trip) throw new Error('Trip wurde nicht angelegt')

  // 2) Create first participant
  const sessionToken = newSessionToken()
  const { data: participant, error: pErr } = await admin
    .from('participants')
    .insert({ trip_id: trip.id, name: yourName, avatar_emoji: pickEmoji(), session_token: sessionToken })
    .select('id').single()
  if (pErr || !participant) throw new Error('Teilnehmer konnte nicht angelegt werden')

  // 3) Backfill created_by
  await admin.from('trips').update({ created_by: participant.id }).eq('id', trip.id)

  // 4) Optionally seed template
  if (useTemplate) {
    await admin.from('items').insert(
      CAMPING_TEMPLATE.map((t) => ({
        trip_id: trip.id, name: t.name, category: t.category,
        quantity_needed: t.quantity_needed, created_by: participant.id,
      })),
    )
  }

  // 5) Set cookie & redirect
  const jar = await cookies()
  jar.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 180,
  })
  redirect(`/t/${joinCode}`)
}

export async function joinTrip(formData: FormData): Promise<void> {
  const code     = String(formData.get('code') || '').trim().toUpperCase()
  const yourName = String(formData.get('your_name') || '').trim()
  if (!code || !yourName) throw new Error('Code und Name sind Pflicht')

  const admin = supabaseAdmin()
  const { data: trip } = await admin
    .from('trips').select('id').eq('join_code', code).maybeSingle()
  if (!trip) throw new Error('Diesen Code gibt\'s nicht. Schau nochmal.')

  const sessionToken = newSessionToken()
  await admin.from('participants').insert({
    trip_id: trip.id, name: yourName, avatar_emoji: pickEmoji(), session_token: sessionToken,
  })

  const jar = await cookies()
  jar.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 180,
  })
  redirect(`/t/${code}`)
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add server-actions/trips.ts
git commit -m "feat: add createTrip and joinTrip server actions"
```

---

### Task 13: items / claims / comments server actions

**Files:**
- Create: `server-actions/items.ts`, `server-actions/claims.ts`, `server-actions/comments.ts`, `lib/auth.ts` (helper)

- [ ] **Step 1: Add auth helper**

```ts
// lib/auth.ts
import 'server-only'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SESSION_COOKIE } from '@/lib/session'

/**
 * Resolves the participant from the session cookie and returns their
 * trip context. All server actions call this and use `trip_id` / `join_code`
 * to scope operations — these values are the trust boundary.
 */
export async function getCurrentParticipant() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) throw new Error('Nicht eingeloggt')
  const { data } = await supabaseAdmin()
    .from('participants')
    .select('id, trip_id, name, avatar_emoji, trips(join_code)')
    .eq('session_token', token)
    .maybeSingle()
  if (!data || !data.trips) throw new Error('Session ungültig')
  return {
    id: data.id,
    name: data.name,
    avatar_emoji: data.avatar_emoji,
    trip_id: data.trip_id,
    join_code: (data.trips as any).join_code as string,
  }
}
```

- [ ] **Step 2: items.ts**

```ts
// server-actions/items.ts
'use server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentParticipant } from '@/lib/auth'

export async function addItem(formData: FormData) {
  const p = await getCurrentParticipant()
  const supa = supabaseAdmin()

  const name = String(formData.get('name') || '').trim()
  const category = String(formData.get('category') || 'sonstiges')
  const quantity = Math.max(1, Number(formData.get('quantity_needed') || 1))
  const note = String(formData.get('note') || '').trim() || null
  if (!name) throw new Error('Name fehlt')

  await supa.from('items').insert({
    trip_id: p.trip_id, name, category, quantity_needed: quantity, note, created_by: p.id,
  })
  revalidatePath(`/t/${p.join_code}`)
}

export async function deleteItem(itemId: string) {
  const p = await getCurrentParticipant()
  const supa = supabaseAdmin()

  // Ownership AND trip-scope check — defense against forged item IDs.
  await supa.from('items').delete()
    .eq('id', itemId)
    .eq('created_by', p.id)
    .eq('trip_id', p.trip_id)
  revalidatePath(`/t/${p.join_code}`)
}
```

- [ ] **Step 3: claims.ts**

```ts
// server-actions/claims.ts
'use server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentParticipant } from '@/lib/auth'

export async function claimItem(itemId: string, quantity = 1) {
  const p = await getCurrentParticipant()
  const supa = supabaseAdmin()

  // Validate that the item belongs to the participant's trip before claiming.
  const { data: item } = await supa.from('items')
    .select('id').eq('id', itemId).eq('trip_id', p.trip_id).maybeSingle()
  if (!item) throw new Error('Item gehört nicht zu deiner Tour')

  await supa.from('claims').upsert({
    item_id: itemId, participant_id: p.id, trip_id: p.trip_id, quantity,
  }, { onConflict: 'item_id,participant_id' })
  revalidatePath(`/t/${p.join_code}`)
}

export async function unclaimItem(itemId: string) {
  const p = await getCurrentParticipant()
  const supa = supabaseAdmin()

  await supa.from('claims').delete()
    .eq('item_id', itemId)
    .eq('participant_id', p.id)
    .eq('trip_id', p.trip_id)
  revalidatePath(`/t/${p.join_code}`)
}
```

- [ ] **Step 4: comments.ts**

```ts
// server-actions/comments.ts
'use server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentParticipant } from '@/lib/auth'

export async function addComment(itemId: string, text: string) {
  const p = await getCurrentParticipant()
  const clean = text.trim()
  if (!clean) return
  const supa = supabaseAdmin()

  // Validate item belongs to the participant's trip.
  const { data: item } = await supa.from('items')
    .select('id').eq('id', itemId).eq('trip_id', p.trip_id).maybeSingle()
  if (!item) throw new Error('Item gehört nicht zu deiner Tour')

  await supa.from('comments').insert({
    item_id: itemId, participant_id: p.id, trip_id: p.trip_id, text: clean,
  })
  revalidatePath(`/t/${p.join_code}`)
}
```

> **Why service-role for mutations:** Each action validates `participant.trip_id` against the resource being touched, so the server side is the trust boundary regardless of which client we use. Service-role just removes the broken GUC dependency.

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add server-actions/ lib/auth.ts
git commit -m "feat: add items/claims/comments server actions"
```

---

## Phase 5 — UI Pages

### Task 14: Landing page (create + join)

**Files:**
- Modify: `app/page.tsx`
- Create: `app/(landing)/CreateForm.tsx`, `app/(landing)/JoinForm.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
// app/page.tsx
import { CreateForm } from './(landing)/CreateForm'
import { JoinForm } from './(landing)/JoinForm'

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-md p-6 pt-12 space-y-10">
      <header className="text-center space-y-2">
        <div className="text-5xl">⛺</div>
        <h1 className="text-2xl font-bold">Camping Packen</h1>
        <p className="text-sm text-muted-foreground">
          Wer bringt was mit? Eine Liste, alle drauf.
        </p>
      </header>
      <CreateForm />
      <div className="text-center text-xs text-muted-foreground">— oder —</div>
      <JoinForm />
    </main>
  )
}
```

- [ ] **Step 2: Create `CreateForm.tsx` (client)**

```tsx
// app/(landing)/CreateForm.tsx
'use client'
import { createTrip } from '@/server-actions/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CreateForm() {
  return (
    <form action={createTrip} className="space-y-3 rounded-2xl border p-4">
      <h2 className="font-semibold">Neue Tour anlegen</h2>
      <Input name="name" placeholder="Z. B. Bodensee-Wochenende" required />
      <div className="grid grid-cols-2 gap-2">
        <Input name="date_from" type="date" required />
        <Input name="date_to"   type="date" required />
      </div>
      <Input name="your_name" placeholder="Wie heißt du?" required />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="use_template" defaultChecked />
        Vorlage „Camping-Wochenende" verwenden
      </label>
      <Button type="submit" className="w-full">Tour anlegen</Button>
    </form>
  )
}
```

- [ ] **Step 3: Create `JoinForm.tsx` (client)**

```tsx
// app/(landing)/JoinForm.tsx
'use client'
import { joinTrip } from '@/server-actions/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function JoinForm() {
  return (
    <form action={joinTrip} className="space-y-3 rounded-2xl border p-4">
      <h2 className="font-semibold">Bestehender Tour beitreten</h2>
      <Input name="code" placeholder="Code (z. B. ABC234)" required maxLength={6} className="uppercase tracking-widest" />
      <Input name="your_name" placeholder="Wie heißt du?" required />
      <Button type="submit" variant="secondary" className="w-full">Beitreten</Button>
    </form>
  )
}
```

- [ ] **Step 4: Run, browse, confirm forms render**

```bash
npm run dev &
sleep 4
curl -fsS http://localhost:3000 | grep -E "Camping Packen|Tour anlegen"
kill %1
```

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/\(landing\)/
git commit -m "feat(ui): landing page with create and join forms"
```

---

### Task 15: Trip main page (Server Component) + Join gate

**Files:**
- Create: `app/t/[code]/page.tsx`, `app/t/[code]/join/page.tsx`, `app/t/[code]/trip-client.tsx`, `app/t/[code]/types.ts`

- [ ] **Step 1: Join gate**

```tsx
// app/t/[code]/join/page.tsx
import { joinTrip } from '@/server-actions/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function JoinGate({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return (
    <main className="mx-auto max-w-md p-6 pt-12 space-y-6">
      <h1 className="text-xl font-bold">Beitritt</h1>
      <p>Du wurdest zu einer Tour eingeladen. Wie heißt du?</p>
      <form action={joinTrip} className="space-y-3">
        <input type="hidden" name="code" value={code} />
        <Input name="your_name" placeholder="Dein Name" required />
        <Button type="submit" className="w-full">Beitreten</Button>
      </form>
    </main>
  )
}
```

- [ ] **Step 2: Trip main page server component**

```tsx
// app/t/[code]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { SESSION_COOKIE } from '@/lib/session'
import { categoryOrder, type Category } from '@/lib/templates'
import { TripClient } from './trip-client'

export default async function TripPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const admin = supabaseAdmin()

  const { data: trip } = await admin
    .from('trips').select('*').eq('join_code', code).maybeSingle()
  if (!trip) notFound()

  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  const { data: me } = token
    ? await admin.from('participants').select('*').eq('session_token', token).eq('trip_id', trip.id).maybeSingle()
    : { data: null }
  if (!me) redirect(`/t/${code}/join`)

  const [{ data: items }, { data: claims }, { data: comments }, { data: participants }] = await Promise.all([
    admin.from('items')        .select('*').eq('trip_id', trip.id).order('created_at'),
    admin.from('claims')       .select('*').eq('trip_id', trip.id),
    admin.from('comments')     .select('*').eq('trip_id', trip.id).order('created_at'),
    admin.from('participants') .select('id, name, avatar_emoji').eq('trip_id', trip.id),
  ])

  return (
    <TripClient
      trip={trip}
      me={me}
      participants={participants ?? []}
      items={items ?? []}
      claims={claims ?? []}
      comments={comments ?? []}
      categoryOrder={categoryOrder}
    />
  )
}
```

- [ ] **Step 3: Client wrapper (filter state + realtime)**

```tsx
// app/t/[code]/trip-client.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTripRealtime } from '@/lib/realtime'
import { CategorySection } from '@/components/CategorySection'
import { Filter, type FilterValue } from '@/components/Filter'
import { ParticipantAvatars } from '@/components/ParticipantAvatars'
import { ShareButton } from '@/components/ShareButton'
import { AddItemFAB } from '@/components/AddItemFAB'
import type { Category } from '@/lib/templates'

export function TripClient(props: {
  trip: any; me: any; participants: any[]; items: any[]; claims: any[]; comments: any[];
  categoryOrder: Category[]
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterValue>('alle')
  useTripRealtime(props.trip.id, () => router.refresh())

  const visibleItems = props.items.filter((i) => {
    if (filter === 'alle')  return true
    const claimsForItem = props.claims.filter((c) => c.item_id === i.id)
    if (filter === 'offen') return claimsForItem.length === 0
    if (filter === 'meine') return claimsForItem.some((c) => c.participant_id === props.me.id)
    return true
  })

  return (
    <main className="mx-auto max-w-md pb-32">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="font-bold truncate">{props.trip.name}</h1>
          <ShareButton joinCode={props.trip.join_code} />
        </div>
        <div className="text-xs text-muted-foreground">
          {props.trip.date_from} – {props.trip.date_to}
        </div>
        <ParticipantAvatars participants={props.participants} />
      </header>

      <Filter value={filter} onChange={setFilter} />

      {props.categoryOrder.map((cat) => {
        const its = visibleItems.filter((i) => i.category === cat)
        if (!its.length) return null
        return (
          <CategorySection
            key={cat}
            category={cat}
            items={its}
            claims={props.claims}
            comments={props.comments}
            participants={props.participants}
            me={props.me}
          />
        )
      })}

      <AddItemFAB />
    </main>
  )
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

This will fail on the missing components — that's expected. We'll add them next, but commit the page scaffold now.

- [ ] **Step 5: Stub missing modules so typecheck passes**

Create temporary stubs in `components/` so we can commit incrementally:

```bash
mkdir -p components lib
cat > lib/realtime.ts <<'EOF'
'use client'
export function useTripRealtime(_tripId: string, _onChange: () => void) {}
EOF
for f in CategorySection Filter ParticipantAvatars ShareButton AddItemFAB; do
  echo "export function $f(_props: any) { return null as any }" > components/$f.tsx
done
# Filter needs a named type export
cat > components/Filter.tsx <<'EOF'
'use client'
export type FilterValue = 'alle' | 'offen' | 'meine'
export function Filter(_props: { value: FilterValue; onChange: (v: FilterValue) => void }) {
  return null as any
}
EOF
```

```bash
npm run typecheck
```

Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add app/t lib/realtime.ts components/
git commit -m "feat(ui): trip page scaffold with join gate and component stubs"
```

---

## Phase 6 — Components

### Task 16: ItemCard + CategorySection + ItemSheet

**Files:**
- Modify: `components/CategorySection.tsx`
- Create: `components/ItemCard.tsx`, `components/ItemSheet.tsx`

- [ ] **Step 1: ItemCard**

```tsx
// components/ItemCard.tsx
'use client'
import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { claimItem, unclaimItem } from '@/server-actions/claims'
import { ItemSheet } from './ItemSheet'
import { MessageCircle } from 'lucide-react'

const CATEGORY_EMOJI: Record<string, string> = {
  schlafen: '🛏️', kochen: '🍳', essen: '🥖', equipment: '🔦', persoenlich: '👕', sonstiges: '📦',
}

export function ItemCard({ item, claims, comments, participants, me }: any) {
  const [open, setOpen] = useState(false)
  const [isPending, start] = useTransition()
  const mine = claims.find((c: any) => c.participant_id === me.id)
  const claimed = claims.reduce((sum: number, c: any) => sum + c.quantity, 0)
  const claimers = claims.map((c: any) => participants.find((p: any) => p.id === c.participant_id)).filter(Boolean)
  const itemComments = comments.filter((c: any) => c.item_id === item.id)

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    start(() => (mine ? unclaimItem(item.id) : claimItem(item.id, 1)))
  }

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-xl border bg-card p-3 active:bg-muted transition cursor-pointer"
      >
        <div className="text-2xl">{CATEGORY_EMOJI[item.category] ?? '📦'}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.name}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{claimed} / {item.quantity_needed} zugesagt</span>
            <div className="flex -space-x-1">
              {claimers.slice(0, 3).map((p: any) => (
                <span key={p.id} className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs ring-1 ring-background">
                  {p.avatar_emoji}
                </span>
              ))}
            </div>
            {claimed > item.quantity_needed && (
              <Badge variant="secondary" className="text-[10px]">schon abgedeckt</Badge>
            )}
          </div>
        </div>
        {itemComments.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle className="h-3 w-3" />{itemComments.length}
          </div>
        )}
        <Button
          size="sm" variant={mine ? 'secondary' : 'default'} disabled={isPending}
          onClick={toggle}
        >
          {mine ? '✓' : '+'}
        </Button>
      </div>
      {open && (
        <ItemSheet
          item={item} claims={claims} comments={comments} participants={participants} me={me}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: CategorySection**

```tsx
// components/CategorySection.tsx
'use client'
import { ItemCard } from './ItemCard'

const TITLE: Record<string, string> = {
  schlafen: 'Schlafen', kochen: 'Kochen', essen: 'Essen & Trinken',
  equipment: 'Equipment', persoenlich: 'Persönliches', sonstiges: 'Sonstiges',
}

export function CategorySection({ category, items, ...rest }: any) {
  return (
    <section className="p-4 space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground">{TITLE[category]}</h2>
      <div className="space-y-2">
        {items.map((it: any) => (
          <ItemCard key={it.id} item={it} {...rest} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: ItemSheet**

```tsx
// components/ItemSheet.tsx
'use client'
import { useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { claimItem, unclaimItem } from '@/server-actions/claims'
import { addComment } from '@/server-actions/comments'
import { deleteItem } from '@/server-actions/items'

export function ItemSheet({ item, claims, comments, participants, me, onClose }: any) {
  const [text, setText] = useState('')
  const [isPending, start] = useTransition()
  const mine = claims.find((c: any) => c.participant_id === me.id)
  const itemComments = comments.filter((c: any) => c.item_id === item.id)
  const canDelete = item.created_by === me.id

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            {item.note || 'Keine Notiz.'}
          </div>

          <div className="flex items-center gap-2">
            <Button
              disabled={isPending}
              onClick={() => start(() => (mine ? unclaimItem(item.id) : claimItem(item.id, 1)))}
            >
              {mine ? 'Doch nicht' : 'Ich bring eins'}
            </Button>
            {canDelete && (
              <Button variant="ghost" disabled={isPending}
                onClick={() => start(async () => { await deleteItem(item.id); onClose() })}>
                Löschen
              </Button>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Zusagen</h3>
            <ul className="space-y-1 text-sm">
              {claims.map((c: any) => {
                const p = participants.find((p: any) => p.id === c.participant_id)
                return <li key={c.id}>{p?.avatar_emoji} {p?.name} — {c.quantity}×</li>
              })}
              {claims.length === 0 && <li className="text-muted-foreground">Noch keiner.</li>}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Kommentare</h3>
            <ul className="space-y-2 text-sm mb-2">
              {itemComments.map((c: any) => {
                const p = participants.find((p: any) => p.id === c.participant_id)
                return (
                  <li key={c.id}>
                    <span className="font-medium">{p?.avatar_emoji} {p?.name}: </span>{c.text}
                  </li>
                )
              })}
            </ul>
            <form
              action={() => start(async () => { await addComment(item.id, text); setText('') })}
              className="flex gap-2"
            >
              <Textarea
                value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Kommentar…" rows={1}
              />
              <Button type="submit" disabled={!text.trim() || isPending}>Senden</Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 4: Typecheck + commit**

```bash
npm run typecheck
git add components/ItemCard.tsx components/CategorySection.tsx components/ItemSheet.tsx
git commit -m "feat(ui): ItemCard, CategorySection, and ItemSheet"
```

---

### Task 17: Filter, ParticipantAvatars, ShareButton, AddItemFAB

**Files:**
- Modify: `components/Filter.tsx`, `components/ParticipantAvatars.tsx`, `components/ShareButton.tsx`, `components/AddItemFAB.tsx`

- [ ] **Step 1: Filter**

```tsx
// components/Filter.tsx
'use client'
import { cn } from '@/lib/utils'

export type FilterValue = 'alle' | 'offen' | 'meine'

const TABS: { v: FilterValue; label: string }[] = [
  { v: 'alle', label: 'Alle' },
  { v: 'offen', label: 'Offen' },
  { v: 'meine', label: 'Meine' },
]

export function Filter({ value, onChange }: { value: FilterValue; onChange: (v: FilterValue) => void }) {
  return (
    <nav className="sticky top-[88px] z-10 bg-background/90 backdrop-blur px-4 py-2 border-b flex gap-2">
      {TABS.map((t) => (
        <button
          key={t.v}
          onClick={() => onChange(t.v)}
          className={cn(
            'px-3 py-1 rounded-full text-sm border',
            value === t.v ? 'bg-foreground text-background' : 'bg-background',
          )}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: ParticipantAvatars**

```tsx
// components/ParticipantAvatars.tsx
'use client'

export function ParticipantAvatars({ participants }: { participants: any[] }) {
  return (
    <div className="flex -space-x-2 mt-2">
      {participants.map((p) => (
        <div key={p.id}
          title={p.name}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted ring-2 ring-background"
        >
          {p.avatar_emoji}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: ShareButton**

```tsx
// components/ShareButton.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export function ShareButton({ joinCode }: { joinCode: string }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? `${window.location.origin}/t/${joinCode}/join` : ''

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Camping Packen', url }); return } catch {}
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast('Link kopiert')
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button variant="ghost" size="sm" onClick={share}>
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      <span className="ml-1 text-xs">{joinCode}</span>
    </Button>
  )
}
```

- [ ] **Step 4: AddItemFAB**

```tsx
// components/AddItemFAB.tsx
'use client'
import { useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { addItem } from '@/server-actions/items'
import { categoryOrder } from '@/lib/templates'

export function AddItemFAB() {
  const [open, setOpen] = useState(false)
  const [isPending, start] = useTransition()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-20 inline-flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg active:scale-95 transition"
        aria-label="Item hinzufügen"
      >
        <Plus className="h-6 w-6" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader><SheetTitle>Neues Item</SheetTitle></SheetHeader>
          <form
            action={async (fd) => start(async () => { await addItem(fd); setOpen(false) })}
            className="space-y-3 py-4"
          >
            <Input name="name" placeholder="Z. B. Marshmallows" required />
            <select name="category" className="w-full rounded-md border bg-background p-2">
              {categoryOrder.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input name="quantity_needed" type="number" min={1} defaultValue={1} />
            <Input name="note" placeholder="Notiz (optional)" />
            <Button type="submit" disabled={isPending} className="w-full">Hinzufügen</Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
```

- [ ] **Step 5: Typecheck + commit**

```bash
npm run typecheck
git add components/Filter.tsx components/ParticipantAvatars.tsx components/ShareButton.tsx components/AddItemFAB.tsx
git commit -m "feat(ui): filter tabs, avatars, share button, add-item FAB"
```

---

### Task 18: Realtime hook

**Files:**
- Modify: `lib/realtime.ts`

- [ ] **Step 1: Implement**

```ts
// lib/realtime.ts
'use client'
import { useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase/browser'

export function useTripRealtime(tripId: string, onChange: () => void) {
  useEffect(() => {
    const supa = supabaseBrowser()
    const channel = supa
      .channel(`trip:${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items',        filter: `trip_id=eq.${tripId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims',       filter: `trip_id=eq.${tripId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments',     filter: `trip_id=eq.${tripId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `trip_id=eq.${tripId}` }, onChange)
      .subscribe()
    return () => { supa.removeChannel(channel) }
  }, [tripId, onChange])
}
```

- [ ] **Step 2: Wire toast notifier to root layout**

```tsx
// app/layout.tsx — add inside body
import { Toaster } from '@/components/ui/sonner'
// ...
// inside <body>:
{children}
<Toaster />
```

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev &
sleep 4
open http://localhost:3000
# Browser: create a trip, open the trip URL in two windows, claim something.
# Confirm both windows reflect the change within ~1s.
kill %1
```

- [ ] **Step 4: Commit**

```bash
git add lib/realtime.ts app/layout.tsx
git commit -m "feat: realtime channel subscription per trip"
```

---

## Phase 7 — End-to-End Smoke Test

### Task 19: Playwright happy-path

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/happy-path.spec.ts`

- [ ] **Step 1: Init Playwright config**

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:3000', viewport: { width: 390, height: 844 } },
  projects: [{ name: 'mobile-safari', use: { ...devices['iPhone 13'] } }],
  webServer: { command: 'npm run dev', port: 3000, reuseExistingServer: true },
})
```

- [ ] **Step 2: Install browsers**

```bash
npx playwright install --with-deps chromium webkit
```

- [ ] **Step 3: Write the spec**

```ts
// tests/e2e/happy-path.spec.ts
import { test, expect, chromium } from '@playwright/test'

test('A creates trip; B joins via link; B claims; A sees claim', async () => {
  // --- Context A ---
  const browser = await chromium.launch()
  const ctxA = await browser.newContext()
  const a = await ctxA.newPage()
  await a.goto('/')
  await a.getByPlaceholder('Z. B. Bodensee-Wochenende').fill('Test-Tour')
  await a.locator('input[name=date_from]').fill('2026-06-01')
  await a.locator('input[name=date_to]').fill('2026-06-03')
  await a.getByPlaceholder('Wie heißt du?').first().fill('Anna')
  await a.getByRole('button', { name: 'Tour anlegen' }).click()
  await expect(a).toHaveURL(/\/t\/[A-Z2-9]{6}$/)
  const code = a.url().split('/').pop()!

  // --- Context B ---
  const ctxB = await browser.newContext()
  const b = await ctxB.newPage()
  await b.goto(`/t/${code}/join`)
  await b.getByPlaceholder('Dein Name').fill('Bert')
  await b.getByRole('button', { name: 'Beitreten' }).click()
  await expect(b).toHaveURL(`/t/${code}`)

  // B claims the Zelt item (template seeds quantity_needed=2).
  const zeltCard = b.locator('div', { hasText: 'Zelt' }).filter({ hasText: '0 / 2 zugesagt' }).first()
  await expect(zeltCard).toBeVisible()
  await zeltCard.click()
  await b.getByRole('button', { name: 'Ich bring eins' }).click()
  await b.keyboard.press('Escape')
  // B's own view should reflect the claim immediately.
  await expect(b.locator('div', { hasText: 'Zelt' }).filter({ hasText: '1 / 2 zugesagt' }).first()).toBeVisible()

  // A reloads and must see the new claim count — proves the write crossed contexts.
  await a.reload()
  await expect(a.locator('div', { hasText: 'Zelt' }).filter({ hasText: '1 / 2 zugesagt' }).first()).toBeVisible()

  await browser.close()
})
```

- [ ] **Step 4: Run**

```bash
npm run test:e2e
```

Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/
git commit -m "test(e2e): playwright happy-path smoke for create/join/claim"
```

---

## Phase 8 — Deploy

### Task 20: Dockerfile + Coolify

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `next.config.ts` (modify)

- [ ] **Step 1: Set Next.js standalone output**

```ts
// next.config.ts
import type { NextConfig } from 'next'
const config: NextConfig = { output: 'standalone' }
export default config
```

- [ ] **Step 2: Dockerfile**

```dockerfile
# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 3: `.dockerignore`**

```
node_modules
.next
.git
.env.local
docs
tests
playwright-report
```

- [ ] **Step 4: Build the image locally**

```bash
docker build -t camping-packing .
```

Expected: image builds, ~250 MB.

- [ ] **Step 5: Document Coolify env vars in README**

Append to `README.md`:

```md
## Deployment (Coolify on Just Ship Cloud)

1. Push to GitHub.
2. In Coolify: new Application → Docker → Public Repository.
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Domain: `packen.yvesschleich.com`.
5. First deploy: run migrations against the remote Supabase project via `supabase db push`.
```

- [ ] **Step 6: Commit**

```bash
git add Dockerfile .dockerignore next.config.ts README.md
git commit -m "chore: production Dockerfile and Coolify deployment notes"
```

---

## Final Checks

### Task 21: Verify the 9-point done definition from the spec

- [ ] **Step 1: Run all checks**

```bash
npm run typecheck && npm run test && npm run test:e2e
```

- [ ] **Step 2: Manual QA checklist (against the spec's Done-Definition)**

Mark each as you confirm in a real browser on your phone:

- [ ] Create a tour on phone, get share link
- [ ] Open link in second browser, join with name
- [ ] Both users see same list
- [ ] Claim an item — visible in < 2s in the other browser
- [ ] Add a custom item — visible in other browser
- [ ] Delete own item — visible in other browser
- [ ] Add a comment — visible in other browser
- [ ] Re-open after closing — cookie keeps identity
- [ ] Camping-Wochenende template appears when checked
- [ ] Deployed to `packen.yvesschleich.com` and reachable
- [ ] Mobile Safari + Chrome Android both rendered + functional

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit --allow-empty -m "chore: MVP complete — packing app shipped"
```

---

## Notes for Implementers

- Treat `created_by` mismatches gracefully — the DB has `on delete set null` for most FKs.
- If `npm run dev` is slow on first hit, that's Next.js compile-on-demand. Production build is fast.
- shadcn's `Sheet` defaults to "right" — we explicitly set `side="bottom"`.
- The `revalidatePath` calls after each Server Action are belt-and-suspenders: the realtime channel also calls `router.refresh()`. Keep both — `revalidatePath` covers the case where the user has no realtime channel yet (initial action).
- If you change category enums in `lib/templates.ts`, also update the DB CHECK constraint in `0001_init.sql`.
- The `unique(session_token)` on participants means a stolen cookie could impersonate. Acceptable for MVP — friends-only audience, HTTPS, HttpOnly+SameSite=Lax cookie.
