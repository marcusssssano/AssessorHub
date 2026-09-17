-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Weekly Scan Return Mail Tracker
create table if not exists weekly_scan_branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table weekly_scan_branches enable row level security;

create policy "public can read weekly_scan_branches"
  on weekly_scan_branches for select
  using (true);

create policy "authenticated can insert weekly_scan_branches"
  on weekly_scan_branches for insert
  to authenticated
  with check (true);

create policy "authenticated can update weekly_scan_branches"
  on weekly_scan_branches for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete weekly_scan_branches"
  on weekly_scan_branches for delete
  to authenticated
  using (true);

create trigger weekly_scan_branches_set_updated_at
  before update on weekly_scan_branches
  for each row
  execute function set_updated_at();

create table if not exists weekly_scan_entries (
  id uuid primary key default gen_random_uuid(),
  activity_month date not null,
  branch_id uuid not null references weekly_scan_branches(id) on delete cascade,
  week1 boolean not null default false,
  week2 boolean not null default false,
  week3 boolean not null default false,
  week4 boolean not null default false,
  week5 boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_month, branch_id)
);

create index if not exists weekly_scan_entries_month_idx on weekly_scan_entries (activity_month);

alter table weekly_scan_entries enable row level security;

create policy "public can read weekly_scan_entries"
  on weekly_scan_entries for select
  using (true);

create policy "authenticated can insert weekly_scan_entries"
  on weekly_scan_entries for insert
  to authenticated
  with check (true);

create policy "authenticated can update weekly_scan_entries"
  on weekly_scan_entries for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete weekly_scan_entries"
  on weekly_scan_entries for delete
  to authenticated
  using (true);

create trigger weekly_scan_entries_set_updated_at
  before update on weekly_scan_entries
  for each row
  execute function set_updated_at();

-- Retention matches the other reports: a month survives through the
-- following calendar month, then is purged.
create or replace function purge_old_weekly_scan_entries()
returns void as $$
begin
  delete from weekly_scan_entries
  where activity_month < (date_trunc('month', now()) - interval '1 month');
end;
$$ language plpgsql security definer;

grant execute on function purge_old_weekly_scan_entries() to anon, authenticated;
