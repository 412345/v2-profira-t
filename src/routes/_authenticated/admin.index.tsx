import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Wallet, Users, Banknote, Mailbox } from "lucide-react";
import { KpiCard } from "@/components/admin/kpi-card";
import { getDashboardStats } from "@/lib/admin/dashboard.functions";
import { fmtINR } from "@/lib/admin/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: DashboardPage,
});

function DashboardPage() {
  const fetchStats = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchStats(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-[#B8B8B8]">Operational overview of funds, investors and payouts.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Funds Managed"
          value={isLoading ? "…" : fmtINR(data?.totalAum ?? 0)}
          hint="Sum of AUM across funds"
          icon={<Wallet className="h-4 w-4" />}
        />
        <KpiCard
          label="Active Investors"
          value={isLoading ? "…" : (data?.activeInvestors ?? 0).toLocaleString("en-IN")}
          hint="Status = active"
          icon={<Users className="h-4 w-4" />}
        />
        <KpiCard
          label="Pending Payouts"
          value={isLoading ? "…" : fmtINR(data?.pendingPayouts ?? 0)}
          hint="Awaiting disbursement"
          icon={<Banknote className="h-4 w-4" />}
        />
        <KpiCard
          label="Pending Waitlist"
          value={isLoading ? "…" : (data?.pendingWaitlist ?? 0).toLocaleString("en-IN")}
          hint="Awaiting review"
          icon={<Mailbox className="h-4 w-4" />}
        />
      </div>


      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-white">Fund Growth</h2>
            <span className="text-xs text-[#B8B8B8]">Last 12 months</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.growthSeries ?? []}>
                <CartesianGrid stroke="#1F2024" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#B8B8B8" fontSize={11} />
                <YAxis stroke="#B8B8B8" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ background: "#14151A", border: "1px solid #1F2024", borderRadius: 8, color: "#fff" }}
                  formatter={(v: number) => fmtINR(v)}
                />
                <Line type="monotone" dataKey="value" stroke="#D61F3A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="admin-card p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-white">Monthly Payouts</h2>
            <span className="text-xs text-[#B8B8B8]">Last 12 months</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.payoutsSeries ?? []}>
                <CartesianGrid stroke="#1F2024" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#B8B8B8" fontSize={11} />
                <YAxis stroke="#B8B8B8" fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ background: "#14151A", border: "1px solid #1F2024", borderRadius: 8, color: "#fff" }}
                  formatter={(v: number) => fmtINR(v)}
                />
                <Bar dataKey="value" fill="#D61F3A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
