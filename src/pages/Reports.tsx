import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Package, DollarSign, Users } from "lucide-react";
import {
  monthlyRevenueData,
  hardwareUsageData,
  inventoryValuationData,
  technicianPerformanceData,
} from "@/lib/report-data";

const COLORS = [
  "hsl(210, 100%, 45%)",   // primary
  "hsl(168, 70%, 42%)",    // accent
  "hsl(38, 92%, 50%)",     // warning
  "hsl(0, 72%, 51%)",      // destructive
  "hsl(152, 60%, 42%)",    // success
  "hsl(270, 60%, 55%)",    // purple
];

const fmt = (n: number) => `SAR ${n.toLocaleString("en")}`;

function ChartCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Reports() {
  const totalValuation = inventoryValuationData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Insights across revenue, inventory, and team performance.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Revenue */}
        <ChartCard title="Monthly Revenue vs Expenses" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(220,10%,50%)", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(220,10%,50%)", fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)" }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="hsl(210,100%,45%)" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="hsl(0,72%,51%)" strokeWidth={2} dot={{ r: 4 }} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Inventory Valuation */}
        <ChartCard title={`Inventory Valuation — ${fmt(totalValuation)}`} icon={DollarSign}>
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
        </ChartCard>

        {/* Hardware Usage */}
        <ChartCard title="Hardware Usage (Last 6 Months)" icon={Package}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hardwareUsageData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
              <XAxis type="number" tick={{ fill: "hsl(220,10%,50%)", fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fill: "hsl(220,10%,50%)", fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)" }} />
              <Bar dataKey="used" name="Units Used" radius={[0, 4, 4, 0]}>
                {hardwareUsageData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Technician Performance */}
        <ChartCard title="Technician Performance" icon={Users}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={technicianPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(220,10%,50%)", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(220,10%,50%)", fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(220,15%,90%)" }} />
              <Legend />
              <Bar dataKey="completed" name="Jobs Completed" fill="hsl(210,100%,45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="avgTime" name="Avg Hours" fill="hsl(168,70%,42%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
