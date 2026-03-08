import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, AlertTriangle, ClipboardList, Wrench, DollarSign, FileWarning } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

const fmt = (n: number) => `SAR ${n.toLocaleString("en", { minimumFractionDigits: 0 })}`;

export default function Dashboard() {
  const isMobile = useIsMobile();

  const { data: inventory = [], isLoading: invLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: serviceRequests = [], isLoading: srLoading } = useQuery({
    queryKey: ["service_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*, customers(company_name)")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices = [], isLoading: invLoadingInv } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers(company_name)")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalValue = inventory.reduce((s, i) => s + Number(i.selling_price) * i.quantity, 0);
  const lowStockItems = inventory.filter((i) => i.quantity <= i.min_stock);
  const pendingRequests = serviceRequests.filter((r) => r.status === "Pending").length;
  const inProgressJobs = serviceRequests.filter((r) => r.status === "In Progress").length;
  const monthlyRevenue = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + Number(i.total), 0);
  const pendingInvoices = invoices.filter((i) => i.status === "Pending" || i.status === "Overdue").reduce((s, i) => s + Number(i.total), 0);

  const loading = invLoading || srLoading || invLoadingInv;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 sm:h-28 rounded-xl" />)
        ) : (
          <>
            <StatCard title="Inventory Value" value={fmt(totalValue)} icon={Package} />
            <StatCard title="Low Stock Items" value={lowStockItems.length} icon={AlertTriangle} variant="warning" />
            <StatCard title="Pending Requests" value={pendingRequests} icon={ClipboardList} />
            <StatCard title="Jobs In Progress" value={inProgressJobs} icon={Wrench} variant="accent" />
            <StatCard title="Monthly Revenue" value={fmt(monthlyRevenue)} icon={DollarSign} />
            <StatCard title="Pending Invoices" value={fmt(pendingInvoices)} icon={FileWarning} variant="destructive" />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-4 sm:p-5">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-card-foreground">Recent Service Requests</h2>
          {isMobile ? (
            <div className="space-y-2">
              {srLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
              ) : serviceRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No requests yet.</p>
              ) : (
                serviceRequests.slice(0, 4).map((sr) => (
                  <div key={sr.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{sr.customers?.company_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{sr.service_type}</p>
                    </div>
                    <StatusBadge status={sr.status} />
                  </div>
                ))
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {srLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                  ))
                ) : serviceRequests.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No requests yet.</TableCell></TableRow>
                ) : (
                  serviceRequests.slice(0, 4).map((sr) => (
                    <TableRow key={sr.id}>
                      <TableCell className="font-medium">{sr.customers?.company_name ?? "—"}</TableCell>
                      <TableCell>{sr.service_type}</TableCell>
                      <TableCell><StatusBadge status={sr.status} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4 sm:p-5">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-card-foreground">Low Stock Alerts</h2>
          {invLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : lowStockItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">All items are well stocked.</p>
          ) : isMobile ? (
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.item_name}</p>
                    <p className="text-xs text-muted-foreground">{item.warehouse}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-destructive">{item.quantity}</p>
                    <p className="text-xs text-muted-foreground">min {item.min_stock}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>In Stock</TableHead>
                  <TableHead>Min Required</TableHead>
                  <TableHead>Warehouse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell className="text-destructive font-semibold">{item.quantity}</TableCell>
                    <TableCell>{item.min_stock}</TableCell>
                    <TableCell className="text-muted-foreground">{item.warehouse}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4 sm:p-5 lg:col-span-2">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-card-foreground">Recent Invoices</h2>
          {isMobile ? (
            <div className="space-y-2">
              {invLoadingInv ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
              ) : invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No invoices yet.</p>
              ) : (
                invoices.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{inv.customers?.company_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">#{inv.invoice_number} · {inv.date}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold">{fmt(Number(inv.total))}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invLoadingInv ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                  ))
                ) : invoices.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No invoices yet.</TableCell></TableRow>
                ) : (
                  invoices.slice(0, 5).map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                      <TableCell className="font-medium">{inv.customers?.company_name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(Number(inv.total))}</TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
