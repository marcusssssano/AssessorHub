import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node scripts/import-templates.mjs <email> <password>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError) {
  console.error("Auth failed:", authError.message);
  process.exit(1);
}

const records = JSON.parse(readFileSync("scripts/templates-seed.json", "utf-8"));
console.log(`Importing ${records.length} templates...`);

const { error } = await supabase.from("note_templates").insert(records);
if (error) {
  console.error("Import failed:", error.message);
  process.exit(1);
}

console.log("Done.");
process.exit(0);
