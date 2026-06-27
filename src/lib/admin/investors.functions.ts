import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "./auth.server";
import { investorSchema, nextStatus, type InvestorStatus } from "./schemas";

export const listInvestors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("investors")
      .select("id, full_name, email, phone, pan, amount, tenure_months, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getInvestor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const sb = context.supabase;
    const [inv, docs] = await Promise.all([
      sb.from("investors").select("*").eq("id", data.id).maybeSingle(),
      sb.from("documents").select("id, kind, serial_no, issued_at").eq("investor_id", data.id).order("issued_at", { ascending: false }),
    ]);
    if (inv.error) throw new Error(inv.error.message);
    if (!inv.data) throw new Error("Investor not found");
    return { investor: inv.data, documents: docs.data ?? [] };
  });

export const createInvestor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => investorSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { data: row, error } = await context.supabase
      .from("investors")
      .insert({
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        pan: data.pan,
        amount: data.amount,
        tenure_months: data.tenure_months,
        bank_account: data.bank_account,
        ifsc: data.ifsc,
        notes: data.notes || null,
        status: "pending",
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const updateInvestorStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      action: z.enum(["approve", "activate", "deactivate"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const sb = context.supabase;
    const { data: cur, error: e1 } = await sb.from("investors").select("status").eq("id", data.id).maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!cur) throw new Error("Not found");
    const ns = nextStatus(cur.status as InvestorStatus, data.action);
    if (!ns) throw new Error(`Cannot ${data.action} an investor that is ${cur.status}`);
    const { error } = await sb.from("investors").update({ status: ns }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { status: ns };
  });

export const updateInvestorNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), notes: z.string().max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { error } = await context.supabase.from("investors").update({ notes: data.notes }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const ensureInvestorDocuments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const sb = context.supabase;
    const { data: existing } = await sb.from("documents").select("kind").eq("investor_id", data.id);
    const have = new Set((existing ?? []).map((d) => d.kind));
    const toCreate: Array<{ investor_id: string; kind: "agreement" | "invoice"; serial_no: string; payload: Record<string, never> }> = [];
    const ts = Date.now().toString(36).toUpperCase();
    if (!have.has("agreement")) toCreate.push({ investor_id: data.id, kind: "agreement", serial_no: `AGR-${ts}`, payload: {} });
    if (!have.has("invoice")) toCreate.push({ investor_id: data.id, kind: "invoice", serial_no: `INV-${ts}`, payload: {} });
    if (toCreate.length) {
      const { error } = await sb.from("documents").insert(toCreate as never);
      if (error) throw new Error(error.message);
    }
    return { created: toCreate.length };
  });
