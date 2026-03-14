import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

type UserProfileWriteInput = {
  id: string;
  email: string;
  full_name: string;
  student_id: string;
  phone_number?: string | null;
  university?: string;
  role?: string;
};

export async function saveUserProfile(input: UserProfileWriteInput) {
  const {
    id,
    email,
    full_name,
    student_id,
    phone_number = null,
    university = "CIT-U",
    role,
  } = input;

  const payload: Record<string, unknown> = {
    email,
    full_name,
    student_id,
    phone_number,
    university,
  };

  if (role) {
    payload.role = role;
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from("users")
    .update(payload)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!updatedRow) {
    const { error: insertError } = await supabase
      .from("users")
      .insert({ id, ...payload });

    if (insertError) {
      throw insertError;
    }
  }
}

async function ensureProfileRow(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }) {
  const metadata = user.user_metadata ?? {};
  const fullName = typeof metadata.full_name === "string" && metadata.full_name.trim().length > 0
    ? metadata.full_name.trim()
    : (user.email?.split("@")[0] ?? "Unknown");
  const studentId = typeof metadata.student_id === "string" && metadata.student_id.trim().length > 0
    ? metadata.student_id.trim()
    : `TEMP-${user.id.slice(0, 8)}`;
  const phoneNumber = typeof metadata.phone_number === "string" ? metadata.phone_number : null;
  const university = typeof metadata.university === "string" && metadata.university.trim().length > 0
    ? metadata.university.trim()
    : "CIT-U";

  try {
    await saveUserProfile({
      id: user.id,
      email: user.email ?? "",
      full_name: fullName,
      student_id: studentId,
      phone_number: phoneNumber,
      university,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown profile sync error";
    console.warn("users profile sync failed during auth:", errorMessage);
  }
}

// ─── Auth helpers ──────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (!error && data?.user) {
    await ensureProfileRow(data.user);
  }

  return { data, error };
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  studentId: string,
  phoneNumber?: string,
  university = "CIT-U"
) {
  // 1. Create the Supabase Auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        student_id: studentId,
        phone_number: phoneNumber ?? null,
        university,
      },
    },
  });

  if (error || !data.user) return { data, error };

  // 2. Insert into public.users — the DB trigger also handles this,
  //    but we do it explicitly too so data is immediately available.
  await ensureProfileRow({
    id: data.user.id,
    email: data.user.email,
    user_metadata: {
      ...(data.user.user_metadata ?? {}),
      full_name: fullName,
      student_id: studentId,
      phone_number: phoneNumber ?? null,
      university,
    },
  });

  return { data, error: null };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
