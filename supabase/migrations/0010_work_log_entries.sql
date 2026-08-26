-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

create table if not exists work_log_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null unique,
  return_mail_count integer not null default 0,
  completed_tasks text,
  ongoing_tasks text,
  next_tasks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_log_entries_date_idx on work_log_entries (entry_date);

alter table work_log_entries enable row level security;

create policy "public can read work_log_entries"
  on work_log_entries for select
  using (true);

create policy "authenticated can insert work_log_entries"
  on work_log_entries for insert
  to authenticated
  with check (true);

create policy "authenticated can update work_log_entries"
  on work_log_entries for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete work_log_entries"
  on work_log_entries for delete
  to authenticated
  using (true);

create trigger work_log_entries_set_updated_at
  before update on work_log_entries
  for each row
  execute function set_updated_at();

-- Retention matches the other reports: an entry's month survives through
-- the following calendar month, then is purged.
create or replace function purge_old_work_log_entries()
returns void as $$
begin
  delete from work_log_entries
  where entry_date < (date_trunc('month', now()) - interval '1 month');
end;
$$ language plpgsql security definer;

grant execute on function purge_old_work_log_entries() to anon, authenticated;
