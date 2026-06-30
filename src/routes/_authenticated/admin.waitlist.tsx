import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listWaitlist, setWaitlistStatus, deleteWaitlistEntry } from "@/lib/admin/waitlist.functions";
import { sendApprovalEmail } from "@/lib/admin/email.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, X, Copy, Search, Mailbox, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/admin/waitlist")({
  component: WaitlistPage,
});

type Status = "all" | "pending" | "approved" | "rejected";

function WaitlistPage() {
  const fetchList = useServerFn(listWaitlist);
  const setStatus = useServerFn(setWaitlistStatus);
  const resend = useServerFn(sendApprovalEmail);
  const deleteEntry = useServerFn(deleteWaitlistEntry);
  const qc = useQueryClient();

  const [status, setStatusFilter] = useState<Status>("all");
  const [source, setSource] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);


  const query = useQuery({
    queryKey: ["admin", "waitlist", status, source, search],
    queryFn: () => fetchList({ data: { status, source, search } }),
  });

  const mut = useMutation({
    mutationFn: (vars: { id: string; status: "approved" | "rejected" }) =>
      setStatus({ data: vars }),
    onSuccess: (res, vars) => {
      if (vars.status === "rejected") {
        toast.success("Rejected.");
      } else if (res.emailStatus === "sent") {
        toast.success("Approved and emailed.");
      } else {
        toast.error(`Approved, but email failed: ${res.emailError ?? "unknown error"}`);
      }
      qc.invalidateQueries({ queryKey: ["admin", "waitlist"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const resendMut = useMutation({
    mutationFn: (waitlistId: string) => resend({ data: { waitlistId } }),
    onSuccess: () => {
      toast.success("Email resent.");
      qc.invalidateQueries({ queryKey: ["admin", "waitlist"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Resend failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteEntry({ data: { id } }),
    onSuccess: () => {
      toast.success("Waitlist entry deleted.");
      setConfirmDeleteId(null);
      qc.invalidateQueries({ queryKey: ["admin", "waitlist"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });


  const rows = query.data ?? [];
  const sources = useMemo(() => {
    const s = new Set<string>(["website", "instagram", "linkedin", "referral", "manual"]);
    rows.forEach((r) => s.add(r.source));
    return Array.from(s);
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D61F3A]/15 ring-1 ring-[#D61F3A]/30">
          <Mailbox className="h-5 w-5 text-[#D61F3A]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Waitlist</h1>
          <p className="text-sm text-[#B8B8B8]">Review and approve incoming investor leads.</p>
        </div>
      </div>

      <div className="admin-card p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8B8B8]" />
            <Input
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-[#1F2024] bg-[#0B0C10] pl-9 text-white"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatusFilter(v as Status)}>
            <SelectTrigger className="border-[#1F2024] bg-[#0B0C10] text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="border-[#1F2024] bg-[#0B0C10] text-white">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sources.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="border-b border-[#1F2024] text-left text-xs uppercase tracking-wider text-[#B8B8B8]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {query.isLoading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[#B8B8B8]">Loading…</td></tr>
              )}
              {!query.isLoading && rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[#B8B8B8]">No leads found.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[#1F2024]/60 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-[#D8D8D8]">{r.email}</td>
                  <td className="px-4 py-3 text-[#D8D8D8]">{r.phone}</td>
                  <td className="px-4 py-3"><SourcePill source={r.source} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <StatusPill status={r.status} />
                      {r.status === "approved" && <EmailPill status={r.resend_email_status} />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#B8B8B8]">{fmt(r.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <RowActions
                      status={r.status}
                      emailStatus={r.resend_email_status}
                      onCopy={() => copy(r.email)}
                      onApprove={() => mut.mutate({ id: r.id, status: "approved" })}
                      onReject={() => mut.mutate({ id: r.id, status: "rejected" })}
                      onResend={() => resendMut.mutate(r.id)}
                      busy={mut.isPending || resendMut.isPending}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-[#1F2024]/60 md:hidden">
          {query.isLoading && <div className="px-4 py-8 text-center text-[#B8B8B8]">Loading…</div>}
          {!query.isLoading && rows.length === 0 && (
            <div className="px-4 py-8 text-center text-[#B8B8B8]">No leads found.</div>
          )}
          {rows.map((r) => (
            <div key={r.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-white">{r.name}</div>
                  <div className="text-xs text-[#D8D8D8]">{r.email}</div>
                  <div className="text-xs text-[#B8B8B8]">{r.phone}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill status={r.status} />
                  {r.status === "approved" && <EmailPill status={r.resend_email_status} />}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#B8B8B8]">
                <SourcePill source={r.source} />
                <span>· {fmt(r.created_at)}</span>
              </div>
              <RowActions
                status={r.status}
                emailStatus={r.resend_email_status}
                onCopy={() => copy(r.email)}
                onApprove={() => mut.mutate({ id: r.id, status: "approved" })}
                onReject={() => mut.mutate({ id: r.id, status: "rejected" })}
                onResend={() => resendMut.mutate(r.id)}
                busy={mut.isPending || resendMut.isPending}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RowActions({
  status, emailStatus, onCopy, onApprove, onReject, onResend, busy,
}: {
  status: string;
  emailStatus?: string | null;
  onCopy: () => void;
  onApprove: () => void;
  onReject: () => void;
  onResend: () => void;
  busy: boolean;
}) {
  const showResend = status === "approved" && emailStatus !== "sent";
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button size="sm" variant="ghost" onClick={onCopy} className="text-[#B8B8B8] hover:text-white">
        <Copy className="h-3.5 w-3.5" />
      </Button>
      {showResend && (
        <Button size="sm" variant="outline" disabled={busy} onClick={onResend} className="border-[#1F2024] bg-transparent text-white hover:bg-white/5">
          <Send className="mr-1 h-3.5 w-3.5" /> {emailStatus === "failed" ? "Retry email" : "Send email"}
        </Button>
      )}
      {status !== "approved" && (
        <Button size="sm" disabled={busy} onClick={onApprove} className="bg-[#15803d] hover:bg-[#166534]">
          <Check className="mr-1 h-3.5 w-3.5" /> Approve
        </Button>
      )}
      {status !== "rejected" && (
        <Button size="sm" variant="outline" disabled={busy} onClick={onReject} className="border-[#1F2024] bg-transparent text-white hover:bg-white/5">
          <X className="mr-1 h-3.5 w-3.5" /> Reject
        </Button>
      )}
    </div>
  );
}

function EmailPill({ status }: { status?: string | null }) {
  const s = status ?? "pending";
  const map: Record<string, string> = {
    sent: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
    failed: "bg-[#D61F3A]/15 text-[#ff8a98] ring-[#D61F3A]/30",
    pending: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  };
  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${map[s] ?? map.pending}`}>
      <Send className="h-2.5 w-2.5" /> {s === "sent" ? "emailed" : s === "failed" ? "email failed" : "email pending"}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    approved: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    rejected: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${map[status] ?? map.pending}`}>
      {status}
    </span>
  );
}

function SourcePill({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-[#D8D8D8] ring-1 ring-white/10">
      {source}
    </span>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function copy(s: string) {
  navigator.clipboard?.writeText(s).then(() => toast.success("Copied")).catch(() => toast.error("Copy failed"));
}
