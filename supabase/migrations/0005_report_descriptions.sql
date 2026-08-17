-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

create table if not exists report_descriptions (
  id uuid primary key default gen_random_uuid(),
  activity_month date not null,
  branch text not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_month, branch)
);

alter table report_descriptions enable row level security;

create policy "public can read report_descriptions"
  on report_descriptions for select
  using (true);

create policy "authenticated can insert report_descriptions"
  on report_descriptions for insert
  to authenticated
  with check (true);

create policy "authenticated can update report_descriptions"
  on report_descriptions for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete report_descriptions"
  on report_descriptions for delete
  to authenticated
  using (true);

create trigger report_descriptions_set_updated_at
  before update on report_descriptions
  for each row
  execute function set_updated_at();

-- Retention matches report_entries: descriptions for an activity month are
-- purged once that month is more than 1 month old.
create or replace function purge_old_report_descriptions()
returns void as $$
begin
  delete from report_descriptions
  where activity_month < (date_trunc('month', now()) - interval '1 month');
end;
$$ language plpgsql security definer;

grant execute on function purge_old_report_descriptions() to anon, authenticated;
