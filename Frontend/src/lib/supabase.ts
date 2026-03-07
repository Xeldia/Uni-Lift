import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Auth helpers ──────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
  const { error: insertError } = await supabase.from("users").upsert(
    {
      id: data.user.id,
      email,
      full_name: fullName,
      student_id: studentId,
      phone_number: phoneNumber ?? null,
      university,
    },
    { onConflict: "id" }
  );

  if (insertError) console.warn("users insert error (trigger may have already run):", insertError.message);

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
