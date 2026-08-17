-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

alter table report_entries add column if not exists count integer not null default 1;
alter table report_entries alter column reference_file drop not null;
