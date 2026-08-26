-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

create table if not exists task_tracker_entries (
  id uuid primary key default gen_random_uuid(),
  task text not null,
  deadline date not null,
  status text not null default 'Not Started' check (status in ('Not Started', 'In Progress', 'Completed')),
  note text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists task_tracker_entries_deadline_idx on task_tracker_entries (deadline);
create index if not exists task_tracker_entries_status_idx on task_tracker_entries (status);

alter table task_tracker_entries enable row level security;

create policy "public can read task_tracker_entries"
  on task_tracker_entries for select
  using (true);

create policy "authenticated can insert task_tracker_entries"
  on task_tracker_entries for insert
  to authenticated
  with check (true);

create policy "authenticated can update task_tracker_entries"
  on task_tracker_entries for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete task_tracker_entries"
  on task_tracker_entries for delete
  to authenticated
  using (true);

create trigger task_tracker_entries_set_updated_at
  before update on task_tracker_entries
  for each row
  execute function set_updated_at();

-- Retention matches the other reports: a task's deadline month survives
-- through the following calendar month, then is purged (regardless of status).
create or replace function purge_old_task_tracker_entries()
returns void as $$
begin
  delete from task_tracker_entries
  where deadline < (date_trunc('month', now()) - interval '1 month');
end;
$$ language plpgsql security definer;

grant execute on function purge_old_task_tracker_entries() to anon, authenticated;
