import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setFullName(data?.full_name ?? "");
    })();
  }, [user?.id]);

  async function save() {
    if (!user?.id) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-[#B8B8B8]">Manage your back office account</p>
      </div>
      <div className="admin-card space-y-4 p-6">
        <div className="space-y-1.5">
          <Label className="text-xs text-[#B8B8B8]">Full name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="border-[#1F2024] bg-[#0B0C10] text-white" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-[#B8B8B8]">Email</Label>
          <Input value={user?.email ?? ""} disabled className="border-[#1F2024] bg-[#0B0C10] text-[#B8B8B8]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-[#B8B8B8]">Change password</Label>
          <Input disabled placeholder="Coming soon" className="border-[#1F2024] bg-[#0B0C10] text-[#B8B8B8]" />
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" onClick={signOut} className="border-[#1F2024] bg-transparent text-white hover:bg-white/5">
            Sign out
          </Button>
          <Button onClick={save} disabled={loading} className="bg-[#D61F3A] text-white hover:bg-[#B8172F]">
            {loading ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
