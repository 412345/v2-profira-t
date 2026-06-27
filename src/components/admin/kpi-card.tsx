import type { ReactNode } from "react";

export function KpiCard({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <div className="admin-card relative overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.18em] text-[#B8B8B8]">{label}</div>
        {icon && <div className="text-[#D61F3A]">{icon}</div>}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</div>
      {hint && <div className="mt-1 text-xs text-[#B8B8B8]">{hint}</div>}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#D61F3A]/10 blur-2xl" />
    </div>
  );
}
