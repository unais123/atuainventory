import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Package, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SupplierDetailDialogProps {
  supplier: { id: string; name: string; contact_person: string | null; phone: string | null; email: string | null; address: string | null } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierDetailDialog({ supplier, open, onOpenChange }: SupplierDetailDialogProps) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", contact_person: "", phone: "", email: "", address: "" });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["supplier-products", supplier?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, item_name, brand, model, category, quantity, purchase_price, selling_price")
        .eq("supplier_id", supplier!.id)
        .order("item_name");
      if (error) throw error;
      return data;
    },
    enabled: !!supplier?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("suppliers").update({
        name: form.name,
        contact_person: form.contact_person || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
      }).eq("id", supplier!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Supplier updated");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setEditing(false);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("suppliers").delete().eq("id", supplier!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Supplier deleted");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = () => {
    if (!supplier) return;
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });
    setEditing(true);
  };

  if (!supplier) return null;

  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = products.reduce((sum, p) => sum + p.quantity * Number(p.purchase_price), 0);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setEditing(false); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            {editing ? "Edit Supplier" : supplier.name}
            {!editing && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={startEdit}><Pencil className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete {supplier.name}. Inventory items linked to this supplier will be unlinked.</AlertDialogDescription>
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
        </DialogHeader>

        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {supplier.contact_person && <span>{supplier.contact_person}</span>}
              {supplier.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{supplier.phone}</span>}
              {supplier.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{supplier.email}</span>}
              {supplier.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{supplier.address}</span>}
            </div>

            <div className="flex gap-4 mt-2">
              <div className="rounded-lg border bg-muted/50 p-3 flex-1 text-center">
                <p className="text-2xl font-bold text-foreground">{products.length}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3 flex-1 text-center">
                <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                <p className="text-xs text-muted-foreground">Total Qty</p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3 flex-1 text-center">
                <p className="text-2xl font-bold text-foreground">SAR {totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
            </div>

            <div className="mt-2">
              <h3 className="text-sm font-semibold flex items-center gap-1 mb-2">
                <Package className="h-4 w-4" /> Products Supplied
              </h3>
              {isLoading ? (
                <Skeleton className="h-24 w-full rounded-lg" />
              ) : products.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No products linked to this supplier yet.</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Purchase</TableHead>
                        <TableHead className="text-right">Selling</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <p className="font-medium">{p.item_name}</p>
                            {(p.brand || p.model) && <p className="text-xs text-muted-foreground">{[p.brand, p.model].filter(Boolean).join(" · ")}</p>}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{p.category || "—"}</TableCell>
                          <TableCell className="text-right">{p.quantity}</TableCell>
                          <TableCell className="text-right">SAR {Number(p.purchase_price).toLocaleString()}</TableCell>
                          <TableCell className="text-right">SAR {Number(p.selling_price).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
