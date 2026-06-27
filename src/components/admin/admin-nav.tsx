import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Wallet,
  Banknote,
  Settings as SettingsIcon,
  Mailbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/waitlist", label: "Waitlist", icon: Mailbox },
  { to: "/admin/onboarding", label: "Onboarding", icon: UserPlus },
  { to: "/admin/investors", label: "Investors", icon: Users },
  { to: "/admin/funds", label: "Funds", icon: Wallet },
  { to: "/admin/payouts", label: "Payouts", icon: Banknote },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];


export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1 p-3">
      <div className="px-3 pb-4 pt-2">
        <div className="text-[11px] uppercase tracking-[0.25em] text-[#B8B8B8]">PROFIRA</div>
        <div className="mt-1 text-sm font-semibold text-white">Back Office</div>
      </div>
      {items.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to as "/admin"}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-[#D61F3A]/15 text-white ring-1 ring-[#D61F3A]/30"
                : "text-[#B8B8B8] hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
