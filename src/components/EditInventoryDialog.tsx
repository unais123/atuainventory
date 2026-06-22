import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, ScanLine, RefreshCw } from "lucide-react";
import { BarcodeDisplay, generateBarcodeValue } from "@/components/BarcodeDisplay";
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog";

interface EditInventoryDialogProps {
  item: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInventoryDialog({ item, open, onOpenChange }: EditInventoryDialogProps) {
  const qc = useQueryClient();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [form, setForm] = useState({
    item_name: "", category: "", brand: "", model: "", serial_number: "", barcode: "",
    purchase_price: "", selling_price: "", quantity: "", min_stock: "", warehouse: "", supplier_id: "",
  });

  useEffect(() => {
    if (item) {
      setForm({
        item_name: item.item_name || "",
        category: item.category || "",
        brand: item.brand || "",
        model: item.model || "",
        serial_number: item.serial_number || "",
        barcode: item.barcode || "",
        purchase_price: String(item.purchase_price ?? ""),
        selling_price: String(item.selling_price ?? ""),
        quantity: String(item.quantity ?? ""),
        min_stock: String(item.min_stock ?? ""),
        warehouse: item.warehouse || "",
        supplier_id: item.supplier_id || "",
      });
    }
  }, [item]);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("inventory").update({
        item_name: form.item_name,
        category: form.category || null,
        brand: form.brand || null,
        model: form.model || null,
        serial_number: form.serial_number || null,
        barcode: form.barcode || null,
        purchase_price: Number(form.purchase_price) || 0,
        selling_price: Number(form.selling_price) || 0,
        quantity: Number(form.quantity) || 0,
        min_stock: Number(form.min_stock) || 0,
        warehouse: form.warehouse || null,
        supplier_id: form.supplier_id || null,
      } as any).eq("id", item!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item updated");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("inventory").delete().eq("id", item!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item deleted");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Item Name *</Label>
            <Input value={form.item_name} onChange={(e) => set("item_name", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Brand</Label>
              <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => set("model", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Serial Number</Label>
              <Input value={form.serial_number} onChange={(e) => set("serial_number", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Barcode</Label>
            <div className="flex gap-2">
              <Input value={form.barcode} onChange={(e) => set("barcode", e.target.value)} placeholder="Type, scan or generate" />
              <Button type="button" variant="outline" size="icon" onClick={() => setScannerOpen(true)}>
                <ScanLine className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => set("barcode", generateBarcodeValue())}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {form.barcode && (
              <div className="rounded-md border bg-background p-2 flex justify-center">
                <BarcodeDisplay value={form.barcode} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Purchase Price (SAR)</Label>
              <Input type="number" min="0" step="0.01" value={form.purchase_price} onChange={(e) => set("purchase_price", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Selling Price (SAR)</Label>
              <Input type="number" min="0" step="0.01" value={form.selling_price} onChange={(e) => set("selling_price", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Supplier</Label>
            <Select value={form.supplier_id} onValueChange={(v) => set("supplier_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Quantity</Label>
              <Input type="number" min="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Min Stock</Label>
              <Input type="number" min="0" value={form.min_stock} onChange={(e) => set("min_stock", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Warehouse</Label>
              <Input value={form.warehouse} onChange={(e) => set("warehouse", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" />Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete item?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete "{item.item_name}".</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
      <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScan={(v) => set("barcode", v)} />
    </Dialog>
  );
}
