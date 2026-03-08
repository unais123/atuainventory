import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Package, DollarSign, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const COLORS = [
  "hsl(210, 100%, 45%)",
  "hsl(168, 70%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(152, 60%, 42%)",
  "hsl(270, 60%, 55%)",
];

const fmt = (n: number) => `SAR ${n.toLocaleString("en")}`;

function ChartCard({ title, icon: Icon, children, loading }: { title: string; icon: React.ElementType; children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-card-foreground">{title}</h2>
      </div>
      {loading ? <Skeleton className="h-[250px] sm:h-[280px] w-full rounded-lg" /> : children}
    </div>
  );
}

export default function Reports() {
  // Monthly revenue from paid invoices
  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ["reports-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("date, total, hardware_total, service_charges, status")
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Inventory for valuation by category
  const { data: inventory = [], isLoading: invItemsLoading } = useQuery({
    queryKey: ["reports-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("category, quantity, selling_price, purchase_price");
      if (error) throw error;
      return data;
    },
  });

  // Service jobs with employees for performance
  const { data: serviceJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["reports-service-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_jobs")
        .select("status, start_time, end_time, service_job_employees(employee_id, employees(name))");
      if (error) throw error;
      return data;
    },
  });

  // Payments for expense tracking
  const { data: payments = [], isLoading: payLoading } = useQuery({
    queryKey: ["reports-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("payment_date, amount")
        .order("payment_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Build monthly revenue data (last 6 months)
  const monthlyRevenueData = (() => {
    const months: { month: string; revenue: number; payments: number; from: Date; to: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months.push({
        month: format(d, "MMM"),
        revenue: 0,
        payments: 0,
        from: startOfMonth(d),
        to: endOfMonth(d),
      });
    }
    invoices.forEach((inv) => {
      const invDate = new Date(inv.date);
      const m = months.find((m) => invDate >= m.from && invDate <= m.to);
      if (m) m.revenue += Number(inv.total);
    });
    payments.forEach((p) => {
      const pDate = new Date(p.payment_date);
      const m = months.find((m) => pDate >= m.from && pDate <= m.to);
      if (m) m.payments += Number(p.amount);
    });
    return months.map(({ month, revenue, payments }) => ({ month, revenue: Math.round(revenue), payments: Math.round(payments) }));
  })();

  // Inventory valuation by category
  const inventoryValuationData = (() => {
    const cats: Record<string, number> = {};
    inventory.forEach((item) => {
      const cat = item.category || "Uncategorized";
      cats[cat] = (cats[cat] || 0) + item.quantity * Number(item.selling_price);
    });
    return Object.entries(cats)
      .map(([category, value]) => ({ category, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  })();

  const totalValuation = inventoryValuationData.reduce((s, d) => s + d.value, 0);

  // Hardware stock by category
  const hardwareUsageData = (() => {
    const cats: Record<string, number> = {};
    inventory.forEach((item) => {
      const cat = item.category || "Uncategorized";
      cats[cat] = (cats[cat] || 0) + item.quantity;
    });
    return Object.entries(cats)
      .map(([name, used]) => ({ name, used }))
      .sort((a, b) => b.used - a.used)
      .slice(0, 8);
  })();

  // Employee performance from service jobs
  const technicianPerformanceData = (() => {
    const empMap: Record<string, { name: string; completed: number; totalHours: number }> = {};
    serviceJobs.forEach((job: any) => {
      const emps = job.service_job_employees || [];
      emps.forEach((sje: any) => {
        const empName = sje.employees?.name;
        if (!empName) return;
        if (!empMap[sje.employee_id]) {
          empMap[sje.employee_id] = { name: empName, completed: 0, totalHours: 0 };
        }
        if (job.status === "Completed") {
          empMap[sje.employee_id].completed++;
          if (job.start_time && job.end_time) {
            const hours = (new Date(job.end_time).getTime() - new Date(job.start_time).getTime()) / 3600000;
            empMap[sje.employee_id].totalHours += hours;
          }
        }
      });
    });
    return Object.values(empMap)
      .map((e) => ({
        name: e.name,
        completed: e.completed,
        avgHours: e.completed > 0 ? Math.round((e.totalHours / e.completed) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 8);
  })();

  const loading = invLoading || invItemsLoading || jobsLoading || payLoading;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="page-header">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Insights across revenue, inventory, and team performance.</p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Monthly Revenue */}
        <ChartCard title="Monthly Revenue vs Payments" icon={TrendingUp} loading={loading}>
          {monthlyRevenueData.every((d) => d.revenue === 0 && d.payments === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-16">No invoice or payment data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(220,10%,50%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(220,10%,50%)", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)" }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="hsl(210,100%,45%)" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                <Line type="monotone" dataKey="payments" stroke="hsl(152,60%,42%)" strokeWidth={2} dot={{ r: 4 }} name="Payments" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Inventory Valuation */}
        <ChartCard title={`Inventory Valuation — ${fmt(totalValuation)}`} icon={DollarSign} loading={loading}>
          {inventoryValuationData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No inventory data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={inventoryValuationData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="category"
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                >
                  {inventoryValuationData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Hardware Stock by Category */}
        <ChartCard title="Stock by Category" icon={Package} loading={loading}>
          {hardwareUsageData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No inventory data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={hardwareUsageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis type="number" tick={{ fill: "hsl(220,10%,50%)", fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: "hsl(220,10%,50%)", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)" }} />
                <Bar dataKey="used" name="Units in Stock" radius={[0, 4, 4, 0]}>
                  {hardwareUsageData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Employee Performance */}
        <ChartCard title="Employee Performance" icon={Users} loading={loading}>
          {technicianPerformanceData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No completed service jobs yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={technicianPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(220,10%,50%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(220,10%,50%)", fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)" }} />
                <Legend />
                <Bar dataKey="completed" name="Jobs Completed" fill="hsl(210,100%,45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgHours" name="Avg Hours" fill="hsl(168,70%,42%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
