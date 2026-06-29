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

// ---------------------------------------------------------------------------
// Investment approval / payment confirmation email
// ---------------------------------------------------------------------------

const PORTFOLIO_URL = "https://www.profiratrade.in/portfolio";

function fmtINR(n: number) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `₹${n.toLocaleString("en-IN")}`;
  }
}

function fmtIST(d: Date) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function buildConfirmationEmail(opts: {
  name: string;
  email: string;
  amount: number;
  transactionId: string;
  referenceNumber: string;
  confirmedAt: Date;
  monthlyPayout: number;
  maturityTotal: number;
}) {
  const {
    name, email, amount, transactionId, referenceNumber,
    confirmedAt, monthlyPayout, maturityTotal,
  } = opts;
  const firstName = (name || "Investor").split(" ")[0];
  const amountStr = fmtINR(amount);
  const monthlyStr = fmtINR(monthlyPayout);
  const maturityStr = fmtINR(maturityTotal);
  const confirmedStr = fmtIST(confirmedAt);

  const tick = `<span style="display:inline-block;width:16px;height:16px;line-height:16px;text-align:center;border-radius:50%;background:#15803D;color:#fff;font-size:10px;font-weight:700;margin-right:8px;">&#10003;</span>`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light only" />
    <title>Investment Confirmed — Profira Trade</title>
  </head>
  <body style="margin:0;padding:0;background:#F4F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F1014;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${esc(firstName)}, your ${esc(amountStr)} investment is confirmed and active.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F7;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border:1px solid #E6E7EB;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #EEF0F3;">
              <table role="presentation" width="100%"><tr>
                <td style="font-size:18px;font-weight:700;letter-spacing:2px;color:#D61F3A;">PROFIRA&nbsp;TRADE</td>
                <td align="right" style="font-size:11px;letter-spacing:1.5px;color:#6B7280;text-transform:uppercase;">Investment Confirmation</td>
              </tr></table>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px 8px 32px;">
              <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.25;color:#0F1014;font-weight:700;">
                Congratulations, ${esc(firstName)} &mdash; your capital is now deployed.
              </h1>
              <p style="margin:0 0 8px 0;font-size:15px;line-height:1.6;color:#3F4350;">
                We're delighted to confirm that your investment of <strong style="color:#0F1014;">${esc(amountStr)}</strong> has been received, reconciled, and activated on the Profira Trade managed desk. Your principal is live in our forex &amp; commodities strategies, and the first monthly payout is now on schedule.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px 8px 32px;">
              <div style="font-size:11px;letter-spacing:1.5px;color:#6B7280;text-transform:uppercase;margin-bottom:10px;">Payment invoice</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAFB;border:1px solid #ECEDF1;border-radius:10px;">
                <tr><td style="padding:18px 20px;">
                  <table role="presentation" width="100%" style="font-size:14px;color:#0F1014;">
                    <tr><td style="padding:5px 0;color:#6B7280;width:170px;">Reference No.</td><td style="padding:5px 0;font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-weight:600;color:#D61F3A;">${esc(referenceNumber)}</td></tr>
                    <tr><td style="padding:5px 0;color:#6B7280;">Transaction / UTR ID</td><td style="padding:5px 0;font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-weight:600;">${esc(transactionId)}</td></tr>
                    <tr><td style="padding:5px 0;color:#6B7280;">Amount confirmed</td><td style="padding:5px 0;font-weight:700;font-size:15px;">${esc(amountStr)}</td></tr>
                    <tr><td style="padding:5px 0;color:#6B7280;">Confirmed on</td><td style="padding:5px 0;font-weight:600;">${esc(confirmedStr)} IST</td></tr>
                    <tr><td style="padding:5px 0;color:#6B7280;">Tenure</td><td style="padding:5px 0;font-weight:600;">6 months &middot; 10% monthly payout</td></tr>
                    <tr><td style="padding:5px 0;color:#6B7280;">Projected monthly payout</td><td style="padding:5px 0;font-weight:600;">${esc(monthlyStr)}</td></tr>
                    <tr><td style="padding:5px 0;color:#6B7280;">Maturity total (6m)</td><td style="padding:5px 0;font-weight:700;">${esc(maturityStr)}</td></tr>
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 32px 8px 32px;">
              <div style="font-size:11px;letter-spacing:1.5px;color:#6B7280;text-transform:uppercase;margin-bottom:12px;">Verification checklist</div>
              <table role="presentation" width="100%" style="font-size:14px;line-height:1.7;color:#3F4350;">
                <tr><td style="padding:3px 0;">${tick}KYC &amp; banking details verified</td></tr>
                <tr><td style="padding:3px 0;">${tick}Investment agreement &amp; terms accepted</td></tr>
                <tr><td style="padding:3px 0;">${tick}Payment received and reconciled against UTR</td></tr>
                <tr><td style="padding:3px 0;">${tick}Investment activated on the managed desk</td></tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 32px 12px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr><td align="center" bgcolor="#D61F3A" style="border-radius:8px;">
                  <a href="${esc(PORTFOLIO_URL)}" target="_blank"
                     style="display:inline-block;padding:16px 38px;font-size:15px;font-weight:700;letter-spacing:1.5px;color:#FFFFFF;text-decoration:none;border-radius:8px;background:#D61F3A;">
                    VIEW PORTFOLIO
                  </a>
                </td></tr>
              </table>
              <p style="margin:14px 0 0 0;font-size:12px;color:#6B7280;">
                Your portfolio and dashboard have been updated. Sign in any time to track real-time performance, monthly payouts, and download your agreement.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 32px 28px 32px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#6B7280;">
                This confirmation is tied to <strong style="color:#3F4350;">${esc(email)}</strong>. Please retain this email as your official receipt. For any questions, reply to this message or write to
                <a href="mailto:${esc(SUPPORT_EMAIL)}" style="color:#D61F3A;text-decoration:none;">${esc(SUPPORT_EMAIL)}</a>.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 32px;background:#0F1014;color:#9CA0AB;font-size:11px;line-height:1.6;">
              © ${new Date().getFullYear()} Profira Trade · Private Investment Desk<br />
              Investments are subject to market risk. Past performance is not indicative of future returns.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    `Congratulations, ${firstName}.`,
    ``,
    `Your investment of ${amountStr} has been received, reconciled, and is now active on the Profira Trade managed desk.`,
    ``,
    `Payment invoice:`,
    `  Reference No.:          ${referenceNumber}`,
    `  Transaction / UTR ID:   ${transactionId}`,
    `  Amount confirmed:       ${amountStr}`,
    `  Confirmed on:           ${confirmedStr} IST`,
    `  Tenure:                 6 months (10% monthly payout)`,
    `  Monthly payout (est.):  ${monthlyStr}`,
    `  Maturity total (6m):    ${maturityStr}`,
    ``,
    `Verification checklist:`,
    `  [x] KYC & banking details verified`,
    `  [x] Investment agreement & terms accepted`,
    `  [x] Payment received and reconciled against UTR`,
    `  [x] Investment activated on the managed desk`,
    ``,
    `View your portfolio: ${PORTFOLIO_URL}`,
    ``,
    `Your portfolio and dashboard have been updated. Sign in any time to track real-time performance, monthly payouts, and download your agreement.`,
    ``,
    `Questions? ${SUPPORT_EMAIL}`,
    `© ${new Date().getFullYear()} Profira Trade`,
  ].join("\n");

  return { html, text };
}

export async function sendInvestmentConfirmationForRequestId(
  supabase: SupabaseClient,
  requestId: string,
): Promise<{ status: "sent" }> {
  const { data: row, error: rowErr } = await supabase
    .from("investment_requests")
    .select("id, amount, transaction_id, reference_number, approved_at, investors(full_name, email)")
    .eq("id", requestId)
    .maybeSingle();
  if (rowErr) throw new Error(rowErr.message);
  if (!row) throw new Error("Investment request not found");

  const inv = (row as unknown as { investors: { full_name: string | null; email: string | null } | null }).investors;
  const recipient = inv?.email ? String(inv.email) : null;
  if (!recipient) throw new Error("Investor email not found");

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.RESEND_FROM_ADDRESS || FROM_DEFAULT;

  if (!apiKey) {
    await supabase
      .from("investment_requests")
      .update({ confirmation_email_status: "failed" })
      .eq("id", row.id);
    throw new Error("RESEND_API_KEY is not configured");
  }

  const amount = Number(row.amount ?? 0);
  const monthly = Math.round(amount * 0.1 * 100) / 100;
  const maturity = Math.round((amount + amount * 0.1 * 6) * 100) / 100;
  const confirmedAt = row.approved_at ? new Date(row.approved_at) : new Date();

  const { html, text } = buildConfirmationEmail({
    name: inv?.full_name ?? "Investor",
    email: recipient,
    amount,
    transactionId: String(row.transaction_id ?? ""),
    referenceNumber: String(row.reference_number ?? ""),
    confirmedAt,
    monthlyPayout: monthly,
    maturityTotal: maturity,
  });

  const firstName = (inv?.full_name ?? "").split(" ")[0];
  const subject = `${firstName ? firstName + ", y" : "Y"}our investment of ${fmtINR(amount)} is confirmed`;

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
      await supabase
        .from("investment_requests")
        .update({ confirmation_email_status: "failed" })
        .eq("id", row.id);
      throw new Error(`Resend ${res.status}: ${body.slice(0, 240)}`);
    }
    await supabase
      .from("investment_requests")
      .update({
        confirmation_email_status: "sent",
        confirmation_email_sent_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    return { status: "sent" };
  } catch (err) {
    await supabase
      .from("investment_requests")
      .update({ confirmation_email_status: "failed" })
      .eq("id", row.id);
    throw err instanceof Error ? err : new Error("Email send failed");
  }
}
