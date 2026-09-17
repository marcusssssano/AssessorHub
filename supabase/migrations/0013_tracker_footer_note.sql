-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- Adds a free-form footer note for the Return Mail Tracker reports.
-- Applies to both CSSC and Regular (unlike `description`, which is Regular-only).
alter table tracker_descriptions
  add column if not exists footer_note text;

-- description was previously required (only Regular used this table); now CSSC
-- rows may only set footer_note, so it can no longer be NOT NULL.
alter table tracker_descriptions
  alter column description drop not null;
