import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
dotenv.config({ path: path.join(root, "Frontend", ".env") });

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Missing Frontend Supabase env vars");
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const stamp = Date.now();
const email = `profile.pass.verify.${stamp}@cit.edu`;
const initialPassword = "TestPass123!";
const newPassword = "TestPass456!";
const originalName = "Verify User";
const updatedName = "Verify User Updated";
const originalStudentId = `VERIFY-${stamp}`;
const updatedStudentId = `VERIFY-${stamp}-U`;

const result = {
  email,
  signupError: null,
  userId: null,
  profileUpdateError: null,
  profileAfterUpdate: null,
  passwordUpdateError: null,
  oldPasswordLoginError: null,
  newPasswordLoginError: null,
};

const signup = await supabase.auth.signUp({
  email,
  password: initialPassword,
  options: {
    data: {
      full_name: originalName,
      student_id: originalStudentId,
      university: "CIT-U",
    },
  },
});

if (signup.error || !signup.data.user) {
  result.signupError = signup.error?.message ?? "Signup failed";
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

result.userId = signup.data.user.id;

const profileUpdate = await supabase
  .from("users")
  .update({
    full_name: updatedName,
    student_id: updatedStudentId,
  })
  .eq("id", signup.data.user.id)
  .select("id,email,full_name,student_id")
  .maybeSingle();

if (profileUpdate.error) {
  result.profileUpdateError = profileUpdate.error.message;
} else {
  result.profileAfterUpdate = profileUpdate.data;
}

const passwordUpdate = await supabase.auth.updateUser({ password: newPassword });
if (passwordUpdate.error) {
  result.passwordUpdateError = passwordUpdate.error.message;
}

await supabase.auth.signOut();

const oldLogin = await supabase.auth.signInWithPassword({
  email,
  password: initialPassword,
});
result.oldPasswordLoginError = oldLogin.error?.message ?? null;
if (!oldLogin.error) {
  await supabase.auth.signOut();
}

const newLogin = await supabase.auth.signInWithPassword({
  email,
  password: newPassword,
});
result.newPasswordLoginError = newLogin.error?.message ?? null;
if (!newLogin.error) {
  await supabase.auth.signOut();
}

console.log(JSON.stringify(result, null, 2));
