import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { AddServiceJobDialog } from "@/components/AddServiceJobDialog";
import { ServiceJobDetailDialog } from "@/components/ServiceJobDetailDialog";
import { MobileCard } from "@/components/MobileCardView";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ServiceJobs() {
  const [selected, setSelected] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["service-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_jobs")
        .select("*, service_requests(service_type, customers(company_name)), service_job_employees(employee_id, employees(name, role))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getEmployeeNames = (j: any) =>
    (j.service_job_employees || []).map((sje: any) => sje.employees?.name).filter(Boolean).join(", ");

  const filtered = jobs.filter((j: any) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (j.service_requests?.customers?.company_name ?? "").toLowerCase().includes(q) ||
      (j.service_requests?.service_type ?? "").toLowerCase().includes(q) ||
      (j.status ?? "").toLowerCase().includes(q) ||
      getEmployeeNames(j).toLowerCase().includes(q) ||
      (j.service_notes ?? "").toLowerCase().includes(q)
    );
  });

  const openDetail = (j: any) => { setSelected(j); setDetailOpen(true); };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="page-header">Service Jobs</h1>
          <p className="text-sm text-muted-foreground">Track technician jobs, hardware usage, and completion status.</p>
        </div>
        <AddServiceJobDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search jobs..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">No service jobs found.</p>
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((j: any) => (
            <MobileCard
              key={j.id}
              title={j.service_requests?.customers?.company_name ?? "—"}
              subtitle={j.service_requests?.service_type ?? "—"}
              status={j.status}
              onClick={() => openDetail(j)}
              fields={[
                { label: "Employees", value: getEmployeeNames(j) || "—" },
                { label: "Start", value: j.start_time ? format(new Date(j.start_time), "dd MMM yyyy") : "—" },
                { label: "End", value: j.end_time ? format(new Date(j.end_time), "dd MMM yyyy") : "—" },
                ...(j.service_notes ? [{ label: "Notes", value: j.service_notes, className: "col-span-2" }] : []),
              ]}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((j: any) => (
                <TableRow key={j.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(j)}>
                  <TableCell className="font-medium">
                    {j.service_requests?.customers?.company_name ?? "—"}
                  </TableCell>
                  <TableCell>{j.service_requests?.service_type ?? "—"}</TableCell>
                  <TableCell className="text-sm">{getEmployeeNames(j) || "—"}</TableCell>
                  <TableCell><StatusBadge status={j.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {j.start_time ? format(new Date(j.start_time), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {j.end_time ? format(new Date(j.end_time), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {j.service_notes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ServiceJobDetailDialog job={selected} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
