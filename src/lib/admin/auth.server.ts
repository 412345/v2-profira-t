// Server-only helper: assert the calling user has admin or staff role.
import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertStaff(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const ok = (data ?? []).some((r) => r.role === "admin" || r.role === "staff");
  if (!ok) throw new Error("Forbidden: requires admin or staff role");
  return data.map((r) => r.role) as Array<"admin" | "staff">;
}
