import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, FileText, Receipt, CheckCircle2, PlayCircle, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  getInvestor,
  updateInvestorStatus,
  updateInvestorNotes,
  ensureInvestorDocuments,
} from "@/lib/admin/investors.functions";
import { fmtINR, fmtDateIST } from "@/lib/admin/format";

export const Route = createFileRoute("/_authenticated/admin/investors/$id")({
  component: InvestorDetail,
});

function InvestorDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const getFn = useServerFn(getInvestor);
  const updateStatusFn = useServerFn(updateInvestorStatus);
  const updateNotesFn = useServerFn(updateInvestorNotes);
  const ensureDocsFn = useServerFn(ensureInvestorDocuments);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "investor", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (data?.investor) setNotes(data.investor.notes ?? "");
  }, [data?.investor]);

  const statusMut = useMutation({
    mutationFn: (action: "approve" | "activate" | "deactivate") =>
      updateStatusFn({ data: { id, action } }),
    onSuccess: ({ status }) => {
      toast.success(`Marked ${status}`);
      qc.invalidateQueries({ queryKey: ["admin", "investor", id] });
      qc.invalidateQueries({ queryKey: ["admin", "investors"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const notesMut = useMutation({
    mutationFn: () => updateNotesFn({ data: { id, notes } }),
    onSuccess: () => toast.success("Notes saved"),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const ensureMut = useMutation({
    mutationFn: () => ensureDocsFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "investor", id] }),
  });

  if (isLoading) {
    return <div className="admin-card p-8 text-center text-sm text-[#B8B8B8]">Loading…</div>;
  }
  if (!data) return null;
  const inv = data.investor;
  const agreement = data.documents.find((d) => d.kind === "agreement");
  const invoice = data.documents.find((d) => d.kind === "invoice");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="text-[#B8B8B8] hover:bg-white/5">
            <Link to="/admin/investors"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-white">{inv.full_name}</h1>
              <StatusBadge status={inv.status as never} />
            </div>
            <p className="text-xs text-[#B8B8B8]">Created {fmtDateIST(inv.created_at)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => statusMut.mutate("approve")}
            disabled={inv.status !== "pending" || statusMut.isPending}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
          </Button>
          <Button
            onClick={() => statusMut.mutate("activate")}
            disabled={inv.status !== "approved" || statusMut.isPending}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            <PlayCircle className="mr-1.5 h-4 w-4" /> Activate
          </Button>
          <Button
            onClick={() => statusMut.mutate("deactivate")}
            disabled={(inv.status !== "active" && inv.status !== "approved") || statusMut.isPending}
            variant="outline"
            className="border-[#1F2024] bg-transparent text-white hover:bg-white/5"
          >
            <PauseCircle className="mr-1.5 h-4 w-4" /> Mark Inactive
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="admin-card space-y-3 p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-white">Profile</h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Row label="Email" value={inv.email} />
            <Row label="Phone" value={inv.phone} />
            <Row label="PAN" value={<span className="font-mono">{inv.pan}</span>} />
            <Row label="Bank A/C" value={<span className="font-mono">{inv.bank_account}</span>} />
            <Row label="IFSC" value={<span className="font-mono">{inv.ifsc}</span>} />
            <Row label="Tenure" value={`${inv.tenure_months} months`} />
            <Row label="Amount" value={fmtINR(Number(inv.amount))} />
          </dl>
        </div>
        <div className="admin-card space-y-3 p-5">
          <h2 className="text-sm font-semibold text-white">Documents</h2>
          {!agreement && !invoice ? (
            <>
              <p className="text-xs text-[#B8B8B8]">No documents generated yet.</p>
              <Button
                onClick={() => ensureMut.mutate()}
                disabled={ensureMut.isPending}
                className="w-full bg-[#D61F3A] text-white hover:bg-[#B8172F]"
              >
                Generate Agreement & Invoice
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              {agreement && (
                <Link
                  to="/admin/documents/$id"
                  params={{ id: agreement.id }}
                  className="flex items-center justify-between rounded-lg border border-[#1F2024] bg-[#0B0C10] px-3 py-2.5 text-sm text-white hover:bg-white/5"
                >
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#D61F3A]" />Agreement</span>
                  <span className="text-xs text-[#B8B8B8]">{agreement.serial_no}</span>
                </Link>
              )}
              {invoice && (
                <Link
                  to="/admin/documents/$id"
                  params={{ id: invoice.id }}
                  className="flex items-center justify-between rounded-lg border border-[#1F2024] bg-[#0B0C10] px-3 py-2.5 text-sm text-white hover:bg-white/5"
                >
                  <span className="flex items-center gap-2"><Receipt className="h-4 w-4 text-[#D61F3A]" />Invoice</span>
                  <span className="text-xs text-[#B8B8B8]">{invoice.serial_no}</span>
                </Link>
              )}
              {(!agreement || !invoice) && (
                <Button
                  onClick={() => ensureMut.mutate()}
                  disabled={ensureMut.isPending}
                  variant="outline"
                  className="w-full border-[#1F2024] bg-transparent text-white hover:bg-white/5"
                >
                  Generate missing
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="admin-card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Notes</h2>
          <Button
            size="sm"
            onClick={() => notesMut.mutate()}
            disabled={notesMut.isPending}
            className="bg-[#D61F3A] text-white hover:bg-[#B8172F]"
          >
            Save
          </Button>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Internal notes about this investor…"
          className="border-[#1F2024] bg-[#0B0C10] text-white"
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[#B8B8B8]">{label}</dt>
      <dd className="mt-0.5 text-sm text-white">{value}</dd>
    </div>
  );
}
