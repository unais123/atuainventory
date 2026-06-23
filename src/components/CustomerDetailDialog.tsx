import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { Mail, Phone, MapPin, ShoppingCart, Pencil, Trash2, Receipt } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateOrderDialog } from "./CreateOrderDialog";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


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
  const qc = useQueryClient();
  const [orderOpen, setOrderOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ company_name: "", contact_person: "", email: "", phone: "", address: "", vat_number: "" });

  useEffect(() => {
    if (customer) {
      setForm({
        company_name: customer.company_name,
        contact_person: customer.contact_person || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        vat_number: customer.vat_number || "",
      });
    }
  }, [customer]);

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

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("customers").update({
        company_name: form.company_name,
        contact_person: form.contact_person || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        vat_number: form.vat_number || null,
      }).eq("id", customer!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Customer updated");
      qc.invalidateQueries({ queryKey: ["customers"] });
      setEditing(false);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("customers").delete().eq("id", customer!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Customer deleted");
      qc.invalidateQueries({ queryKey: ["customers"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!customer) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) setEditing(false); onOpenChange(o); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              {editing ? "Edit Customer" : customer.company_name}
              {!editing && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete customer?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete {customer.company_name} and may fail if there are linked invoices.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </DialogTitle>
            {!editing && <DialogDescription>Customer details and order history</DialogDescription>}
          </DialogHeader>

          {editing ? (
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>VAT Number</Label>
                <Input value={form.vat_number} onChange={(e) => setForm({ ...form, vat_number: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 py-2">
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

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Order / Invoice History</h3>
                <Button size="sm" onClick={() => setOrderOpen(true)}>
                  <ShoppingCart className="h-4 w-4 mr-1" />Create Order
                </Button>
              </div>

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
          )}
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
