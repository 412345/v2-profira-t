import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDocument } from "@/lib/admin/documents.functions";
import { fmtINR, fmtDateIST } from "@/lib/admin/format";

export const Route = createFileRoute("/_authenticated/admin/documents/$id")({
  component: DocumentPage,
});

function DocumentPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getDocument);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "document", id],
    queryFn: () => fn({ data: { id } }),
  });

  if (isLoading) return <div className="admin-card p-8 text-center text-sm text-[#B8B8B8]">Loading…</div>;
  if (!data) return null;
  const inv = data.investor!;
  const isAgreement = data.kind === "agreement";

  return (
    <div className="space-y-5">
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="text-[#B8B8B8] hover:bg-white/5">
            <Link to="/admin/investors/$id" params={{ id: inv.id }}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-white capitalize">{data.kind}</h1>
            <p className="text-xs text-[#B8B8B8]">Serial {data.serial_no} · Issued {fmtDateIST(data.issued_at)} IST</p>
          </div>
        </div>
        <Button onClick={() => window.print()} className="bg-[#D61F3A] text-white hover:bg-[#B8172F]">
          <Printer className="mr-1.5 h-4 w-4" /> Print
        </Button>
      </div>

      <div className="mx-auto max-w-3xl rounded-xl border border-[#1F2024] bg-white p-8 text-[#0B0C10] shadow-2xl print:border-0 print:shadow-none">
        <header className="flex items-start justify-between border-b border-zinc-200 pb-5">
          <div>
            <div className="text-lg font-semibold tracking-tight">PROFIRA</div>
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">JS Praetorian Markets Pvt Ltd</div>
          </div>
          <div className="text-right text-xs text-zinc-500">
            <div>{isAgreement ? "Investment Agreement" : "Invoice"}</div>
            <div className="font-mono">{data.serial_no}</div>
            <div>{fmtDateIST(data.issued_at)} IST</div>
          </div>
        </header>

        {isAgreement ? (
          <AgreementBody inv={inv} />
        ) : (
          <InvoiceBody inv={inv} />
        )}

        <footer className="mt-10 grid grid-cols-2 gap-8 border-t border-zinc-200 pt-6 text-xs text-zinc-500">
          <div>
            <div className="mb-8 border-b border-zinc-300" />
            <div>Investor signature</div>
          </div>
          <div>
            <div className="mb-8 border-b border-zinc-300" />
            <div>For PROFIRA · Authorised signatory</div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function AgreementBody({ inv }: { inv: any }) {
  return (
    <div className="space-y-5 pt-6 text-sm leading-relaxed">
      <p>
        This Investment Agreement (the "Agreement") is entered into on <b>{fmtDateIST(new Date())}</b> between
        <b> JS Praetorian Markets Private Limited</b> ("Company") and the Investor named below.
      </p>
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Investor Particulars</h3>
        <dl className="grid grid-cols-2 gap-3">
          <Item label="Full name" value={inv.full_name} />
          <Item label="Email" value={inv.email} />
          <Item label="Phone" value={inv.phone} />
          <Item label="PAN" value={inv.pan} />
          <Item label="Bank A/C" value={inv.bank_account} />
          <Item label="IFSC" value={inv.ifsc} />
        </dl>
      </section>
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Investment Terms</h3>
        <dl className="grid grid-cols-2 gap-3">
          <Item label="Principal amount" value={fmtINR(Number(inv.amount))} />
          <Item label="Tenure" value={`${inv.tenure_months} months`} />
        </dl>
      </section>
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Terms & Conditions</h3>
        <ol className="ml-5 list-decimal space-y-1.5 text-sm">
          <li>The Investor agrees to commit the Principal Amount for the Tenure stated above.</li>
          <li>Distributions, where applicable, are credited to the Investor's nominated bank account.</li>
          <li>The Company shall provide periodic reporting on portfolio performance.</li>
          <li>This Agreement is governed by the laws of India; disputes are subject to Mumbai jurisdiction.</li>
        </ol>
      </section>
    </div>
  );
}

function InvoiceBody({ inv }: { inv: any }) {
  const amount = Number(inv.amount);
  return (
    <div className="space-y-5 pt-6 text-sm">
      <section className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">Billed to</h3>
          <div className="font-medium">{inv.full_name}</div>
          <div className="text-zinc-600">{inv.email}</div>
          <div className="text-zinc-600">{inv.phone}</div>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">From</h3>
          <div className="font-medium">JS Praetorian Markets Pvt Ltd</div>
          <div className="text-zinc-600">PROFIRA Back Office</div>
        </div>
      </section>
      <table className="w-full border-t border-b border-zinc-200">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-zinc-100">
            <td className="py-3">Investment subscription · {inv.tenure_months} months</td>
            <td className="py-3 text-right">{fmtINR(amount)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t border-zinc-200">
            <td className="py-3 text-right font-medium">Total</td>
            <td className="py-3 text-right text-base font-semibold">{fmtINR(amount)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="text-xs text-zinc-500">This invoice is system-generated and valid without a physical signature.</p>
    </div>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
