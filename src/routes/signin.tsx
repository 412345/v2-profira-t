import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldCheck, Mail, Lock, User, Lock as LockIcon, ShieldAlert, Sparkles } from "lucide-react";
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
      } else {
        navigate({ to: "/portfolio", replace: true });
      }
    } catch {
      navigate({ to: "/portfolio", replace: true });
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
      toast.success("Account created — please sign in.");
      setPassword("");
      setTab("signin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-black text-white">
      {/* Animated gradient mesh background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden">
        <div className="absolute -left-32 -top-32 h-[460px] w-[460px] rounded-full bg-[#D61F3A]/25 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -right-32 top-1/3 h-[380px] w-[380px] rounded-full bg-[#7B0F1F]/30 blur-[120px] animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-[#1E2A78]/20 blur-[140px] animate-[pulse_12s_ease-in-out_infinite]" />
      </div>
      {/* Grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative mx-auto grid min-h-dvh max-w-7xl grid-cols-1 items-center gap-10 px-5 py-10 md:grid-cols-2 md:gap-16 md:py-16">
        {/* Brand panel */}
        <div className="hidden md:flex flex-col justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-white/60 hover:text-white">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#D61F3A]" />
            Profira
          </Link>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/70 backdrop-blur">
              <Sparkles className="h-3 w-3 text-[#D61F3A]" />
              Private investor access
            </div>
            <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight">
              Capital, <span className="text-[#D61F3A]">compounded</span><br />with discipline.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-white/60">
              Sign in to your PROFIRA dashboard — monitor monthly yield, track payouts, and oversee every position from one console built for serious investors.
            </p>
            <div className="grid max-w-md grid-cols-3 gap-3 pt-2">
              <Stat k="10%" v="Monthly yield" />
              <Stat k="6M" v="Tenure" />
              <Stat k="160%" v="At maturity" />
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.25em] text-white/40">
            <span className="inline-flex items-center gap-1.5"><LockIcon className="h-3 w-3" /> Bank-grade</span>
            <span className="inline-flex items-center gap-1.5"><ShieldAlert className="h-3 w-3" /> Vetted access</span>
          </div>
        </div>

        {/* Card panel */}
        <div className="w-full max-w-md justify-self-center md:justify-self-end">
          <div className="mb-6 text-center md:hidden">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#D61F3A]/15 ring-1 ring-[#D61F3A]/30">
              <ShieldCheck className="h-5 w-5 text-[#D61F3A]" />
            </div>
            <h1 className="text-xl font-semibold">PROFIRA Access</h1>
            <p className="mt-1 text-sm text-white/60">Sign in or create your investor account</p>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-[#0B0C10]/80 p-6 shadow-[0_20px_80px_-20px_rgba(214,31,58,0.35)] backdrop-blur-xl">
            <div aria-hidden className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#D61F3A]/60 to-transparent" />
            <div className="mb-5 hidden md:block">
              <h1 className="text-lg font-semibold text-white">Welcome to PROFIRA</h1>
              <p className="mt-0.5 text-xs text-white/50">Sign in or create your investor account</p>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 bg-white/[0.04]">
                <TabsTrigger value="signin" className="data-[state=active]:bg-[#D61F3A] data-[state=active]:text-white">Sign in</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-[#D61F3A] data-[state=active]:text-white">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={onSignIn} className="space-y-4 pt-5">
                  <Field id="si-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" icon={<Mail className="h-4 w-4" />} />
                  <Field id="si-pw" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" minLength={6} icon={<Lock className="h-4 w-4" />} />
                  <Button type="submit" disabled={loading} className="group w-full bg-[#D61F3A] py-5 text-sm font-medium tracking-wide hover:bg-[#B8172F]">
                    {loading ? "Please wait…" : "Sign in to dashboard"}
                  </Button>
                  <p className="text-center text-[11px] text-white/50">
                    Email not approved yet?{" "}
                    <button type="button" onClick={() => setWaitlistOpen(true)} className="text-[#D61F3A]/90 underline-offset-2 hover:text-[#D61F3A] hover:underline">
                      Join the waitlist
                    </button>
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={onSignUp} className="space-y-4 pt-5">
                  <Field id="su-name" label="Full name" type="text" value={fullName} onChange={setFullName} autoComplete="name" icon={<User className="h-4 w-4" />} />
                  <Field id="su-email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" icon={<Mail className="h-4 w-4" />} />
                  <Field id="su-pw" label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" minLength={6} icon={<Lock className="h-4 w-4" />} />
                  <Button type="submit" disabled={loading} className="w-full bg-[#D61F3A] py-5 text-sm font-medium tracking-wide hover:bg-[#B8172F]">
                    {loading ? "Please wait…" : "Create account"}
                  </Button>
                  <p className="text-center text-[11px] text-white/50">
                    Approved emails only.{" "}
                    <button type="button" onClick={() => setWaitlistOpen(true)} className="text-[#D61F3A]/90 underline-offset-2 hover:text-[#D61F3A] hover:underline">
                      Join the waitlist
                    </button>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <div className="mt-5 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.22em] text-white/35">
            <span>Encrypted</span>
            <span className="h-px w-6 bg-white/10" />
            <span>Approved access</span>
            <span className="h-px w-6 bg-white/10" />
            <span>Audited</span>
          </div>

          <div className="mt-4 text-center text-[11px] text-white/40">
            <Link to="/" className="hover:text-white/70">← Back to home</Link>
          </div>
        </div>
      </div>

      <WaitlistDialog open={waitlistOpen} onOpenChange={setWaitlistOpen} />
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-lg font-semibold text-white">{k}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/50">{v}</div>
    </div>
  );
}

function Field({
  id, label, type, value, onChange, autoComplete, minLength, icon,
}: {
  id: string; label: string; type: string; value: string;
  onChange: (v: string) => void; autoComplete?: string; minLength?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[11px] uppercase tracking-wider text-white/60">{label}</Label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            {icon}
          </span>
        )}
        <Input
          id={id} type={type} required value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete} minLength={minLength}
          className={`border-white/10 bg-black/50 text-white transition focus-visible:border-[#D61F3A]/60 focus-visible:ring-1 focus-visible:ring-[#D61F3A]/40 ${icon ? "pl-9" : ""}`}
        />
      </div>
    </div>
  );
}
