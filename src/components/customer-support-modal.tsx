import { Instagram, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const ACCENT = "#D61F3A";
const SURFACE = "#14151A";
const SECONDARY_TEXT = "#B8B8B8";

const WHATSAPP_HREF =
  "https://wa.me/919006282854?text=Hi%20PROFIRA%20Support";
const INSTAGRAM_HREF =
  "https://www.instagram.com/profiratrade?igsh=bjhreXBleXR2anhn";

export function CustomerSupportModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[420px] gap-0 rounded-2xl border border-white/[0.08] p-0 text-white sm:rounded-2xl"
        style={{ background: SURFACE }}
      >
        <DialogHeader className="space-y-2 px-6 pt-6 pb-4 text-center sm:text-center">
          <DialogTitle className="text-center text-[15px] font-semibold uppercase tracking-[0.18em] text-white">
            Customer Support
          </DialogTitle>
          <DialogDescription className="sr-only">
            Reach the PROFIRA support team via WhatsApp or Instagram.
          </DialogDescription>
          <div
            className="mx-auto h-px w-10"
            style={{ background: ACCENT, opacity: 0.85 }}
          />
        </DialogHeader>

        <div className="space-y-3 px-6 pb-5">
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:-translate-y-[1px] hover:border-white/15 hover:bg-white/[0.05]"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "rgba(34,197,94,0.18)" }}
            >
              <MessageCircle className="h-4.5 w-4.5" style={{ color: "#22C55E" }} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white">
                WhatsApp / Telegram
              </div>
              <div
                className="mt-0.5 truncate text-[12px] font-mono"
                style={{ color: SECONDARY_TEXT }}
              >
                +91 90062 82854
              </div>
            </div>
          </a>

          <a
            href={INSTAGRAM_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:-translate-y-[1px] hover:border-white/15 hover:bg-white/[0.05]"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{
                background:
                  "linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)",
              }}
            >
              <Instagram className="h-4.5 w-4.5 text-white" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white">Instagram</div>
              <div
                className="mt-0.5 text-[12px]"
                style={{ color: SECONDARY_TEXT }}
              >
                DM us for any support
              </div>
            </div>
          </a>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <p
            className="text-center text-[11px] uppercase tracking-[0.14em]"
            style={{ color: SECONDARY_TEXT }}
          >
            We resolve any issues within a few hours.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
