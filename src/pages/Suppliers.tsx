import { suppliers } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus, Mail } from "lucide-react";

export default function Suppliers() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Manage hardware suppliers and purchase history.</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Supplier</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {suppliers.map((s) => (
          <div key={s.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
            <p className="font-semibold text-card-foreground">{s.name}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.contact}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Mail className="h-3 w-3" />{s.email}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{s.address}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
