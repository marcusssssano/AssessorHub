-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

create table if not exists report_entries (
  id uuid primary key default gen_random_uuid(),
  activity_month date not null,
  branch text not null,
  reference_file text not null,
  category text not null check (
    category in ('exempted_reason_code', 'incorrect_scanned_label', 'processed_return_mail')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists report_entries_month_branch_idx
  on report_entries (activity_month, branch);

alter table report_entries enable row level security;

create policy "public can read report_entries"
  on report_entries for select
  using (true);

create policy "authenticated can insert report_entries"
  on report_entries for insert
  to authenticated
  with check (true);

create policy "authenticated can update report_entries"
  on report_entries for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can delete report_entries"
  on report_entries for delete
  to authenticated
  using (true);

create trigger report_entries_set_updated_at
  before update on report_entries
  for each row
  execute function set_updated_at();

-- Retention: keeps the activity month fully through the following calendar
-- month, then purges it. E.g. July entries are deleted once September begins.
create or replace function purge_old_report_entries()
returns void as $$
begin
  delete from report_entries
  where activity_month < (date_trunc('month', now()) - interval '1 month');
end;
$$ language plpgsql security definer;

grant execute on function purge_old_report_entries() to anon, authenticated;
