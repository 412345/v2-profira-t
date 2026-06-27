import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMediaQuery } from "@/hooks/use-media-query";
import { listInvestmentRequests } from "@/lib/admin/investment-requests.functions";
import { fmtINR, fmtDateIST } from "@/lib/admin/format";
import { InvestmentReviewDrawer } from "@/components/admin/investment-review-drawer";

const statusSchema = z.enum(["all", "pending", "approved", "rejected"]).default("pending");

export const Route = createFileRoute("/_authenticated/admin/investments")({
  head: () => ({ meta: [{ title: "Investments — PROFIRA Admin" }] }),
  validateSearch: (search) => ({ status: statusSchema.parse(search.status ?? "pending") }),
  component: AdminInvestmentsPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-sm text-red-400">{error.message}</div>
  ),
});

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  rejected: "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
        statusStyles[status] ?? statusStyles.pending
      }`}
    >
      {status}
    </span>
  );
}

function AdminInvestmentsPage() {
  const { status } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const listFn = useServerFn(listInvestmentRequests);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-invreqs", status],
    queryFn: () => listFn({ data: { status } }),
  });

  const rows = useMemo(() => {
    const list = data ?? [];
    const ql = q.trim().toLowerCase();
    if (!ql) return list;
    return list.filter((r) => {
      const inv = (r as unknown as { investors: { full_name: string | null; email: string | null } | null }).investors;
      return (
        (inv?.full_name ?? "").toLowerCase().includes(ql) ||
        (inv?.email ?? "").toLowerCase().includes(ql) ||
        (r.transaction_id ?? "").toLowerCase().includes(ql) ||
        (r.reference_number ?? "").toLowerCase().includes(ql)
      );
    });
  }, [data, q]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Investments</h1>
        <p className="text-sm text-[#B8B8B8]">{rows.length} record{rows.length === 1 ? "" : "s"}</p>
      </div>

      <div className="admin-card flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8B8B8]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, UTR, reference…"
            className="border-[#1F2024] bg-[#0B0C10] pl-9 text-white"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) =>
            navigate({ search: { status: v as "all" | "pending" | "approved" | "rejected" } })
          }
        >
          <SelectTrigger className="w-52 border-[#1F2024] bg-[#0B0C10] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[#1F2024] bg-[#14151A] text-white">
            <SelectItem value="all">All records</SelectItem>
            <SelectItem value="pending">Awaiting verification</SelectItem>
            <SelectItem value="approved">Approved ledger</SelectItem>
            <SelectItem value="rejected">Rejected exceptions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="admin-card p-8 text-center text-sm text-[#B8B8B8]">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="admin-card p-8 text-center text-sm text-[#B8B8B8]">No investments found.</div>
      ) : isDesktop ? (
        <div className="admin-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1F2024] hover:bg-transparent">
                <TableHead className="text-[#B8B8B8]">Investor</TableHead>
                <TableHead className="text-[#B8B8B8]">Email</TableHead>
                <TableHead className="text-right text-[#B8B8B8]">Principal</TableHead>
                <TableHead className="text-[#B8B8B8]">UTR</TableHead>
                <TableHead className="text-[#B8B8B8]">Status</TableHead>
                <TableHead className="text-[#B8B8B8]">Created</TableHead>
                <TableHead className="text-right text-[#B8B8B8]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const inv = (r as unknown as { investors: { full_name: string | null; email: string | null } | null }).investors;
                return (
                  <TableRow key={r.id} className="border-[#1F2024]">
                    <TableCell>
                      <div className="font-medium text-white">{inv?.full_name ?? "—"}</div>
                      <div className="font-mono text-[11px] text-[#D61F3A]">{r.reference_number}</div>
                    </TableCell>
                    <TableCell className="text-sm text-[#B8B8B8]">{inv?.email ?? "—"}</TableCell>
                    <TableCell className="text-right text-white">{fmtINR(Number(r.amount))}</TableCell>
                    <TableCell className="font-mono text-xs text-white">{r.transaction_id}</TableCell>
                    <TableCell><StatusPill status={r.status} /></TableCell>
                    <TableCell className="text-xs text-[#B8B8B8]">{fmtDateIST(r.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#1F2024] bg-transparent text-white hover:bg-white/5"
                        onClick={() => setOpenId(r.id)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const inv = (r as unknown as { investors: { full_name: string | null; email: string | null } | null }).investors;
            return (
              <button
                key={r.id}
                onClick={() => setOpenId(r.id)}
                className="admin-card block w-full p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] text-[#D61F3A]">{r.reference_number}</div>
                    <div className="mt-0.5 truncate font-medium text-white">{inv?.full_name ?? "—"}</div>
                    <div className="truncate text-xs text-[#B8B8B8]">{inv?.email ?? ""}</div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div className="font-mono text-[11px] text-[#B8B8B8]">UTR: {r.transaction_id}</div>
                  <div className="text-lg font-semibold text-white">{fmtINR(Number(r.amount))}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <InvestmentReviewDrawer
        id={openId}
        open={Boolean(openId)}
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </div>
  );
}
