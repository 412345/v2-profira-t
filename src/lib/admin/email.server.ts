// Server-only: send the approval email. Caller must have already authorized the user.
import type { SupabaseClient } from "@supabase/supabase-js";

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? "");
}

function genTempCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendApprovalEmailForWaitlistId(
  supabaseAdmin: SupabaseClient,
  waitlistId: string,
): Promise<{ status: "sent" }> {
  const { data: row, error: rowErr } = await supabaseAdmin
    .from("waitlist")
    .select("id, name, email")
    .eq("id", waitlistId)
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
    return { status: "sent" };
  } catch (err) {
    await supabaseAdmin
      .from("waitlist")
      .update({ resend_email_status: "failed" })
      .eq("id", row.id);
    throw err instanceof Error ? err : new Error("Email send failed");
  }
}
