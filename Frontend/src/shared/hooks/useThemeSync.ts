import { useEffect } from "react";
import { useTheme } from "next-themes";
import { supabase } from "../lib/supabase";

/**
 * Syncs dark/light theme preference with Supabase auth user_metadata.
 * - On mount: reads saved theme from metadata and applies it.
 * - On change: writes new resolved theme back to metadata.
 * Call once in a top-level component that mounts after auth (e.g. Navigation).
 */
export function useThemeSync() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const saved = data.user?.user_metadata?.theme as string | undefined;
      if (saved && saved !== theme) setTheme(saved);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!resolvedTheme) return;
    supabase.auth.updateUser({ data: { theme: resolvedTheme } }).catch(() => {});
  }, [resolvedTheme]);
}
