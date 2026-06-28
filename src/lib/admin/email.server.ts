// Server-only: send the branded waitlist approval email via Resend.
import type { SupabaseClient } from "@supabase/supabase-js";

const FROM_DEFAULT = "Profira Trade <onboarding@mail.profiratrade.in>";
const SIGNUP_BASE = "https://www.profiratrade.in/signup";
const SUPPORT_EMAIL = "support@profiratrade.in";

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmail(opts: { name: string; email: string; phone: string; signupUrl: string }) {
  const { name, email, phone, signupUrl } = opts;
  const firstName = (name || "Investor").split(" ")[0];

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>Welcome to Profira Trade</title>
  </head>
  <body style="margin:0;padding:0;background:#F4F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F1014;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Your Profira Trade profile is approved. Create your account and start investing.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #E6E7EB;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #EEF0F3;">
                <table role="presentation" width="100%"><tr>
                  <td style="font-size:18px;font-weight:700;letter-spacing:2px;color:#D61F3A;">PROFIRA&nbsp;TRADE</td>
                  <td align="right" style="font-size:11px;letter-spacing:1.5px;color:#6B7280;text-transform:uppercase;">Private Investment Desk</td>
                </tr></table>
              </td>
            </tr>

            <tr>
              <td style="padding:36px 32px 8px 32px;">
                <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.25;color:#0F1014;font-weight:700;">
                  Welcome aboard, ${esc(firstName)}.
                </h1>
                <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;color:#3F4350;">
                  Your application has been reviewed and <strong style="color:#0F1014;">approved</strong>. You're cleared to create your secure Profira Trade account and begin deploying capital across our managed forex &amp; commodities strategies.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 32px 16px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFB;border:1px solid #ECEDF1;border-radius:10px;">
                  <tr><td style="padding:18px 20px;">
                    <div style="font-size:11px;letter-spacing:1.5px;color:#6B7280;text-transform:uppercase;margin-bottom:10px;">Your registered profile</div>
                    <table role="presentation" width="100%" style="font-size:14px;color:#0F1014;">
                      <tr><td style="padding:4px 0;color:#6B7280;width:120px;">Full name</td><td style="padding:4px 0;font-weight:600;">${esc(name)}</td></tr>
                      <tr><td style="padding:4px 0;color:#6B7280;">Email</td><td style="padding:4px 0;font-weight:600;">${esc(email)}</td></tr>
                      <tr><td style="padding:4px 0;color:#6B7280;">Phone</td><td style="padding:4px 0;font-weight:600;">${esc(phone || "—")}</td></tr>
                    </table>
                  </td></tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 32px 8px 32px;">
                <div style="font-size:11px;letter-spacing:1.5px;color:#6B7280;text-transform:uppercase;margin-bottom:10px;">Next steps</div>
                <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:#3F4350;">
                  <li>Click the <strong>Create Account</strong> button below.</li>
                  <li>Set a strong, secure password for your investor login.</li>
                  <li>Sign in to your Profira Trade dashboard.</li>
                  <li>Deploy your capital and track performance in real time.</li>
                </ol>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:28px 32px 12px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr><td align="center" bgcolor="#D61F3A" style="border-radius:8px;">
                    <a href="${esc(signupUrl)}" target="_blank"
                       style="display:inline-block;padding:16px 38px;font-size:15px;font-weight:700;letter-spacing:1.5px;color:#FFFFFF;text-decoration:none;border-radius:8px;background:#D61F3A;">
                      CREATE ACCOUNT
                    </a>
                  </td></tr>
                </table>
                <p style="margin:14px 0 0 0;font-size:12px;color:#6B7280;">
                  Or paste this link into your browser:<br />
                  <a href="${esc(signupUrl)}" style="color:#D61F3A;word-break:break-all;">${esc(signupUrl)}</a>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 32px 28px 32px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6B7280;">
                  For security, this invitation is tied to <strong style="color:#3F4350;">${esc(email)}</strong>. If anything looks wrong, reply to this email or contact us at
                  <a href="mailto:${esc(SUPPORT_EMAIL)}" style="color:#D61F3A;text-decoration:none;">${esc(SUPPORT_EMAIL)}</a>.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 32px;background:#0F1014;color:#9CA0AB;font-size:11px;line-height:1.6;">
                © ${new Date().getFullYear()} Profira Trade · Private Investment Desk<br />
                Investments are subject to market risk. Please review all agreements before deploying capital.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `Welcome aboard, ${firstName}.`,
    ``,
    `Your Profira Trade application has been approved.`,
    ``,
    `Your registered profile:`,
    `  Name:  ${name}`,
    `  Email: ${email}`,
    `  Phone: ${phone || "—"}`,
    ``,
    `Next steps:`,
    `  1. Open the link below to create your account`,
    `  2. Set a secure password`,
    `  3. Sign in to your Profira Trade dashboard`,
    `  4. Deploy your capital`,
    ``,
    `Create your account: ${signupUrl}`,
    ``,
    `Questions? ${SUPPORT_EMAIL}`,
    `© ${new Date().getFullYear()} Profira Trade`,
  ].join("\n");

  return { html, text };
}

export async function sendApprovalEmailForWaitlistId(
  supabaseAdmin: SupabaseClient,
  waitlistId: string,
): Promise<{ status: "sent" }> {
  const { data: row, error: rowErr } = await supabaseAdmin
    .from("waitlist")
    .select("id, name, email, phone")
    .eq("id", waitlistId)
    .maybeSingle();
  if (rowErr) throw new Error(rowErr.message);
  if (!row) throw new Error("Waitlist entry not found");

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_ADDRESS || FROM_DEFAULT;

  if (!apiKey) {
    await supabaseAdmin
      .from("waitlist")
      .update({ resend_email_status: "failed" })
      .eq("id", row.id);
    throw new Error("RESEND_API_KEY is not configured");
  }

  const recipient = String(row.email);
  const signupUrl = `${SIGNUP_BASE}?email=${encodeURIComponent(recipient)}`;
  const { html, text } = buildEmail({
    name: row.name ?? "Investor",
    email: recipient,
    phone: row.phone ?? "",
    signupUrl,
  });
  const subject = `${row.name ? row.name.split(" ")[0] + ", y" : "Y"}our Profira Trade account is approved`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [recipient],
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      await supabaseAdmin
        .from("waitlist")
        .update({ resend_email_status: "failed" })
        .eq("id", row.id);
      throw new Error(`Resend ${res.status}: ${body.slice(0, 240)}`);
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
