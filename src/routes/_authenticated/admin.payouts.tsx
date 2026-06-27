import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { StatusBadge } from "@/components/admin/status-badge";
import { useMediaQuery } from "@/hooks/use-media-query";
import { listPayouts, markPayoutPaid } from "@/lib/admin/payouts.functions";
import { fmtINR } from "@/lib/admin/format";

export const Route = createFileRoute("/_authenticated/admin/payouts")({
  component: PayoutsPage,
});

function PayoutsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listPayouts);
  const markFn = useServerFn(markPayoutPaid);
  const { data } = useQuery({ queryKey: ["admin", "payouts"], queryFn: () => listFn() });
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const mark = useMutation({
    mutationFn: (id: string) => markFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "payouts"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Marked as paid");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const rows = useMemo(() => {
    const list = (data ?? []) as Array<{
      id: string;
      amount: number | string;
      month: string;
      status: "pending" | "paid";
      investor: { id: string; full_name: string } | null;
    }>;
    const ql = q.trim().toLowerCase();
    return list.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!ql) return true;
      return (r.investor?.full_name ?? "").toLowerCase().includes(ql);
    });
  }, [data, q, status]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Payouts</h1>
        <p className="text-sm text-[#B8B8B8]">Track scheduled distributions</p>
      </div>

      <div className="admin-card flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B8B8B8]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by investor name…"
            className="border-[#1F2024] bg-[#0B0C10] pl-9 text-white"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40 border-[#1F2024] bg-[#0B0C10] text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="border-[#1F2024] bg-[#14151A] text-white">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <div className="admin-card p-8 text-center text-sm text-[#B8B8B8]">No payouts.</div>
      ) : isDesktop ? (
        <div className="admin-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1F2024] hover:bg-transparent">
                <TableHead className="text-[#B8B8B8]">Investor</TableHead>
                <TableHead className="text-[#B8B8B8]">Month</TableHead>
                <TableHead className="text-right text-[#B8B8B8]">Amount</TableHead>
                <TableHead className="text-[#B8B8B8]">Status</TableHead>
                <TableHead className="text-right text-[#B8B8B8]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} className="border-[#1F2024]">
                  <TableCell className="text-white">{r.investor?.full_name ?? "—"}</TableCell>
                  <TableCell className="text-white">{new Date(r.month).toLocaleString("en-IN", { month: "short", year: "numeric" })}</TableCell>
                  <TableCell className="text-right text-white">{fmtINR(Number(r.amount))}</TableCell>
                  <TableCell><StatusBadge status={r.status as never} /></TableCell>
                  <TableCell className="text-right">
                    {r.status === "pending" && (
                      <Button size="sm" onClick={() => mark.mutate(r.id)} disabled={mark.isPending} className="bg-[#D61F3A] text-white hover:bg-[#B8172F]">
                        Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="admin-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-white">{r.investor?.full_name ?? "—"}</div>
                  <div className="text-xs text-[#B8B8B8]">{new Date(r.month).toLocaleString("en-IN", { month: "short", year: "numeric" })}</div>
                </div>
                <StatusBadge status={r.status as never} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-white">{fmtINR(Number(r.amount))}</div>
                {r.status === "pending" && (
                  <Button size="sm" onClick={() => mark.mutate(r.id)} disabled={mark.isPending} className="bg-[#D61F3A] text-white hover:bg-[#B8172F]">
                    Mark Paid
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
