import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listFunds, createFund } from "@/lib/admin/funds.functions";
import { fmtINR, fmtDateIST } from "@/lib/admin/format";

export const Route = createFileRoute("/_authenticated/admin/funds")({
  component: FundsPage,
});

function FundsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listFunds);
  const createFn = useServerFn(createFund);
  const { data } = useQuery({ queryKey: ["admin", "funds"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [aum, setAum] = useState("0");

  const m = useMutation({
    mutationFn: () => createFn({ data: { name, aum: Number(aum) } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "funds"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Fund created");
      setOpen(false);
      setName("");
      setAum("0");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Funds</h1>
          <p className="text-sm text-[#B8B8B8]">{(data ?? []).length} fund{(data ?? []).length === 1 ? "" : "s"}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D61F3A] text-white hover:bg-[#B8172F]"><Plus className="mr-1.5 h-4 w-4" />New fund</Button>
          </DialogTrigger>
          <DialogContent className="border-[#1F2024] bg-[#14151A] text-white">
            <DialogHeader><DialogTitle>Create fund</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#B8B8B8]">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="border-[#1F2024] bg-[#0B0C10] text-white" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#B8B8B8]">AUM (₹)</Label>
                <Input type="number" value={aum} onChange={(e) => setAum(e.target.value)} className="border-[#1F2024] bg-[#0B0C10] text-white" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => m.mutate()} disabled={m.isPending || !name} className="bg-[#D61F3A] text-white hover:bg-[#B8172F]">
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="admin-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#1F2024] hover:bg-transparent">
              <TableHead className="text-[#B8B8B8]">Name</TableHead>
              <TableHead className="text-right text-[#B8B8B8]">AUM</TableHead>
              <TableHead className="text-[#B8B8B8]">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((f) => (
              <TableRow key={f.id} className="border-[#1F2024]">
                <TableCell className="font-medium text-white">{f.name}</TableCell>
                <TableCell className="text-right text-white">{fmtINR(Number(f.aum))}</TableCell>
                <TableCell className="text-xs text-[#B8B8B8]">{fmtDateIST(f.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
