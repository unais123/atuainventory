import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Mail, Phone, MapPin, ShoppingCart } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { CreateOrderDialog } from "./CreateOrderDialog";

interface Customer {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  vat_number: string | null;
}

interface Props {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fmt = (n: number) => `SAR ${n.toLocaleString("en", { minimumFractionDigits: 2 })}`;

export function CustomerDetailDialog({ customer, open, onOpenChange }: Props) {
  const [orderOpen, setOrderOpen] = useState(false);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["customer-invoices", customer?.id],
    queryFn: async () => {
      if (!customer) return [];
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("customer_id", customer.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!customer && open,
  });

  if (!customer) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{customer.company_name}</DialogTitle>
            <DialogDescription>Customer details and order history</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {customer.contact_person && (
                <div><span className="text-muted-foreground">Contact:</span> {customer.contact_person}</div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground" />{customer.phone}</div>
              )}
              {customer.email && (
                <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted-foreground" />{customer.email}</div>
              )}
              {customer.address && (
                <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground" />{customer.address}</div>
              )}
              {customer.vat_number && (
                <div><span className="text-muted-foreground">VAT:</span> <span className="font-mono text-xs">{customer.vat_number}</span></div>
              )}
            </div>

            {/* Create Order Button */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Order / Invoice History</h3>
              <Button size="sm" onClick={() => setOrderOpen(true)}>
                <ShoppingCart className="h-4 w-4 mr-1" />Create Order
              </Button>
            </div>

            {/* Invoices Table */}
            <div className="rounded-lg border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">No orders yet.</TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                        <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(Number(inv.total))}</TableCell>
                        <TableCell><StatusBadge status={inv.status} /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateOrderDialog
        customerId={customer.id}
        customerName={customer.company_name}
        open={orderOpen}
        onOpenChange={setOrderOpen}
      />
    </>
  );
}
