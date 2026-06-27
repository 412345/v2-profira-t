import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
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
import { StatusBadge } from "@/components/admin/status-badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import { listInvestors } from "@/lib/admin/investors.functions";
import { fmtINR, fmtDateIST } from "@/lib/admin/format";
import { investorStatuses } from "@/lib/admin/schemas";

export const Route = createFileRoute("/_authenticated/admin/investors")({
  component: InvestorsPage,
});

function InvestorsPage() {
  const listFn = useServerFn(listInvestors);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "investors"],
    queryFn: () => listFn(),
  });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const rows = useMemo(() => {
    const list = data ?? [];
    const ql = q.trim().toLowerCase();
    return list.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!ql) return true;
      return (
        r.full_name.toLowerCase().includes(ql) ||
        r.email.toLowerCase().includes(ql) ||
        r.pan.toLowerCase().includes(ql) ||
        r.phone.toLowerCase().includes(ql)
      );
    });
  }, [data, q, status]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Investors</h1>
          <p className="text-sm text-[#B8B8B8]">{rows.length} record{rows.length === 1 ? "" : "s"}</p>
        </div>
        <Button asChild className="bg-[#D61F3A] text-white hover:bg-[#B8172F]">
          <Link to="/admin/onboarding"><Plus className="mr-1.5 h-4 w-4" />New investor</Link>
        </Button>
      </div>

      <div className="admin-card flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8B8B8]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, PAN, phone…"
            className="border-[#1F2024] bg-[#0B0C10] pl-9 text-white"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44 border-[#1F2024] bg-[#0B0C10] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[#1F2024] bg-[#14151A] text-white">
            <SelectItem value="all">All statuses</SelectItem>
            {investorStatuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="admin-card p-8 text-center text-sm text-[#B8B8B8]">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="admin-card p-8 text-center text-sm text-[#B8B8B8]">No investors found.</div>
      ) : isDesktop ? (
        <div className="admin-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1F2024] hover:bg-transparent">
                <TableHead className="text-[#B8B8B8]">Investor</TableHead>
                <TableHead className="text-[#B8B8B8]">PAN</TableHead>
                <TableHead className="text-[#B8B8B8] text-right">Amount</TableHead>
                <TableHead className="text-[#B8B8B8]">Tenure</TableHead>
                <TableHead className="text-[#B8B8B8]">Status</TableHead>
                <TableHead className="text-[#B8B8B8]">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="border-[#1F2024]">
                  <TableCell>
                    <Link
                      to="/admin/investors/$id"
                      params={{ id: r.id }}
                      className="block hover:text-[#D61F3A]"
                    >
                      <div className="font-medium text-white">{r.full_name}</div>
                      <div className="text-xs text-[#B8B8B8]">{r.email}</div>
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-white">{r.pan}</TableCell>
                  <TableCell className="text-right text-white">{fmtINR(Number(r.amount))}</TableCell>
                  <TableCell className="text-white">{r.tenure_months}m</TableCell>
                  <TableCell><StatusBadge status={r.status as never} /></TableCell>
                  <TableCell className="text-xs text-[#B8B8B8]">{fmtDateIST(r.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Link
              key={r.id}
              to="/admin/investors/$id"
              params={{ id: r.id }}
              className="admin-card block p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{r.full_name}</div>
                  <div className="truncate text-xs text-[#B8B8B8]">{r.email}</div>
                </div>
                <StatusBadge status={r.status as never} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-[#B8B8B8]">PAN: </span><span className="font-mono text-white">{r.pan}</span></div>
                <div><span className="text-[#B8B8B8]">Tenure: </span><span className="text-white">{r.tenure_months}m</span></div>
                <div className="col-span-2"><span className="text-[#B8B8B8]">Amount: </span><span className="text-white">{fmtINR(Number(r.amount))}</span></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
