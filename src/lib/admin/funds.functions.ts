import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "./auth.server";
import { fundSchema } from "./schemas";

export const listFunds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("funds")
      .select("id, name, aum, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createFund = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => fundSchema.parse(d))
  .handler(async ({ data, context }) => {
    const roles = await assertStaff(context.supabase, context.userId);
    if (!roles.includes("admin")) throw new Error("Forbidden: admin only");
    const { error } = await context.supabase.from("funds").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
