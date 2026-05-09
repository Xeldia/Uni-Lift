import { supabaseAdmin } from "../lib/supabase.js";

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function listAllAuthUsers() {
  const users: Array<{ id: string; email?: string | null }> = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const batch = data?.users ?? [];
    if (!batch.length) break;
    users.push(...batch.map((u) => ({ id: u.id, email: u.email })));
    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
}

async function hardDeleteAllAuthUsers() {
  const users = await listAllAuthUsers();
  for (const user of users) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id, false);
    if (error) {
      throw new Error(`deleteUser failed for ${user.email ?? user.id}: ${error.message}`);
    }
  }
  return users.length;
}

async function purgePublicUsers() {
  // NOTE: delete() in PostgREST needs a filter; neq(UUID_ZERO) matches all rows.
  const { error } = await supabaseAdmin
    .from("users")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(`Failed to purge public.users: ${error.message}`);
}

async function main() {
  if (!hasFlag("--yes")) {
    console.error(
      "Refusing to run without --yes. This permanently deletes all Supabase Auth users and public.users rows."
    );
    process.exit(1);
  }

  const deletedAuthUsers = await hardDeleteAllAuthUsers();
  await purgePublicUsers();

  console.log(
    JSON.stringify(
      {
        ok: true,
        deletedAuthUsers,
        purgedPublicUsers: true,
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

