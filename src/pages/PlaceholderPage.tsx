import { Construction } from "lucide-react";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Construction className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <h1 className="page-header">{title}</h1>
      <p className="text-sm text-muted-foreground mt-2">This module is coming soon.</p>
    </div>
  );
}
