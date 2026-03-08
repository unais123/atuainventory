import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Phone, MapPin, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SupplierDetailDialogProps {
  supplier: { id: string; name: string; contact_person: string | null; phone: string | null; email: string | null; address: string | null } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierDetailDialog({ supplier, open, onOpenChange }: SupplierDetailDialogProps) {
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

  if (!supplier) return null;

  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = products.reduce((sum, p) => sum + p.quantity * Number(p.purchase_price), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {supplier.contact_person && <span>{supplier.contact_person}</span>}
          {supplier.phone && (
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{supplier.phone}</span>
          )}
          {supplier.email && (
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{supplier.email}</span>
          )}
          {supplier.address && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{supplier.address}</span>
          )}
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
            <p className="text-2xl font-bold text-foreground">₹{totalValue.toLocaleString()}</p>
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
            <p className="text-sm text-muted-foreground text-center py-6">No products linked to this supplier yet. Assign this supplier when adding inventory items.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Purchase Price</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.item_name}</p>
                          {(p.brand || p.model) && (
                            <p className="text-xs text-muted-foreground">{[p.brand, p.model].filter(Boolean).join(" · ")}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.category || "—"}</TableCell>
                      <TableCell className="text-right">{p.quantity}</TableCell>
                      <TableCell className="text-right">₹{Number(p.purchase_price).toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{Number(p.selling_price).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
