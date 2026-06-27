import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InvestorStatus } from "@/lib/admin/schemas";

const styles: Record<InvestorStatus | "paid", string> = {
  pending: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  approved: "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30",
  active: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  inactive: "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30",
  paid: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
};

export function StatusBadge({ status }: { status: InvestorStatus | "paid" | "pending" }) {
  const cls = styles[status as keyof typeof styles] ?? styles.pending;
  return (
    <Badge className={cn("border-0 capitalize", cls)} variant="secondary">
      {status}
    </Badge>
  );
}
