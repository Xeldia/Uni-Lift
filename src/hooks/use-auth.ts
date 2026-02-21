import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateRole: (role: UserRole) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          // Mock user login
          const mockUser: User = {
            id: "1",
            fullName: "John Doe",
            email,
            role: email.includes("admin") ? "admin" : "rider",
          };
          
          set({ user: mockUser, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signup: async (name: string, email: string, password: string, role: UserRole) => {
        set({ isLoading: true });
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          const mockUser: User = {
            id: Date.now().toString(),
            fullName: name,
            email,
            role,
          };
          
          set({ user: mockUser, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
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
