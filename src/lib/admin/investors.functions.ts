import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "./auth.server";
import { investorSchema, nextStatus, type InvestorStatus } from "./schemas";

export const listInvestors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const sb = context.supabase;

    const [invRes, reqRes] = await Promise.all([
      sb
        .from("investors")
        .select("id, full_name, email, phone, pan, amount, tenure_months, status, created_at")
        .order("created_at", { ascending: false }),
      sb
        .from("investment_requests")
        .select("investor_id, amount, status, created_at"),
    ]);
    if (invRes.error) throw new Error(invRes.error.message);
    if (reqRes.error) throw new Error(reqRes.error.message);

    type Agg = { pending_count: number; pending_amount: number; last_request_at: string | null };
    const agg = new Map<string, Agg>();
    for (const r of reqRes.data ?? []) {
      const k = r.investor_id as string;
      const cur = agg.get(k) ?? { pending_count: 0, pending_amount: 0, last_request_at: null };
      if (r.status === "pending") {
        cur.pending_count += 1;
        cur.pending_amount += Number(r.amount);
      }
      const ts = r.created_at as string;
      if (!cur.last_request_at || ts > cur.last_request_at) cur.last_request_at = ts;
      agg.set(k, cur);
    }

    const rows = (invRes.data ?? []).map((i) => {
      const a = agg.get(i.id as string) ?? { pending_count: 0, pending_amount: 0, last_request_at: null };
      return {
        ...i,
        pending_requests_count: a.pending_count,
        pending_amount: a.pending_amount,
        last_request_at: a.last_request_at,
      };
    });

    rows.sort((a, b) => {
      const ka = a.last_request_at ?? a.created_at;
      const kb = b.last_request_at ?? b.created_at;
      return (kb as string).localeCompare(ka as string);
    });

    return rows;
  });

export const getInvestor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const sb = context.supabase;
    const [inv, docs, reqs, payouts] = await Promise.all([
      sb.from("investors").select("*").eq("id", data.id).maybeSingle(),
      sb.from("documents").select("id, kind, serial_no, issued_at").eq("investor_id", data.id).order("issued_at", { ascending: false }),
      sb
        .from("investment_requests")
        .select("id, amount, status, reference_number, transaction_id, created_at, approved_at, notes")
        .eq("investor_id", data.id)
        .order("created_at", { ascending: false }),
      sb
        .from("payouts")
        .select("id, amount, month, status")
        .eq("investor_id", data.id)
        .order("month", { ascending: false }),
    ]);
    if (inv.error) throw new Error(inv.error.message);
    if (!inv.data) throw new Error("Investor not found");

    const requests = (reqs.data ?? []).map((r) => ({
      id: r.id as string,
      amount: Number(r.amount),
      status: r.status as string,
      reference_number: (r.reference_number as string | null) ?? null,
      transaction_id: r.transaction_id as string,
      created_at: r.created_at as string,
      approved_at: (r.approved_at as string | null) ?? null,
      notes: (r.notes as string | null) ?? null,
    }));
    const payoutRows = (payouts.data ?? []).map((p) => ({
      id: p.id as string,
      amount: Number(p.amount),
      month: p.month as string,
      status: p.status as string,
    }));
    const totalInvested = requests.filter((r) => r.status === "approved").reduce((s, r) => s + r.amount, 0);
    const pendingAmount = requests.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0);
    const rejectedAmount = requests.filter((r) => r.status === "rejected").reduce((s, r) => s + r.amount, 0);
    const monthlyReturn = totalInvested * 0.1;
    const maturityTotal = totalInvested * 1.6;
    const lifetimePayouts = payoutRows.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);

    return {
      investor: inv.data,
      documents: docs.data ?? [],
      requests,
      payouts: payoutRows,
      totals: { totalInvested, pendingAmount, rejectedAmount, monthlyReturn, maturityTotal, lifetimePayouts },
    };
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
