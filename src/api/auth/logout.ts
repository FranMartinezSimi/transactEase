"use server";

import { createClient } from "@/lib/supabase/server";
import { AuthError } from "@supabase/supabase-js";

export async function logout() {
  const supabase = await createClient();
  const { error }: { error: AuthError | null } = await supabase.auth.signOut();
  if (error) {
    console.error("[Logout API] Error:", error);
    return { success: false, error: error.message as string };
  }
  return { success: true, message: "Logged out successfully" };
}
