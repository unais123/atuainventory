import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export default function ServiceJobs() {
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["service-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_jobs")
        .select("*, service_requests(service_type, customers(company_name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Service Jobs</h1>
        <p className="text-sm text-muted-foreground">Track technician jobs, hardware usage, and completion status.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">No service jobs yet.</p>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j: any) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">
                    {j.service_requests?.customers?.company_name ?? "—"}
                  </TableCell>
                  <TableCell>{j.service_requests?.service_type ?? "—"}</TableCell>
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
    </div>
  );
}
