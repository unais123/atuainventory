import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  variant?: "default" | "accent" | "warning" | "destructive";
}

const variantStyles = {
  default: "border-l-primary",
  accent: "border-l-accent",
  warning: "border-l-warning",
  destructive: "border-l-destructive",
};

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatCard({ title, value, icon: Icon, trend, trendUp, variant = "default" }: StatCardProps) {
  return (
    <div className={cn("stat-card border-l-4 animate-fade-in", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label mb-1">{title}</p>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
          {trend && (
            <p className={cn("text-xs mt-1 font-medium", trendUp ? "text-success" : "text-destructive")}>
              {trend}
            </p>
          )}
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", iconVariantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
