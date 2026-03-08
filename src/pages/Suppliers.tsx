import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddSupplierDialog } from "@/components/AddSupplierDialog";

export default function Suppliers() {
  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Manage hardware suppliers and purchase history.</p>
        </div>
        <AddSupplierDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">No suppliers yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {suppliers.map((s) => (
            <div key={s.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
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
              {s.address && <p className="text-xs text-muted-foreground mt-1">{s.address}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
