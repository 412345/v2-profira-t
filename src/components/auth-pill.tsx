import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, getMyRole, type AppRole } from "@/lib/auth/role.functions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { LogOut, LayoutDashboard, BarChart3, User as UserIcon } from "lucide-react";

export function AuthPill() {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const fetchProfile = useServerFn(getMyProfile);
  const fetchRole = useServerFn(getMyRole);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    let alive = true;
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (alive) {
          setName(null);
          setRole(null);
        }
        return;
      }
      try {
        const [p, r] = await Promise.all([fetchProfile(), fetchRole()]);
        if (!alive) return;
        setName(p?.full_name ?? p?.email ?? null);
        setRole(r.primary);
      } catch {
        /* ignore */
      }
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        load();
      }
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile, fetchRole]);

  if (!mounted) return null;

  if (!name) {
    return (
      <Link
        to="/signin"
        className="rounded-full border border-white/30 bg-white/[0.03] px-4 py-1.5 text-[12px] font-medium text-white/90 backdrop-blur-sm transition hover:border-white/60 hover:bg-white/[0.07]"
      >
        Sign in
      </Link>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const firstName = name.split(" ")[0] || name;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/90 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/[0.08]">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D61F3A]/30 text-[10px]">
          <UserIcon className="h-3 w-3" />
        </span>
        Hi, {firstName}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-white/10 bg-[#0B0C10] text-white">
        {(role === "admin" || role === "staff") && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/portfolio" className="cursor-pointer">
            <BarChart3 className="mr-2 h-4 w-4" /> Portfolio
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
