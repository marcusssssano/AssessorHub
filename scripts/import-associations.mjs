import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node scripts/import-associations.mjs <email> <password>");
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

const records = JSON.parse(readFileSync("scratch_import.json", "utf-8"));
console.log(`Importing ${records.length} records...`);

const chunkSize = 200;
let inserted = 0;

for (let i = 0; i < records.length; i += chunkSize) {
  const chunk = records.slice(i, i + chunkSize);
  const { error } = await supabase.from("links").insert(chunk);
  if (error) {
    console.error(`Failed at chunk ${i}:`, error.message);
    process.exit(1);
  }
  inserted += chunk.length;
  console.log(`Inserted ${inserted}/${records.length}`);
}

console.log("Done.");
process.exit(0);
