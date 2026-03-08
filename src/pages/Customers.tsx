import { customers } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Phone } from "lucide-react";

export default function Customers() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage customer records and history.</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Customer</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." className="pl-9 h-9" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {customers.map((c) => (
          <div key={c.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer">
            <p className="font-semibold text-card-foreground">{c.company}</p>
            <p className="text-sm text-muted-foreground mt-1">{c.contact}</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />{c.phone}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />{c.email}
              </div>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground/60 mt-3">VAT: {c.vatNumber}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
