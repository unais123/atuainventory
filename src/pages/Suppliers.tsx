import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddSupplierDialog } from "@/components/AddSupplierDialog";
import { SupplierDetailDialog } from "@/components/SupplierDetailDialog";

export default function Suppliers() {
  const [selected, setSelected] = useState<any>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Get product counts per supplier
  const { data: productCounts = {} } = useQuery({
    queryKey: ["supplier-product-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("supplier_id, quantity, purchase_price");
      if (error) throw error;
      const counts: Record<string, { count: number; totalQty: number; totalValue: number }> = {};
      data.forEach((item) => {
        if (!item.supplier_id) return;
        if (!counts[item.supplier_id]) counts[item.supplier_id] = { count: 0, totalQty: 0, totalValue: 0 };
        counts[item.supplier_id].count++;
        counts[item.supplier_id].totalQty += item.quantity;
        counts[item.supplier_id].totalValue += item.quantity * Number(item.purchase_price);
      });
      return counts;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Manage hardware suppliers and their products.</p>
        </div>
        <AddSupplierDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">No suppliers yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {suppliers.map((s) => {
            const stats = productCounts[s.id];
            return (
              <div
                key={s.id}
                className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelected(s)}
              >
                <p className="font-semibold text-card-foreground">{s.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.contact_person}</p>
                {s.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <Phone className="h-3 w-3" />{s.phone}
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Mail className="h-3 w-3" />{s.email}
                  </div>
                )}
                {stats && (
                  <div className="flex items-center gap-2 text-xs mt-3 text-primary font-medium">
                    <Package className="h-3 w-3" />
                    {stats.count} products · {stats.totalQty} units · SAR {stats.totalValue.toLocaleString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SupplierDetailDialog supplier={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
