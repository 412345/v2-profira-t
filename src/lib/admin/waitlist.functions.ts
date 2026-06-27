import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "./auth.server";

const listSchema = z.object({
  status: z.enum(["all", "pending", "approved", "rejected"]).default("all"),
  source: z.string().default("all"),
  search: z.string().default(""),
});

export const listWaitlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    let q = context.supabase
      .from("waitlist")
      .select("id, name, email, phone, status, source, notes, approved_at, created_at")
      .order("created_at", { ascending: false });
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.source !== "all") q = q.eq("source", data.source);
    if (data.search) {
      const s = data.search.replace(/[%,]/g, "");
      q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const setStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"]),
});

export const setWaitlistStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const patch =
      data.status === "approved"
        ? { status: data.status, approved_by: context.userId, approved_at: new Date().toISOString() }
        : { status: data.status, approved_by: null, approved_at: null };
    const { error } = await context.supabase.from("waitlist").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

