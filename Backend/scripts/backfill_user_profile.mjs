import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const inputEmail = process.argv[2]?.trim().toLowerCase();
if (!inputEmail) {
  console.error("Usage: node scripts/backfill_user_profile.mjs <email>");
  process.exit(1);
}

const rootEnvPath = path.join(process.cwd(), ".env");
const repoEnvPath = path.join(process.cwd(), "Backend", ".env");
dotenv.config({ path: rootEnvPath });
dotenv.config({ path: repoEnvPath, override: false });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

let authUser = null;
let page = 1;
let done = false;

while (!done) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) {
    console.error("AUTH_QUERY_ERROR", error.message);
    process.exit(2);
  }

  const users = data.users ?? [];
  authUser = users.find((u) => (u.email ?? "").toLowerCase() === inputEmail) ?? null;

  if (authUser || users.length < 1000) {
    done = true;
  } else {
    page += 1;
  }
}

if (!authUser) {
  console.error("No auth user found for email", inputEmail);
  process.exit(3);
}

const meta = authUser.user_metadata ?? {};

const fullName = typeof meta.full_name === "string" && meta.full_name.trim().length > 0
  ? meta.full_name.trim()
  : "Unknown";

const studentIdFromMeta = typeof meta.student_id === "string" && meta.student_id.trim().length > 0
  ? meta.student_id.trim()
  : `BACKFILL-${authUser.id.slice(0, 8)}`;

const phoneNumber = typeof meta.phone_number === "string" ? meta.phone_number : null;
const university = typeof meta.university === "string" && meta.university.trim().length > 0
  ? meta.university.trim()
  : "CIT-U";

const { data: existingByEmail } = await supabase
  .from("users")
  .select("id,email")
  .ilike("email", inputEmail)
  .maybeSingle();

if (existingByEmail) {
  console.log("Profile already exists in public.users", existingByEmail);
  process.exit(0);
}

const { data, error } = await supabase
  .from("users")
  .upsert(
    {
      id: authUser.id,
      email: authUser.email,
      full_name: fullName,
      student_id: studentIdFromMeta,
      phone_number: phoneNumber,
      university,
    },
    { onConflict: "id" },
  )
  .select("id,email,full_name,student_id,created_at")
  .single();

if (error) {
  console.error("BACKFILL_ERROR", error.message);
  process.exit(4);
}

console.log("BACKFILL_OK", JSON.stringify(data, null, 2));
