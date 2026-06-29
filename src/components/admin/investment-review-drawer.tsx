import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Loader2, FileText, User, Banknote, Calculator, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  getInvestmentRequestDetail,
  approveInvestmentRequest,
  rejectInvestmentRequest,
} from "@/lib/admin/investment-requests.functions";
import { sendInvestmentConfirmationEmail } from "@/lib/admin/email.functions";
import { fmtINR, fmtDateIST } from "@/lib/admin/format";

function mask(value: string | null | undefined, keep = 4): string {
  if (!value) return "—";
  if (value.length <= keep) return value;
  return "•".repeat(Math.max(4, value.length - keep)) + value.slice(-keep);
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#1F2024] bg-[#0B0C10] p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#B8B8B8]">
        <span className="text-[#D61F3A]">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs text-[#B8B8B8]">{label}</span>
      <span className={`text-sm text-white ${mono ? "font-mono" : ""}`}>{value ?? "—"}</span>
    </div>
  );
}

export function InvestmentReviewDrawer({
  id,
  open,
  onOpenChange,
}: {
  id: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const detailFn = useServerFn(getInvestmentRequestDetail);
  const approveFn = useServerFn(approveInvestmentRequest);
  const rejectFn = useServerFn(rejectInvestmentRequest);
  const confirmEmailFn = useServerFn(sendInvestmentConfirmationEmail);
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-invreq-detail", id],
    queryFn: () => detailFn({ data: { id: id! } }),
    enabled: Boolean(id && open),
  });

  useEffect(() => {
    if (data?.notes) setNotes(data.notes);
    else setNotes("");
  }, [data?.id, data?.notes]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-invreqs"] });
    qc.invalidateQueries({ queryKey: ["admin-invreq-detail"] });
    qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    qc.invalidateQueries({ queryKey: ["admin", "investors"] });
  };

  const approve = useMutation({
    mutationFn: approveFn,
    onSuccess: (r) => {
      toast.success(`Approved — agreement ${r.serial_no}`);
      invalidate();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const reject = useMutation({
    mutationFn: rejectFn,
    onSuccess: () => {
      toast.success("Request rejected");
      invalidate();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const sendConfirm = useMutation({
    mutationFn: (requestId: string) => confirmEmailFn({ data: { requestId } }),
    onSuccess: () => {
      toast.success("Confirmation email sent");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Email send failed"),
  });

  const inv = (data as unknown as { investors: Record<string, unknown> | null } | null)?.investors as
    | {
        full_name: string | null;
        email: string | null;
        phone: string | null;
        gov_id_type: string | null;
        gov_id_number: string | null;
        aadhaar_name: string | null;
        bank_name: string | null;
        ifsc: string | null;
        bank_account: string | null;
        account_holder_name: string | null;
      }
    | undefined;

  const amount = Number(data?.amount ?? 0);
  const monthly = Math.round(amount * 0.1 * 100) / 100;
  const maturity = Math.round((amount + amount * 0.1 * 6) * 100) / 100;
  const isPending = data?.status === "pending";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l p-0 sm:max-w-[600px]"
        style={{ background: "#14151A", borderColor: "#1F2024" }}
      >
        <SheetHeader className="border-b border-[#1F2024] p-5">
          <SheetTitle className="text-white">Investment Review</SheetTitle>
          {data && (
            <p className="font-mono text-xs text-[#D61F3A]">{data.reference_number}</p>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-[#B8B8B8]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-5 text-sm text-red-400">{(error as Error).message}</div>
        ) : data ? (
          <div className="space-y-4 p-5">
            <Section icon={<User className="h-4 w-4" />} title="Investor Profile">
              <Field label="Full name" value={inv?.full_name} />
              <Field label="Email" value={inv?.email} />
              <Field label="Phone" value={inv?.phone} mono />
              <Field label="ID type" value={inv?.gov_id_type ? inv.gov_id_type.toUpperCase() : null} />
              <Field label="ID number" value={mask(inv?.gov_id_number)} mono />
              <Field label="Name on ID" value={inv?.aadhaar_name} />
            </Section>

            <Section icon={<Banknote className="h-4 w-4" />} title="Banking">
              <Field label="Bank" value={inv?.bank_name} />
              <Field label="IFSC" value={inv?.ifsc} mono />
              <Field label="Account" value={mask(inv?.bank_account)} mono />
              <Field label="Account holder" value={inv?.account_holder_name} />
            </Section>

            <Section icon={<Calculator className="h-4 w-4" />} title="Allocation & Yield">
              <Field label="Principal" value={fmtINR(amount)} />
              <Field label="Monthly payout (10%)" value={fmtINR(monthly)} />
              <Field label="Maturity total (6m)" value={fmtINR(maturity)} />
              <Field label="Tenure" value="6 months" />
              <Field label="UTR" value={data.transaction_id} mono />
              <Field label="Submitted" value={fmtDateIST(data.created_at)} />
            </Section>

            <Section icon={<FileText className="h-4 w-4" />} title="Administrative Notes">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal verification notes…"
                rows={4}
                className="border-[#1F2024] bg-[#07080a] text-white"
                disabled={!isPending}
              />
            </Section>

            {isPending ? (
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={() => approve.mutate({ data: { id: data.id, notes: notes || undefined } })}
                  disabled={approve.isPending || reject.isPending}
                  className="bg-[#D61F3A] text-white hover:bg-[#B8172F]"
                >
                  {approve.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Approve & Generate Documents
                </Button>
                <Button
                  variant="outline"
                  onClick={() => reject.mutate({ data: { id: data.id, notes: notes || undefined } })}
                  disabled={approve.isPending || reject.isPending}
                  className="border-red-500/60 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  {reject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reject Transaction Intake
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#1F2024] bg-[#0B0C10] p-3 text-xs text-[#B8B8B8]">
                  Already <span className="capitalize text-white">{data.status}</span>
                  {data.approved_at ? ` on ${fmtDateIST(data.approved_at)}` : ""}.
                </div>
                {data.status === "approved" && (
                  <Section icon={<Mail className="h-4 w-4" />} title="Investor Confirmation Email">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <EmailStatusPill status={(data as unknown as { confirmation_email_status?: string | null }).confirmation_email_status} />
                        {(data as unknown as { confirmation_email_sent_at?: string | null }).confirmation_email_sent_at && (
                          <span className="text-[#B8B8B8]">
                            sent {fmtDateIST((data as unknown as { confirmation_email_sent_at: string }).confirmation_email_sent_at)}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => sendConfirm.mutate(data.id)}
                        disabled={sendConfirm.isPending}
                        className="bg-[#D61F3A] text-white hover:bg-[#B8172F]"
                      >
                        {sendConfirm.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-3.5 w-3.5" />
                        )}
                        {(data as unknown as { confirmation_email_status?: string | null }).confirmation_email_status === "sent"
                          ? "Resend email"
                          : "Send confirmation email"}
                      </Button>
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-[#6B7280]">
                      Sends the branded payment-confirmation email (invoice, checklist, portfolio link) to{" "}
                      <span className="text-[#B8B8B8]">{inv?.email ?? "the investor"}</span>.
                    </p>
                  </Section>
                )}
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function EmailStatusPill({ status }: { status?: string | null }) {
  const s = status ?? "pending";
  const map: Record<string, string> = {
    sent: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
    failed: "bg-[#D61F3A]/15 text-[#ff8a98] ring-[#D61F3A]/30",
    pending: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  };
  const label = s === "sent" ? "emailed" : s === "failed" ? "email failed" : "not sent yet";
  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${map[s] ?? map.pending}`}>
      <Send className="h-2.5 w-2.5" /> {label}
    </span>
  );
}
