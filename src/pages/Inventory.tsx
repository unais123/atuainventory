import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, ScanLine } from "lucide-react";
import { AddInventoryDialog } from "@/components/AddInventoryDialog";
import { EditInventoryDialog } from "@/components/EditInventoryDialog";
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileCard } from "@/components/MobileCardView";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Inventory() {
  const [selected, setSelected] = useState<any>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const isMobile = useIsMobile();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory").select("*").order("item_name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="page-header">Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage hardware stock across all warehouses.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setScannerOpen(true)}>
            <ScanLine className="h-4 w-4 mr-1" />Scan/Type Barcode
          </Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Export</Button>
          <AddInventoryDialog />
        </div>
      </div>

      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={(value) => {
          const match = items.find((i: any) => i.barcode === value || i.serial_number === value);
          if (match) {
            setSelected(match);
            toast.success(`Found: ${match.item_name}`);
          } else {
            toast.error(`No item found for barcode "${value}"`);
          }
        }}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search inventory..." className="pl-9 h-9" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">No inventory items yet.</p>
      ) : isMobile ? (
        <div className="space-y-3">
          {items.map((item) => (
            <MobileCard
              key={item.id}
              title={item.item_name}
              subtitle={[item.category, item.brand].filter(Boolean).join(" · ")}
              onClick={() => setSelected(item)}
              badge={
                item.quantity <= item.min_stock
                  ? { label: `${item.quantity} in stock`, variant: "destructive" as const }
                  : { label: `${item.quantity} in stock`, variant: "secondary" as const }
              }
              fields={[
                { label: "Purchase", value: `SAR ${Number(item.purchase_price).toLocaleString()}` },
                { label: "Selling", value: `SAR ${Number(item.selling_price).toLocaleString()}` },
                { label: "Warehouse", value: item.warehouse || "—" },
              ]}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Purchase</TableHead>
                <TableHead className="text-right">Selling</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Warehouse</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(item)}>
                  <TableCell className="font-medium">{item.item_name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.category}</TableCell>
                  <TableCell>{item.brand}</TableCell>
                  <TableCell className="text-right">SAR {Number(item.purchase_price).toLocaleString()}</TableCell>
                  <TableCell className="text-right">SAR {Number(item.selling_price).toLocaleString()}</TableCell>
                  <TableCell className={cn("text-right font-semibold", item.quantity <= item.min_stock && "text-destructive")}>
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.warehouse}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EditInventoryDialog item={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </div>
  );
}
