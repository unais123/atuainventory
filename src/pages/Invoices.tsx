import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceDetailDialog } from "@/components/InvoiceDetailDialog";
import { MobileCard } from "@/components/MobileCardView";
import { useIsMobile } from "@/hooks/use-mobile";

const fmt = (n: number) => `SAR ${n.toLocaleString("en", { minimumFractionDigits: 2 })}`;

export default function Invoices() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(company_name)")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const openDetail = (inv: any) => { setSelectedInvoice(inv); setDetailOpen(true); };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="page-header">Invoices</h1>
          <p className="text-sm text-muted-foreground">Generate and manage service invoices.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Export</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search invoices..." className="pl-9 h-9" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : invoices.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">No invoices yet.</p>
      ) : isMobile ? (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <MobileCard
              key={inv.id}
              title={inv.customers?.company_name ?? "—"}
              subtitle={`#${inv.invoice_number} · ${inv.date}`}
              status={inv.status}
              onClick={() => openDetail(inv)}
              fields={[
                { label: "Hardware", value: fmt(Number(inv.hardware_total)) },
                { label: "Service", value: fmt(Number(inv.service_charges)) },
                { label: "VAT", value: fmt(Number(inv.vat)) },
                { label: "Total", value: <span className="font-semibold">{fmt(Number(inv.total))}</span> },
              ]}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Hardware</TableHead>
                <TableHead className="text-right">Service</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(inv)}>
                  <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                  <TableCell className="font-medium">{inv.customers?.company_name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                  <TableCell className="text-right">{fmt(Number(inv.hardware_total))}</TableCell>
                  <TableCell className="text-right">{fmt(Number(inv.service_charges))}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{fmt(Number(inv.vat))}</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(Number(inv.total))}</TableCell>
                  <TableCell><StatusBadge status={inv.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <InvoiceDetailDialog invoice={selectedInvoice} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
