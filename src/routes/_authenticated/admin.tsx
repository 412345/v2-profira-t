import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminNav } from "@/components/admin/admin-nav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) throw redirect({ to: "/signin" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);
    const roles = (data ?? []).map((r) => r.role as string);
    if (roles.includes("admin") || roles.includes("staff")) return;
    if (roles.includes("investor")) throw redirect({ to: "/home" });
    throw redirect({ to: "/signin" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  return (
    <div className="admin-scope min-h-dvh">
      <AdminTopbar email={user?.email ?? null} />
      <div className="flex">
        <aside className="hidden w-64 shrink-0 border-r border-[#1F2024] md:block">
          <div className="sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto">
            <AdminNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
