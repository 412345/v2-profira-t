import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { WaitlistDialog } from "@/components/waitlist-dialog";

export const Route = createFileRoute("/signin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — PROFIRA" },
      { name: "description", content: "Sign in or create your PROFIRA investor account." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  async function routeByRole() {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) {
        navigate({ to: "/signin", replace: true });
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role as string);
      if (roles.includes("admin") || roles.includes("staff")) {
        navigate({ to: "/admin", replace: true });
      } else if (roles.includes("investor")) {
        navigate({ to: "/home", replace: true });
      } else {
        navigate({ to: "/signin", replace: true });
      }
    } catch {
      navigate({ to: "/signin", replace: true });
    }
  }

  async function onSignIn(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back.");
      await routeByRole();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function onSignUp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/signin",
          data: { full_name: fullName },
        },
      });
      if (error) {
        const msg = error.message || "";
        if (msg.toLowerCase().includes("not approved") || msg.toLowerCase().includes("waitlist")) {
          toast.error("This email hasn't been approved yet — join the waitlist first.");
          setWaitlistOpen(true);
          return;
        }
        throw error;
      }
      toast.success("Account created.");
      await routeByRole();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#D61F3A]/15 ring-1 ring-[#D61F3A]/30">
            <ShieldCheck className="h-5 w-5 text-[#D61F3A]" />
          </div>
          <h1 className="text-xl font-semibold">PROFIRA Access</h1>
          <p className="mt-1 text-sm text-white/60">Sign in or create your investor account</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B0C10] p-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 bg-white/[0.04]">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={onSignIn} className="space-y-4 pt-4">
                <Field id="si-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
                <Field id="si-pw" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" minLength={6} />
                <Button type="submit" disabled={loading} className="w-full bg-[#D61F3A] hover:bg-[#B8172F]">
                  {loading ? "Please wait…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={onSignUp} className="space-y-4 pt-4">
                <Field id="su-name" label="Full name" type="text" value={fullName} onChange={setFullName} autoComplete="name" />
                <Field id="su-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
                <Field id="su-pw" label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" minLength={6} />
                <Button type="submit" disabled={loading} className="w-full bg-[#D61F3A] hover:bg-[#B8172F]">
                  {loading ? "Please wait…" : "Create account"}
                </Button>
                <p className="text-center text-[11px] text-white/50">
                  Approved emails only.{" "}
                  <button type="button" onClick={() => setWaitlistOpen(true)} className="underline hover:text-white">
                    Join the waitlist
                  </button>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-4 text-center text-[11px] text-white/40">
          <Link to="/" className="hover:text-white/70">← Back to home</Link>
        </div>
      </div>

      <WaitlistDialog open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </div>
  );
}

function Field({
  id, label, type, value, onChange, autoComplete, minLength,
}: {
  id: string; label: string; type: string; value: string;
  onChange: (v: string) => void; autoComplete?: string; minLength?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-white/70">{label}</Label>
      <Input
        id={id} type={type} required value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete} minLength={minLength}
        className="border-white/10 bg-black/40 text-white"
      />
    </div>
  );
}
