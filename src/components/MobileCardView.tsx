import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Field {
  label: string;
  value: React.ReactNode;
  className?: string;
}

interface MobileCardProps {
  title: string;
  subtitle?: string;
  fields: Field[];
  onClick?: () => void;
  status?: string;
  badge?: { label: string; variant?: "default" | "secondary" | "destructive" | "outline"; className?: string };
  actions?: React.ReactNode;
}

export function MobileCard({ title, subtitle, fields, onClick, status, badge, actions }: MobileCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 space-y-3 transition-shadow",
        onClick && "cursor-pointer hover:shadow-md active:shadow-sm"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-card-foreground truncate">{title}</p>
          {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status && <StatusBadge status={status} />}
          {badge && (
            <Badge variant={badge.variant || "secondary"} className={badge.className}>
              {badge.label}
            </Badge>
          )}
          {actions}
        </div>
      </div>
      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {fields.map((f, i) => (
            <div key={i} className={cn("min-w-0", f.className)}>
              <span className="text-muted-foreground text-xs">{f.label}</span>
              <div className="truncate">{f.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
