import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Payments() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, invoices(invoice_number, customers(company_name))")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Payments</h1>
        <p className="text-sm text-muted-foreground">View all payment records across invoices.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : payments.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">No payments recorded yet.</p>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{format(new Date(p.payment_date), "dd MMM yyyy")}</TableCell>
                  <TableCell className="font-medium">{p.invoices?.invoice_number ?? "—"}</TableCell>
                  <TableCell>{p.invoices?.customers?.company_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{p.payment_method}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    R {Number(p.amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.reference || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
