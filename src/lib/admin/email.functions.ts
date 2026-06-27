import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "./auth.server";

const sendSchema = z.object({
  waitlistId: z.string().uuid(),
});

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

function genTempCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const sendApprovalEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error: rowErr } = await supabaseAdmin
      .from("waitlist")
      .select("id, name, email")
      .eq("id", data.waitlistId)
      .maybeSingle();
    if (rowErr) throw new Error(rowErr.message);
    if (!row) throw new Error("Waitlist entry not found");

    const { data: tpl, error: tplErr } = await supabaseAdmin
      .from("email_templates")
      .select("subject, html_body")
      .eq("name", "approval_notification")
      .maybeSingle();
    if (tplErr) throw new Error(tplErr.message);
    if (!tpl) throw new Error("Email template 'approval_notification' missing");

    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress =
      process.env.RESEND_FROM_ADDRESS || "PROFIRA <onboarding@resend.dev>";

    if (!apiKey) {
      await supabaseAdmin
        .from("waitlist")
        .update({ resend_email_status: "failed" })
        .eq("id", row.id);
      throw new Error("RESEND_API_KEY is not configured");
    }

    const signinUrl =
      (process.env.PUBLIC_SITE_URL || "https://profira.com").replace(/\/$/, "") +
      "/signin";
    const tempCode = genTempCode();
    const html = renderTemplate(tpl.html_body, {
      name: row.name ?? "Investor",
      tempCode,
      signinUrl,
    });
    const subject = renderTemplate(tpl.subject, { name: row.name ?? "Investor" });

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [row.email],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        await supabaseAdmin
          .from("waitlist")
          .update({ resend_email_status: "failed" })
          .eq("id", row.id);
        throw new Error(`Resend ${res.status}: ${text.slice(0, 200)}`);
      }
      await supabaseAdmin
        .from("waitlist")
        .update({
          resend_email_status: "sent",
          resend_email_sent_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      return { ok: true as const, status: "sent" as const };
    } catch (err) {
      await supabaseAdmin
        .from("waitlist")
        .update({ resend_email_status: "failed" })
        .eq("id", row.id);
      throw err instanceof Error ? err : new Error("Email send failed");
    }
  });
