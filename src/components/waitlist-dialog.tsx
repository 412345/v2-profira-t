import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { submitWaitlist } from "@/lib/public/waitlist.functions";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone").max(20),
});
type Values = z.infer<typeof schema>;

export function WaitlistDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const submit = useServerFn(submitWaitlist);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    try {
      const res = await submit({ data: values });
      setDone(true);
      if (res.duplicate) {
        toast.message("You're already on the list.");
      } else {
        toast.success("You're on the waitlist.");
      }
      setTimeout(() => {
        onOpenChange(false);
        setTimeout(() => {
          setDone(false);
          reset();
        }, 200);
      }, 1100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-white/10 bg-[#0B0C10] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Join the waitlist</DialogTitle>
          <DialogDescription className="text-white/60">
            Tell us how to reach you. We review applications within 24 hours.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center transition-all">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D61F3A]/15 ring-1 ring-[#D61F3A]/40 animate-in zoom-in duration-300">
              <Check className="h-6 w-6 text-[#D61F3A]" />
            </div>
            <p className="text-sm text-white/80">Request received. We'll be in touch.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="wl-name" className="text-white/70">Full name</Label>
              <Input id="wl-name" {...register("name")} className="border-white/10 bg-black/40 text-white" />
              {errors.name && <p className="text-xs text-[#ff7a8a]">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wl-email" className="text-white/70">Email</Label>
              <Input id="wl-email" type="email" {...register("email")} className="border-white/10 bg-black/40 text-white" />
              {errors.email && <p className="text-xs text-[#ff7a8a]">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wl-phone" className="text-white/70">Phone</Label>
              <Input id="wl-phone" type="tel" {...register("phone")} className="border-white/10 bg-black/40 text-white" />
              {errors.phone && <p className="text-xs text-[#ff7a8a]">{errors.phone.message}</p>}
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-black hover:bg-white/90"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request access"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
