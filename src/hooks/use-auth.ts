import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

export type UserRole = "rider" | "driver" | "admin";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, _password: string) => Promise<void>;
  signup: (name: string, email: string, _password: string, role: UserRole, studentId: string) => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (role: UserRole) => void;
}

const normalizeRole = (role: string | null | undefined, email: string): UserRole => {
  if (role === "admin") return "admin";
  if (role === "driver") return "driver";
  if (email.includes("admin")) return "admin";
  return "rider";
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      login: async (email: string, _password: string) => {
        set({ isLoading: true });
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: _password,
          });

          if (signInError) {
            throw signInError;
          }

          if (!signInData.user) {
            throw new Error("Login did not return a user");
          }

          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("id, email, full_name, role, phone_number")
            .eq("id", signInData.user.id)
            .maybeSingle();

          if (profileError) {
            throw profileError;
          }

          const fullNameFromMeta =
            typeof signInData.user.user_metadata?.full_name === "string"
              ? signInData.user.user_metadata.full_name
              : email.split("@")[0];
          const studentIdFromMeta =
            typeof signInData.user.user_metadata?.student_id === "string"
              ? signInData.user.user_metadata.student_id
              : `TEMP-${signInData.user.id.slice(0, 8)}`;
          const roleFromMeta =
            typeof signInData.user.user_metadata?.role === "string"
              ? signInData.user.user_metadata.role
              : "rider";

          let ensuredProfile = profile;

          if (!ensuredProfile) {
            const { data: insertedProfile, error: insertError } = await supabase
              .from("users")
              .upsert(
                {
                  id: signInData.user.id,
                  email,
                  full_name: fullNameFromMeta,
                  student_id: studentIdFromMeta,
                  role: roleFromMeta,
                },
                { onConflict: "id" }
              )
              .select("id, email, full_name, role, phone_number")
              .single();

            if (insertError) {
              throw insertError;
            }

            ensuredProfile = insertedProfile;
          }

          set({
            user: {
              id: ensuredProfile.id,
              fullName: ensuredProfile.full_name,
              email: ensuredProfile.email,
              role: normalizeRole(ensuredProfile.role, ensuredProfile.email),
              phone: ensuredProfile.phone_number ?? undefined,
            },
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (name: string, email: string, _password: string, role: UserRole, studentId: string) => {
        set({ isLoading: true });
        try {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: _password,
            options: {
              data: {
                full_name: name,
                student_id: studentId,
                role,
              },
            },
          });

          if (signUpError) {
            throw signUpError;
          }

          if (!signUpData.user) {
            throw new Error("Signup did not return a user");
          }

          const { data: insertedProfile, error: insertError } = await supabase
            .from("users")
            .upsert(
              {
                id: signUpData.user.id,
                email,
                full_name: name,
                student_id: studentId,
                role,
              },
              { onConflict: "id" }
            )
            .select("id, email, full_name, role, phone_number")
            .single();

          if (insertError) {
            throw insertError;
          }

          set({
            user: {
              id: insertedProfile.id,
              fullName: insertedProfile.full_name,
              email: insertedProfile.email,
              role: normalizeRole(insertedProfile.role, insertedProfile.email),
              phone: insertedProfile.phone_number ?? undefined,
            },
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null });
      },

      updateRole: (role: UserRole) => {
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
        }));
      },
    }),
    {
      name: "uni-lift-auth",
    }
  )
);
