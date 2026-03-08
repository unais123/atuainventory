import { Package, AlertTriangle, ClipboardList, Wrench, DollarSign, FileWarning } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { dashboardStats, serviceRequests, invoices, inventoryItems } from "@/lib/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fmt = (n: number) => `SAR ${n.toLocaleString("en", { minimumFractionDigits: 0 })}`;

export default function Dashboard() {
  const lowStockItems = inventoryItems.filter((i) => i.quantity <= i.minStock);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Inventory Value" value={fmt(dashboardStats.totalInventoryValue)} icon={Package} trend="+4.5% this month" trendUp />
        <StatCard title="Low Stock Items" value={dashboardStats.lowStockItems} icon={AlertTriangle} variant="warning" />
        <StatCard title="Pending Requests" value={dashboardStats.pendingRequests} icon={ClipboardList} />
        <StatCard title="Jobs In Progress" value={dashboardStats.jobsInProgress} icon={Wrench} variant="accent" />
        <StatCard title="Monthly Revenue" value={fmt(dashboardStats.monthlyRevenue)} icon={DollarSign} trend="+12% vs last month" trendUp />
        <StatCard title="Pending Invoices" value={fmt(dashboardStats.pendingInvoices)} icon={FileWarning} variant="destructive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Service Requests */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold mb-4 text-card-foreground">Recent Service Requests</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceRequests.slice(0, 4).map((sr) => (
                <TableRow key={sr.id}>
                  <TableCell className="font-mono text-xs">{sr.id}</TableCell>
                  <TableCell className="font-medium">{sr.customer}</TableCell>
                  <TableCell>{sr.type}</TableCell>
                  <TableCell><StatusBadge status={sr.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold mb-4 text-card-foreground">Low Stock Alerts</h2>
          {lowStockItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">All items are well stocked.</p>
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
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-destructive font-semibold">{item.quantity}</TableCell>
                    <TableCell>{item.minStock}</TableCell>
                    <TableCell className="text-muted-foreground">{item.warehouse}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="rounded-xl border bg-card p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-card-foreground">Recent Invoices</h2>
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
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                  <TableCell className="font-medium">{inv.customer}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(inv.total)}</TableCell>
                  <TableCell><StatusBadge status={inv.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
