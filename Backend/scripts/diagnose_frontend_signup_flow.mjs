import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
dotenv.config({ path: path.join(root, "Frontend", ".env") });
dotenv.config({ path: path.join(root, "Backend", ".env"), override: false });

const anonUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!anonUrl || !anonKey || !serviceUrl || !serviceKey) {
  console.error("Missing required env vars for diagnosis");
  process.exit(1);
}

const anon = createClient(anonUrl, anonKey);
const admin = createClient(serviceUrl, serviceKey);

const stamp = Date.now();
const email = `frontend.diag.${stamp}@cit.edu`;
const password = "DiagTest123!";
const fullName = "Frontend Diag User";
const studentId = `DIAG-${stamp}`;

const signup = await anon.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      student_id: studentId,
      university: "CIT-U",
    },
  },
});

const result = {
  email,
  signupError: signup.error?.message ?? null,
  signupUserId: signup.data.user?.id ?? null,
  signupSession: Boolean(signup.data.session),
};

if (signup.data.user) {
  const upsert = await anon.from("users").upsert(
    {
      id: signup.data.user.id,
      email,
      full_name: fullName,
      student_id: studentId,
      university: "CIT-U",
    },
    { onConflict: "id" }
  );

  result.anonUpsertError = upsert.error?.message ?? null;

  const login = await anon.auth.signInWithPassword({ email, password });
  result.loginError = login.error?.message ?? null;
  result.loginUserId = login.data.user?.id ?? null;
}

let authUser = null;
let page = 1;
while (true) {
  const listed = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (listed.error) {
    result.adminListError = listed.error.message;
    break;
  }
  const users = listed.data.users ?? [];
  const found = users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
  if (found) {
    authUser = found;
    break;
  }
  if (users.length < 1000) break;
  page += 1;
}

const pub = await admin
  .from("users")
  .select("id,email,full_name,student_id,created_at")
  .ilike("email", email)
  .maybeSingle();

result.authUser = authUser
  ? {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at,
      email_confirmed_at: authUser.email_confirmed_at,
    }
  : null;
result.publicUserError = pub.error?.message ?? null;
result.publicUser = pub.data ?? null;

console.log(JSON.stringify(result, null, 2));
