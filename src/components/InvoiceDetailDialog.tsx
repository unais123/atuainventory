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

  const { data: companySettings } = useQuery({
    queryKey: ["company_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!invoice) return null;

  const numberToWords = (num: number): string => {
    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    if (num === 0) return 'Zero';
    const convert = (n: number): string => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convert(n % 1000000) : '');
    };
    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);
    let result = convert(intPart) + ' Saudi Riyals';
    if (decPart > 0) result += ' and ' + convert(decPart) + ' Halalas';
    return result + ' Only';
  };

  const handleDownload = () => {
    const cs = companySettings;
    const subtotal = Number(invoice.hardware_total) + Number(invoice.labor_charges) + Number(invoice.service_charges);
    const vatAmount = Number(invoice.vat);
    const total = Number(invoice.total);
    const logoHtml = cs?.logo_url ? `<img src="${cs.logo_url}" style="max-height:60px;max-width:180px;object-fit:contain" />` : '';
    const companyNameEn = cs?.company_name || '';
    const companyNameAr = cs?.company_name_ar || '';

    const itemsHtml = items.map((item, idx) => {
      const lineTotal = Number(item.total);
      const lineVat = lineTotal * 0.15;
      return `<tr>
        <td>${idx + 1}</td>
        <td style="text-align:left">${item.description}</td>
        <td>Unit</td>
        <td>${item.quantity}</td>
        <td>${Number(item.unit_price).toFixed(2)}</td>
        <td>${lineTotal.toFixed(2)}</td>
        <td>${lineVat.toFixed(2)}</td>
        <td>${(lineTotal + lineVat).toFixed(2)}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ${invoice.invoice_number}</title>
<style>
@page{size:A4 portrait;margin:15mm 10mm}
body{font-family:Arial,sans-serif;margin:0;padding:0}
.page{width:210mm;min-height:297mm;margin:auto;padding:10mm 5mm 30mm;position:relative;background:#fff;box-sizing:border-box}
.invoice-header{width:100%;display:flex;align-items:center;padding-bottom:5px;justify-content:space-between}
.invoice-header .left{font-size:12px;color:#b30000;font-weight:bold}
.invoice-header .center{font-size:15px;color:#2a7cc7;font-weight:bold;text-align:center;flex:1}
.invoice-header .logo{text-align:right}
.section{margin-bottom:20px}
.client-header{font-weight:bold;font-size:13px;color:#0074cc;margin-bottom:8px}
.full-table{width:100%;border-collapse:collapse;font-size:11px;margin-top:10px}
.full-table th,.full-table td{border:1px solid #fff;padding:8px 6px;text-align:left;vertical-align:top}
.full-table .rtl{text-align:right;font-weight:bold}
.full-table .rtl-text{text-align:right}
table th,table td{padding:6px 10px;text-align:left;border:1px solid #000}
table th{background:#fff}
.bold{font-weight:bold}
.meta-table{width:100%;border-collapse:collapse;font-size:11px}
.meta-table th,.meta-table td{border:1px solid #000;padding:6px 8px;text-align:center}
.meta-table th{font-weight:bold}
.item-table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:20px}
.item-table th,.item-table td{border:1px solid #000;padding:8px 6px;text-align:center}
.amount-summary{display:flex;justify-content:flex-end;font-size:11px}
.totals-box table{border-collapse:collapse;width:350px;font-size:11px}
.totals-box th,.totals-box td{border:1px solid #000;padding:8px;text-align:left}
.totals-box .right{text-align:right}
.amount-in-words{margin-top:5px;border:1px solid #000;padding:10px;font-size:10.5px}
.signature-table{width:100%;border-collapse:collapse;border:1px solid #000;margin-top:10px;font-size:11.5px}
.signature-table th,.signature-table td{border:1px solid #000;padding:8px;vertical-align:top;text-align:left}
.signature-table .label{font-weight:bold}
.qr-cell{text-align:center;vertical-align:middle;width:150px}
@media print{.page{page-break-after:always}body{padding:0}}
</style></head><body>
<div class="page"><main>
<div class="invoice-header">
  <div class="left">Invoice No / رقم الفاتورة : <span style="color:#b30000">${invoice.invoice_number}</span></div>
  <div class="center">TAX INVOICE / فاتورة ضريبية<br><span style="font-size:11px">${companyNameEn}${companyNameAr ? ' / ' + companyNameAr : ''}</span></div>
  <div class="logo">${logoHtml}</div>
</div>

<div style="margin-top:2%" class="section">
  <div class="client-header">Client Details / <span>تفاصيل العميل</span></div>
  <table class="full-table">
    <tr><th>Name</th><td colspan="3" class="bold">${customer?.company_name ?? ""}</td><td colspan="3" class="bold rtl-text"></td><th class="rtl">الاسم</th></tr>
    <tr><th>Contact</th><td colspan="3">${customer?.contact_person ?? ""}</td><td colspan="3" class="rtl-text"></td><th class="rtl">جهة الاتصال</th></tr>
    <tr><th>Address</th><td colspan="3">${customer?.address ?? ""}</td><td colspan="3" class="rtl-text"></td><th class="rtl">العنوان</th></tr>
    <tr><th>Phone</th><td>${customer?.phone ?? ""}</td><th>Email</th><td>${customer?.email ?? ""}</td><td class="rtl-text"></td><th class="rtl">البريد</th><td class="rtl-text"></td><th class="rtl">الهاتف</th></tr>
    <tr><th>VAT No</th><td colspan="3">${customer?.vat_number ?? ""}</td><td colspan="3" class="rtl-text"></td><th class="rtl">الرقم الضريبي</th></tr>
  </table>
</div>

<div class="section">
  <table class="meta-table">
    <tr>
      <th>Invoice Date<br><span>تاريخ الفاتورة</span></th>
      <th>Status<br><span>الحالة</span></th>
      <th>Payment Type<br><span>نوع الدفع</span></th>
    </tr>
    <tr>
      <td>${invoice.date}</td>
      <td>${invoice.status}</td>
      <td>—</td>
    </tr>
  </table>
</div>

<div class="section">
  <table class="item-table">
    <thead><tr>
      <th>SL.</th>
      <th>Description<br><span>البيان</span></th>
      <th>Unit<br><span>وحدة</span></th>
      <th>Qty<br><span>الكمية</span></th>
      <th>Unit Price<br><span>سعر الوحدة</span></th>
      <th>Amount Excl VAT (SAR)<br><span>المبلغ باستثناء الضريبة</span></th>
      <th>VAT (SAR)<br><span>الضريبة</span></th>
      <th>Amount Incl VAT (SAR)<br><span>الإجمالي شامل الضريبة</span></th>
    </tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
</div>

<div class="section amount-summary">
  <div class="totals-box"><table>
    <tr><th style="border-right:0">Total Amount Excl VAT (SAR)<br><span>المجموع باستثناء الضريبة</span></th><td class="right" style="border-left:0">SAR ${subtotal.toFixed(2)}</td></tr>
    <tr><th style="border-right:0">VAT Amount (SAR)<br><span>قيمة الضريبة</span></th><td class="right" style="border-left:0">SAR ${vatAmount.toFixed(2)}</td></tr>
    <tr><th style="border-right:0">Total Amount Incl. VAT (SAR)<br><span>الإجمالي شامل الضريبة</span></th><td class="right bold" style="border-left:0">SAR ${total.toFixed(2)}</td></tr>
    <tr><th style="border-right:0">Balance Due<br><span>قيمة الفاتورة</span></th><td class="right bold" style="border-left:0">SAR ${total.toFixed(2)}</td></tr>
  </table></div>
</div>

<div class="section">
  <div class="amount-in-words"><strong>Amount In Words :</strong> ${numberToWords(total)}</div>
</div>

<table class="signature-table" style="page-break-before:always">
  <tr>
    <th colspan="2">Bank Details / التفاصيل المصرفية</th>
    <th>Prepared By<br><span>أعدت بواسطة</span></th>
    <th>Received By<br><span>استلمت من قبل</span></th>
  </tr>
  <tr>
    <td class="label">Account Name<br><span>إسم الحساب</span></td>
    <td>\${cs?.bank_account_name || ''}</td>
    <td style="text-align:center;border-bottom:0" rowspan="3"></td>
    <td style="text-align:center;border-bottom:0" rowspan="3"></td>
  </tr>
  <tr>
    <td class="label">Bank Name<br><span>اسم البنك</span></td>
    <td>\${cs?.bank_name || ''}</td>
  </tr>
  <tr>
    <td class="label">Account No<br><span>رقم حساب</span></td>
    <td>\${cs?.bank_account_no || ''}</td>
  </tr>
  <tr>
    <td class="label">IBAN No<br><span>رقم البنك الدولي</span></td>
    <td>\${cs?.bank_iban || ''}</td>
    <td style="text-align:center;border-top:0">Signature with Stamp</td>
    <td style="text-align:center;border-top:0">Signature with Stamp</td>
  </tr>
</table>

</main></div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;

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
