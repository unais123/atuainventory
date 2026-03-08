import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  "Pending": "bg-warning/15 text-warning border-warning/30",
  "Assigned": "bg-info/15 text-info border-info/30",
  "In Progress": "bg-primary/15 text-primary border-primary/30",
  "Completed": "bg-success/15 text-success border-success/30",
  "Invoiced": "bg-accent/15 text-accent border-accent/30",
  "Paid": "bg-success/15 text-success border-success/30",
  "Overdue": "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium text-xs", statusStyles[status] || "")}>
      {status}
    </Badge>
  );
}
