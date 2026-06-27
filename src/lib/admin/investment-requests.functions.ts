import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "./auth.server";

export const listInvestmentRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ status: z.enum(["all", "pending", "approved", "rejected"]).default("all") }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    let q = context.supabase
      .from("investment_requests")
      .select("id, investor_id, amount, transaction_id, status, reference_number, created_at, approved_at, notes, investors(full_name, email, phone)")
      .order("created_at", { ascending: false });
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const setInvestmentRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "approved", "rejected"]),
        notes: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const patch = {
      status: data.status,
      notes: data.notes ?? null,
      approved_by: data.status === "approved" ? context.userId : null,
      approved_at: data.status === "approved" ? new Date().toISOString() : null,
    };
    const { data: row, error } = await context.supabase
      .from("investment_requests")
      .update(patch)
      .eq("id", data.id)
      .select("investor_id, amount, status")
      .single();
    if (error) throw new Error(error.message);

    if (data.status === "approved") {
      // promote investor to active and bump aggregate amount
      const { data: inv } = await context.supabase
        .from("investors")
        .select("amount, status")
        .eq("id", row.investor_id)
        .maybeSingle();
      const nextAmount = Number(inv?.amount ?? 0) + Number(row.amount);
      await context.supabase
        .from("investors")
        .update({ amount: nextAmount, status: inv?.status === "inactive" ? "active" : "active" })
        .eq("id", row.investor_id);
    }
    return { ok: true };
  });
