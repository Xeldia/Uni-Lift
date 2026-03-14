import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const inputEmail = process.argv[2]?.trim().toLowerCase();
if (!inputEmail) {
  console.error("Usage: node scripts/check_user_presence.mjs <email>");
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
let found = false;

while (!found) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) {
    console.error("AUTH_QUERY_ERROR", error.message);
    process.exit(2);
  }

  const users = data.users ?? [];
  authUser = users.find((u) => (u.email ?? "").toLowerCase() === inputEmail) ?? null;

  if (authUser || users.length < 1000) {
    found = true;
  } else {
    page += 1;
  }
}

const { data: publicUser, error: publicError } = await supabase
  .from("users")
  .select("id,email,full_name,student_id,created_at")
  .ilike("email", inputEmail)
  .maybeSingle();

console.log(
  JSON.stringify(
    {
      email: inputEmail,
      authUser: authUser
        ? {
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at,
            user_metadata: authUser.user_metadata,
          }
        : null,
      publicUserError: publicError?.message ?? null,
      publicUser: publicUser ?? null,
    },
    null,
    2,
  ),
);
