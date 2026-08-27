-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Distinguish CSSC vs Regular Return Mail Tracker branches. Existing rows
-- default to 'cssc' so the current tracker keeps working unchanged.
alter table tracker_branches
  add column if not exists tracker_type text not null default 'cssc'
  check (tracker_type in ('cssc', 'regular'));

create index if not exists tracker_branches_type_idx on tracker_branches (tracker_type);

-- Settings row for the new Regular tracker's editable title.
insert into tracker_settings (id, title)
values ('00000000-0000-0000-0000-000000000002', 'Regular Return Mail Tracker')
on conflict (id) do nothing;

-- Editable per-month sub-caption (Regular tracker only, for now).
create table if not exists tracker_descriptions (
  id uuid primary key default gen_random_uuid(),
  activity_month date not null,
  tracker_type text not null check (tracker_type in ('cssc', 'regular')),
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_month, tracker_type)
);

alter table tracker_descriptions enable row level security;

create policy "public can read tracker_descriptions"
  on tracker_descriptions for select
  using (true);

create policy "authenticated can insert tracker_descriptions"
  on tracker_descriptions for insert
  to authenticated
  with check (true);

create policy "authenticated can update tracker_descriptions"
  on tracker_descriptions for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete tracker_descriptions"
  on tracker_descriptions for delete
  to authenticated
  using (true);

create trigger tracker_descriptions_set_updated_at
  before update on tracker_descriptions
  for each row
  execute function set_updated_at();

-- Retention matches the other reports.
create or replace function purge_old_tracker_descriptions()
returns void as $$
begin
  delete from tracker_descriptions
  where activity_month < (date_trunc('month', now()) - interval '1 month');
end;
$$ language plpgsql security definer;

grant execute on function purge_old_tracker_descriptions() to anon, authenticated;
