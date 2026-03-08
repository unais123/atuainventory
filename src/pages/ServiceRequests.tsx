import { serviceRequests } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const priorityStyles: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-primary/10 text-primary border-primary/20",
  High: "bg-warning/10 text-warning border-warning/20",
  Urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function ServiceRequests() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Service Requests</h1>
          <p className="text-sm text-muted-foreground">Track and manage all service requests.</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Request</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search requests..." className="pl-9 h-9" />
      </div>

      <div className="rounded-xl border bg-card overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {serviceRequests.map((sr) => (
              <TableRow key={sr.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-mono text-xs">{sr.id}</TableCell>
                <TableCell className="font-medium">{sr.customer}</TableCell>
                <TableCell>{sr.type}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={priorityStyles[sr.priority]}>{sr.priority}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{sr.technician}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{sr.location}</TableCell>
                <TableCell><StatusBadge status={sr.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
