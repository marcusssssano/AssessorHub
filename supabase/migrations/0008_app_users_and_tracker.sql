-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Profile picker users
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_users enable row level security;

create policy "public can read app_users"
  on app_users for select
  using (true);

create policy "authenticated can insert app_users"
  on app_users for insert
  to authenticated
  with check (true);

create policy "authenticated can update app_users"
  on app_users for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete app_users"
  on app_users for delete
  to authenticated
  using (true);

create trigger app_users_set_updated_at
  before update on app_users
  for each row
  execute function set_updated_at();

insert into app_users (name, sort_order) values ('AILEEN', 0);

-- CSSC Return Mail Tracker
create table if not exists tracker_branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tracker_branches enable row level security;

create policy "public can read tracker_branches"
  on tracker_branches for select
  using (true);

create policy "authenticated can insert tracker_branches"
  on tracker_branches for insert
  to authenticated
  with check (true);

create policy "authenticated can update tracker_branches"
  on tracker_branches for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete tracker_branches"
  on tracker_branches for delete
  to authenticated
  using (true);

create trigger tracker_branches_set_updated_at
  before update on tracker_branches
  for each row
  execute function set_updated_at();

create table if not exists tracker_statuses (
  id uuid primary key default gen_random_uuid(),
  activity_month date not null,
  branch_id uuid not null references tracker_branches(id) on delete cascade,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_month, branch_id)
);

create index if not exists tracker_statuses_month_idx on tracker_statuses (activity_month);

alter table tracker_statuses enable row level security;

create policy "public can read tracker_statuses"
  on tracker_statuses for select
  using (true);

create policy "authenticated can insert tracker_statuses"
  on tracker_statuses for insert
  to authenticated
  with check (true);

create policy "authenticated can update tracker_statuses"
  on tracker_statuses for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete tracker_statuses"
  on tracker_statuses for delete
  to authenticated
  using (true);

create trigger tracker_statuses_set_updated_at
  before update on tracker_statuses
  for each row
  execute function set_updated_at();

-- Retention matches the other monthly reports: a month survives through the
-- following calendar month, then is purged.
create or replace function purge_old_tracker_statuses()
returns void as $$
begin
  delete from tracker_statuses
  where activity_month < (date_trunc('month', now()) - interval '1 month');
end;
$$ language plpgsql security definer;

grant execute on function purge_old_tracker_statuses() to anon, authenticated;
