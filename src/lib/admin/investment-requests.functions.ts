import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "./auth.server";

export const listInvestmentRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z.enum(["all", "pending", "approved", "rejected"]).default("all"),
        q: z.string().trim().max(120).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    let query = context.supabase
      .from("investment_requests")
      .select(
        "id, investor_id, amount, transaction_id, status, reference_number, created_at, approved_at, notes, investors(full_name, email, phone)",
      )
      .order("created_at", { ascending: false });
    if (data.status !== "all") query = query.eq("status", data.status);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const filtered = (rows ?? []).filter((r) => {
      if (!data.q) return true;
      const q = data.q.toLowerCase();
      const inv = r.investors as { full_name: string | null; email: string | null } | null;
      return (
        (inv?.full_name ?? "").toLowerCase().includes(q) ||
        (inv?.email ?? "").toLowerCase().includes(q) ||
        (r.transaction_id ?? "").toLowerCase().includes(q) ||
        (r.reference_number ?? "").toLowerCase().includes(q)
      );
    });
    return filtered;
  });

export const getInvestmentRequestDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { data: req, error } = await context.supabase
      .from("investment_requests")
      .select("*, investors(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!req) throw new Error("Investment request not found");
    return req;
  });

export const approveInvestmentRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), notes: z.string().max(2000).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { data: result, error } = await context.supabase.rpc("approve_investment_request", {
      _id: data.id,
      _notes: data.notes,
    });
    if (error) throw new Error(error.message);
    return result as {
      ok: boolean;
      document_id: string;
      serial_no: string;
      reference_number: string;
      monthly_payout: number;
      maturity_total: number;
    };
  });

export const rejectInvestmentRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), notes: z.string().max(2000).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("reject_investment_request", {
      _id: data.id,
      _notes: data.notes,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Legacy compatibility wrapper used by the older Requests page.
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
    if (data.status === "approved") {
      const { error } = await context.supabase.rpc("approve_investment_request", {
        _id: data.id,
        _notes: data.notes,
      });
      if (error) throw new Error(error.message);
    } else if (data.status === "rejected") {
      const { error } = await context.supabase.rpc("reject_investment_request", {
        _id: data.id,
        _notes: data.notes,
      });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("investment_requests")
        .update({ status: "pending", approved_by: null, approved_at: null, notes: data.notes ?? null })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
