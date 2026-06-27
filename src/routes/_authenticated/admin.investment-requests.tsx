import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listInvestmentRequests, setInvestmentRequestStatus } from "@/lib/admin/investment-requests.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/investment-requests")({
  head: () => ({ meta: [{ title: "Investment Requests — PROFIRA Admin" }] }),
  component: AdminInvestmentRequests,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-red-400">{error.message}</div>
  ),
});

function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

function AdminInvestmentRequests() {
  const [status, setStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const listFn = useServerFn(listInvestmentRequests);
  const setFn = useServerFn(setInvestmentRequestStatus);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-invreqs", status],
    queryFn: () => listFn({ data: { status } }),
  });
  const m = useMutation({
    mutationFn: setFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invreqs"] });
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const rows = data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Investment Requests</h1>
        <p className="text-sm text-[#B8B8B8]">{rows.length} record{rows.length === 1 ? "" : "s"}</p>
      </div>

      <div className="admin-card flex flex-wrap items-center gap-2 p-3">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition"
            style={{
              background: status === s ? "rgba(214,31,58,0.18)" : "transparent",
              color: status === s ? "#D61F3A" : "#B8B8B8",
              border: "1px solid #1F2024",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="admin-card p-8 text-center text-sm text-[#B8B8B8]">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="admin-card p-8 text-center text-sm text-[#B8B8B8]">No requests.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const inv = (r as unknown as { investors: { full_name: string | null; email: string | null } | null }).investors;
            return (
              <div key={r.id} className="admin-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-[#D61F3A]">{r.reference_number}</div>
                    <div className="mt-1 font-medium text-white">{inv?.full_name ?? "—"}</div>
                    <div className="text-xs text-[#B8B8B8]">{inv?.email ?? ""}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white">₹{fmtINR(Number(r.amount))}</div>
                    <div className="font-mono text-[11px] text-[#B8B8B8]">UTR: {r.transaction_id}</div>
                    <div className="mt-1 text-[10px] capitalize" style={{ color: r.status === "approved" ? "#22C55E" : r.status === "rejected" ? "#EF4444" : "#EAB308" }}>
                      {r.status}
                    </div>
                  </div>
                </div>
                {r.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => m.mutate({ data: { id: r.id, status: "approved" } })}
                      disabled={m.isPending}
                      className="rounded-lg bg-[#22C55E] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => m.mutate({ data: { id: r.id, status: "rejected" } })}
                      disabled={m.isPending}
                      className="rounded-lg bg-[#EF4444] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
