import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

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

const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
const email = `copilot.test.${timestamp}@example.com`;
const studentId = `TEST-${timestamp}`;
const password = "Test1234!";

console.log("Testing createUser with:", email);

const createResult = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    full_name: "Copilot Test User",
    student_id: studentId,
    university: "CIT-U",
  },
});

if (createResult.error || !createResult.data.user) {
  console.log("CREATE_RESULT", JSON.stringify({
    ok: false,
    error: createResult.error?.message ?? "Unknown create user error",
  }, null, 2));
  process.exit(2);
}

const userId = createResult.data.user.id;

console.log("CREATE_RESULT", JSON.stringify({
  ok: true,
  userId,
  email: createResult.data.user.email,
}, null, 2));

const rowResult = await supabase
  .from("users")
  .select("id,email,full_name,student_id,created_at")
  .eq("id", userId)
  .maybeSingle();

if (rowResult.error) {
  console.log("ROW_RESULT", JSON.stringify({
    ok: false,
    error: rowResult.error.message,
  }, null, 2));
  process.exit(3);
}

console.log("ROW_RESULT", JSON.stringify({
  ok: Boolean(rowResult.data),
  row: rowResult.data ?? null,
}, null, 2));
