import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AddServiceRequestDialog } from "@/components/AddServiceRequestDialog";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceRequestDetailDialog } from "@/components/ServiceRequestDetailDialog";
import { MobileCard } from "@/components/MobileCardView";
import { useIsMobile } from "@/hooks/use-mobile";

const priorityStyles: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-primary/10 text-primary border-primary/20",
  High: "bg-warning/10 text-warning border-warning/20",
  Urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function ServiceRequests() {
  const [selected, setSelected] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["service_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*, customers(company_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const openDetail = (sr: any) => { setSelected(sr); setDetailOpen(true); };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="page-header">Service Requests</h1>
          <p className="text-sm text-muted-foreground">Track and manage all service requests.</p>
        </div>
        <AddServiceRequestDialog />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search requests..." className="pl-9 h-9" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : requests.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">No service requests yet.</p>
      ) : isMobile ? (
        <div className="space-y-3">
          {requests.map((sr) => (
            <MobileCard
              key={sr.id}
              title={sr.customers?.company_name ?? "—"}
              subtitle={sr.service_type}
              status={sr.status}
              onClick={() => openDetail(sr)}
              fields={[
                {
                  label: "Priority",
                  value: (
                    <Badge variant="outline" className={priorityStyles[sr.priority] ?? ""}>
                      {sr.priority}
                    </Badge>
                  ),
                },
                { label: "Location", value: sr.location || "—" },
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
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((sr) => (
                <TableRow key={sr.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(sr)}>
                  <TableCell className="font-medium">{sr.customers?.company_name ?? "—"}</TableCell>
                  <TableCell>{sr.service_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={priorityStyles[sr.priority] ?? ""}>{sr.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{sr.location}</TableCell>
                  <TableCell><StatusBadge status={sr.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ServiceRequestDetailDialog request={selected} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
