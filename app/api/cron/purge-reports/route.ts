import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error: entriesError } = await supabase.rpc("purge_old_report_entries");
  if (entriesError) {
    return NextResponse.json({ ok: false, error: entriesError.message }, { status: 500 });
  }

  const { error: descriptionsError } = await supabase.rpc("purge_old_report_descriptions");
  if (descriptionsError) {
    return NextResponse.json({ ok: false, error: descriptionsError.message }, { status: 500 });
  }

  const { error: trackerError } = await supabase.rpc("purge_old_tracker_statuses");
  if (trackerError) {
    return NextResponse.json({ ok: false, error: trackerError.message }, { status: 500 });
  }

  const { error: workLogError } = await supabase.rpc("purge_old_work_log_entries");
  if (workLogError) {
    return NextResponse.json({ ok: false, error: workLogError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
}
