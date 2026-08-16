# AssessorHub — Link Management System

## Overview
A lightweight, searchable link directory replacing a 500+ row Excel sheet. Single admin user (sister), Chrome-only usage, zero-cost hosting.

## Stack
- **Frontend/Backend:** Next.js (App Router) on Vercel (Hobby/free tier)
- **Database + Auth:** Supabase (free tier) — Postgres + built-in email/password auth
- **Styling:** Tailwind CSS (fast to build, no cost)
- **CSV Import:** `papaparse` (client-side parse) → bulk insert via Supabase client, run once as an admin-only import tool/script

## Database Schema

Deliberately minimal: title + URL is the core need — searching a keyword (e.g. "Hauskon", "Maricopa") should match against the title and surface the right link. No separate county/category/state columns required; that info lives naturally inside the title text (e.g. "Hauskon County Parcel Viewer"). A `notes` field is included since it's low-cost and often useful for login quirks.

```sql
create table links (
  id uuid primary key default gen_random_uuid(),
  title text not null,           -- e.g. "Hauskon County Assessor" — primary search target
  url text not null,
  notes text,                    -- optional free-text, e.g. login quirks, tips
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enables fast partial/fuzzy text search ("hauskon" matches "Hauskon County Assessor")
create extension if not exists pg_trgm;
create index links_title_trgm_idx on links using gin (title gin_trgm_ops);

-- Row Level Security: public read, only authenticated admin can write
alter table links enable row level security;

create policy "public can read links" on links
  for select using (true);

create policy "authenticated can write links" on links
  for all using (auth.role() = 'authenticated');
```

## Project Structure
```
AssessorHub/
├── app/
│   ├── page.tsx                 # Dashboard: search + link list
│   ├── admin/
│   │   ├── page.tsx             # Admin CRUD table
│   │   ├── login/page.tsx       # Supabase auth login
│   │   └── import/page.tsx      # CSV bulk import tool
│   └── api/                     # (if needed) route handlers for CRUD
├── components/
│   ├── SearchBar.tsx
│   ├── LinkCard.tsx / LinkTable.tsx
│   └── LinkForm.tsx             # shared add/edit form
├── lib/
│   └── supabase/client.ts       # Supabase client init (browser + server)
├── plan.md
└── README.md
```

## Development Phases

**Phase 0 — Setup**
- Create a **new Supabase organization/account** dedicated to this project (keeps it isolated from your 2 existing projects and free-tier limits)
- Create `links` table + RLS policies (public read, authenticated write)
- Scaffold Next.js app, connect Supabase env vars, deploy empty shell to Vercel

**Phase 1 — Read-only Dashboard**
- Single search box, instant client-side or debounced server-side substring/fuzzy match on `title`
- Public read access — no login required to search/browse (per decision: only admin actions are gated)
- `target="_blank" rel="noopener noreferrer"` on all links

**Phase 2 — Admin Auth**
- Supabase email/password login, single account created manually for your sister (no public signup)
- Protect `/admin/*` routes via middleware checking session

**Phase 3 — CRUD**
- Add/Edit/Delete forms for links, wired to Supabase client
- Basic validation (require title + valid URL)

**Phase 4 — Bulk CSV Import**
- Admin-only page: upload CSV, preview parsed rows, map columns, insert in batch
- One-time use for the initial 500+ row migration, but kept in case she gets a new list later

**Phase 5 — Polish**
- Sorting/filtering by county/category
- Deploy final version, smoke-test on her actual laptop/Chrome

## Decisions Locked In
- **Access model:** Public dashboard (search/browse, no login needed) + admin-only login gate for Add/Edit/Delete.
- **Search:** Single search box across `title` only — no category/state filters. Keyword like "Hauskon" or "Maricopa" should surface the matching link via substring/fuzzy match.
- **Schema:** Kept minimal — `title`, `url`, `notes`. No separate county/state/category columns; that context lives in the title text itself.
- **Supabase hosting:** New Supabase org/account dedicated to this project, since the existing account already has 2 free-tier projects.

## Remaining Open Item
- Need the actual CSV export of her spreadsheet (or its column headers) to finalize the import-mapping step in Phase 4 — send it whenever ready.
