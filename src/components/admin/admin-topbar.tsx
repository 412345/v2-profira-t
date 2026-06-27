import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { AdminNav } from "./admin-nav";

export function AdminTopbar({ email }: { email: string | null }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  }

  const initials = (email ?? "A").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#1F2024] bg-[#070809]/90 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-[#1F2024] bg-[#0B0C10] p-0 text-white">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <AdminNav onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight text-white">PROFIRA</span>
          <span className="text-xs uppercase tracking-[0.3em] text-[#D61F3A]">Back Office</span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 px-2 text-white hover:bg-white/5">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-[#D61F3A]/20 text-xs text-white">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">{email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="border-[#1F2024] bg-[#14151A] text-white">
          <DropdownMenuLabel className="text-xs text-[#B8B8B8]">{email}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#1F2024]" />
          <DropdownMenuItem onClick={signOut} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
