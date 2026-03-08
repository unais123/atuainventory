import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AddCustomerDialog } from "@/components/AddCustomerDialog";
import { CustomerDetailDialog } from "@/components/CustomerDetailDialog";

export default function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return !q || [c.company_name, c.contact_person, c.email, c.phone, c.vat_number]
      .some((v) => v?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage customer records and history.</p>
        </div>
        <AddCustomerDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">No customers yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {customers.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelectedCustomer(c); setDetailOpen(true); }}
            >
              <p className="font-semibold text-card-foreground">{c.company_name}</p>
              <p className="text-sm text-muted-foreground mt-1">{c.contact_person}</p>
              <div className="mt-3 space-y-1.5">
                {c.phone && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />{c.phone}
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />{c.email}
                  </div>
                )}
              </div>
              {c.vat_number && (
                <p className="text-[10px] font-mono text-muted-foreground/60 mt-3">VAT: {c.vat_number}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <CustomerDetailDialog
        customer={selectedCustomer}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
