import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getMyRole, type AppRole } from "@/lib/auth/role.functions";
import { LogOut, LayoutDashboard } from "lucide-react";

export function AuthPill() {
  const [mounted, setMounted] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);
  const fetchRole = useServerFn(getMyRole);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    let alive = true;
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (alive) {
          setSignedIn(false);
          setRole(null);
        }
        return;
      }
      if (alive) setSignedIn(true);
      try {
        const r = await fetchRole();
        if (alive) setRole(r.primary);
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
  }, [fetchRole]);

  if (!mounted) return null;

  if (!signedIn) {
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

  const dashboardTo = role === "admin" || role === "staff" ? "/admin" : "/portfolio";

  return (
    <div className="flex items-center gap-2">
      <Link
        to={dashboardTo}
        className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/90 backdrop-blur-sm transition hover:border-white/50 hover:bg-white/[0.08]"
      >
        <LayoutDashboard className="h-3 w-3" />
        Dashboard
      </Link>
      <button
        type="button"
        onClick={signOut}
        className="flex items-center gap-1.5 rounded-full border border-[#D61F3A]/60 bg-[#D61F3A]/10 px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#D61F3A]/20"
      >
        <LogOut className="h-3 w-3" />
        Sign out
      </button>
    </div>
  );
}
