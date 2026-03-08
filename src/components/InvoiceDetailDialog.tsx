import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Constants } from "@/integrations/supabase/types";

interface Invoice {
  id: string;
  invoice_number: string;
  date: string;
  status: string;
  hardware_total: number;
  labor_charges: number;
  service_charges: number;
  vat: number;
  total: number;
  customer_id: string;
  customers?: { company_name: string } | null;
}

interface Props {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fmt = (n: number) => `SAR ${n.toLocaleString("en", { minimumFractionDigits: 2 })}`;

export function InvoiceDetailDialog({ invoice, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [currentStatus, setCurrentStatus] = useState(invoice?.status ?? "");

  useEffect(() => {
    if (invoice) setCurrentStatus(invoice.status);
  }, [invoice]);

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: newStatus as any })
        .eq("id", invoice!.id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      setCurrentStatus(newStatus);
      toast.success("Invoice status updated");
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["customer-invoices"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["invoice-items", invoice?.id],
    queryFn: async () => {
      if (!invoice) return [];
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", invoice.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!invoice && open,
  });

  const { data: customer } = useQuery({
    queryKey: ["customer-detail", invoice?.customer_id],
    queryFn: async () => {
      if (!invoice) return null;
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", invoice.customer_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!invoice && open,
  });

  if (!invoice) return null;

  const handleDownload = () => {
    const statusClass = invoice.status === "Paid" ? "paid" : invoice.status === "Overdue" ? "overdue" : "";
    const itemsHtml = items.map((item, idx) => `
      <tr><td>${idx + 1}</td><td>${item.description}</td><td class="right">${item.quantity}</td><td class="right">${fmt(Number(item.unit_price))}</td><td class="right">${fmt(Number(item.total))}</td></tr>
    `).join("");

    const laborRow = Number(invoice.labor_charges) > 0 ? `<div class="totals-row"><span class="label">Labor</span><span>${fmt(Number(invoice.labor_charges))}</span></div>` : "";
    const serviceRow = Number(invoice.service_charges) > 0 ? `<div class="totals-row"><span class="label">Service</span><span>${fmt(Number(invoice.service_charges))}</span></div>` : "";

    const html = `<!DOCTYPE html><html><head><title>Invoice ${invoice.invoice_number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;padding:40px;max-width:800px;margin:0 auto}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #e5e7eb}
.title{font-size:28px;font-weight:700}.inv-num{font-size:14px;color:#6b7280;margin-top:4px;font-family:monospace}
.status{display:inline-block;padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:600;background:#dbeafe;color:#1d4ed8}
.status.paid{background:#dcfce7;color:#16a34a}.status.overdue{background:#fee2e2;color:#dc2626}
.section{margin-bottom:24px}.section-title{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;font-weight:600;margin-bottom:8px}
.cust-info{font-size:14px;line-height:1.6}.cust-name{font-weight:600;font-size:15px}
.meta{display:flex;gap:48px;margin-bottom:24px}.meta label{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;font-weight:600}.meta span{display:block;font-size:14px;margin-top:2px}
table{width:100%;border-collapse:collapse;margin-bottom:24px}thead th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;font-weight:600;padding:10px 12px;border-bottom:2px solid #e5e7eb}
th.right,td.right{text-align:right}tbody td{padding:12px;font-size:14px;border-bottom:1px solid #f3f4f6}
.totals{margin-left:auto;width:280px}.totals-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}.totals-row .label{color:#6b7280}
.totals-row.total{font-weight:700;font-size:16px;padding-top:10px;margin-top:6px;border-top:2px solid #111}
.footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af}
@media print{body{padding:20px}}
</style></head><body>
<div class="header"><div><div class="title">INVOICE</div><div class="inv-num">${invoice.invoice_number}</div></div><div class="status ${statusClass}">${invoice.status}</div></div>
<div class="meta"><div><label>Date</label><span>${invoice.date}</span></div></div>
<div class="section"><div class="section-title">Bill To</div><div class="cust-info"><div class="cust-name">${customer?.company_name ?? ""}</div>${customer?.contact_person ? `<div>${customer.contact_person}</div>` : ""}${customer?.email ? `<div>${customer.email}</div>` : ""}${customer?.phone ? `<div>${customer.phone}</div>` : ""}${customer?.address ? `<div>${customer.address}</div>` : ""}${customer?.vat_number ? `<div>VAT: ${customer.vat_number}</div>` : ""}</div></div>
<table><thead><tr><th>#</th><th>Description</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
<div class="totals"><div class="totals-row"><span class="label">Hardware</span><span>${fmt(Number(invoice.hardware_total))}</span></div>${laborRow}${serviceRow}<div class="totals-row"><span class="label">VAT (15%)</span><span>${fmt(Number(invoice.vat))}</span></div><div class="totals-row total"><span>Total</span><span>${fmt(Number(invoice.total))}</span></div></div>
<div class="footer">Thank you for your business</div>
<script>window.onload=function(){window.print()}</script></body></html>`;

    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Invoice {invoice.invoice_number}
            <StatusBadge status={currentStatus} />
          </DialogTitle>
          <DialogDescription>Invoice details and line items</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {customer && (
            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
              <p className="font-semibold">{customer.company_name}</p>
              {customer.contact_person && <p className="text-muted-foreground">{customer.contact_person}</p>}
              {customer.email && <p className="text-muted-foreground">{customer.email}</p>}
              {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
              {customer.address && <p className="text-muted-foreground">{customer.address}</p>}
              {customer.vat_number && <p className="text-muted-foreground font-mono text-xs">VAT: {customer.vat_number}</p>}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div><span className="text-muted-foreground">Date:</span> {invoice.date}</div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Status:</span>
              <Select
                value={currentStatus}
                onValueChange={(v) => statusMutation.mutate(v)}
                disabled={statusMutation.isPending}
              >
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.invoice_status.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Items</h3>
            <div className="rounded-lg border overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground text-xs">#</th>
                    <th className="text-left p-3 font-medium text-muted-foreground text-xs">Description</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs">Qty</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs">Unit Price</th>
                    <th className="text-right p-3 font-medium text-muted-foreground text-xs">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="p-3"><Skeleton className="h-4 w-16" /></td>
                        ))}
                      </tr>
                    ))
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted-foreground py-6">No line items.</td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="p-3 text-muted-foreground">{idx + 1}</td>
                        <td className="p-3">{item.description}</td>
                        <td className="p-3 text-right">{item.quantity}</td>
                        <td className="p-3 text-right">{fmt(Number(item.unit_price))}</td>
                        <td className="p-3 text-right font-medium">{fmt(Number(item.total))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-1.5 text-sm max-w-xs ml-auto">
            <div className="flex justify-between"><span className="text-muted-foreground">Hardware</span><span>{fmt(Number(invoice.hardware_total))}</span></div>
            {Number(invoice.labor_charges) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Labor</span><span>{fmt(Number(invoice.labor_charges))}</span></div>}
            {Number(invoice.service_charges) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span>{fmt(Number(invoice.service_charges))}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">VAT (15%)</span><span>{fmt(Number(invoice.vat))}</span></div>
            <div className="flex justify-between font-semibold pt-1.5 border-t"><span>Total</span><span>{fmt(Number(invoice.total))}</span></div>
          </div>

          <Button onClick={handleDownload} className="w-full">
            <Download className="h-4 w-4 mr-1" />Download Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
