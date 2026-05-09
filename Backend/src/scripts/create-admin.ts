import { supabaseAdmin } from "../lib/supabase.js";

function pickArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

const email = pickArg("email") ?? process.env.ADMIN_EMAIL ?? "admin@unilift.local";
const password = pickArg("password") ?? process.env.ADMIN_PASSWORD ?? "pass123";
const fullName = pickArg("name") ?? process.env.ADMIN_NAME ?? "Admin";

// Must be unique because `public.users.student_id` is UNIQUE.
const studentId =
  pickArg("studentId") ??
  process.env.ADMIN_STUDENT_ID ??
  `ADMIN-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}`;

async function findUserIdByEmail(targetEmail: string): Promise<string | null> {
  // Supabase admin API may not expose a direct "getUserByEmail" in all setups,
  // so we scan the first page of users which is enough for this project.
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw new Error(`listUsers failed: ${error.message}`);
  const user = (data?.users ?? []).find(
    (u) => (u.email ?? "").toLowerCase() === targetEmail.toLowerCase()
  );
  return user?.id ?? null;
}

async function main() {
  let userId: string | null = null;

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      student_id: studentId,
      university: "CIT-U",
      phone_number: "",
    },
  });

  if (created.error) {
    // If user already exists, we "promote" it to admin + (optionally) reset password.
    const msg = created.error.message.toLowerCase();
    if (msg.includes("already been registered") || msg.includes("already exists")) {
      userId = await findUserIdByEmail(email);
      if (!userId) throw new Error(`User exists but could not be found by email: ${email}`);

      const updated = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password,
        user_metadata: {
          full_name: fullName,
          student_id: studentId,
          university: "CIT-U",
          phone_number: "",
        },
      });
      if (updated.error) {
        throw new Error(`updateUserById failed: ${updated.error.message}`);
      }
    } else {
      throw new Error(`createUser failed: ${created.error.message}`);
    }
  } else {
    userId = created.data?.user?.id ?? null;
  }

  if (!userId) throw new Error("Failed to resolve user id");

  // Ensure DB role is 'admin' (frontend gate checks .toUpperCase() === "ADMIN").
  const { error: roleError } = await supabaseAdmin
    .from("users")
    .update({
      role: "admin",
      status: "ACTIVE",
      is_verified: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (roleError) {
    throw new Error(`Failed to set role=admin: ${roleError.message}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        email,
        password,
        userId,
        studentId,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

