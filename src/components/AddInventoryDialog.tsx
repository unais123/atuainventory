import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

import { Plus, ScanLine, RefreshCw } from "lucide-react";
import { BarcodeDisplay, generateBarcodeValue } from "@/components/BarcodeDisplay";
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog";

const defaultForm = {
  item_name: "",
  category: "",
  brand: "",
  model: "",
  serial_number: "",
  barcode: "",
  purchase_price: "",
  selling_price: "",
  quantity: "",
  min_stock: "",
  warehouse: "",
  supplier_id: "",
};

export function AddInventoryDialog() {
  const [open, setOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const qc = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("inventory").insert({
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
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item added successfully");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setForm(defaultForm);
      setOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Item</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          className="grid gap-4 py-2"
        >
          <div className="grid gap-2">
            <Label htmlFor="item_name">Item Name *</Label>
            <Input id="item_name" value={form.item_name} onChange={(e) => set("item_name", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={form.category} onChange={(e) => set("category", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" value={form.model} onChange={(e) => set("model", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input id="serial_number" value={form.serial_number} onChange={(e) => set("serial_number", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="purchase_price">Purchase Price (SAR)</Label>
              <Input id="purchase_price" type="number" min="0" step="0.01" value={form.purchase_price} onChange={(e) => set("purchase_price", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="selling_price">Selling Price (SAR)</Label>
              <Input id="selling_price" type="number" min="0" step="0.01" value={form.selling_price} onChange={(e) => set("selling_price", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="supplier">Supplier</Label>
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
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" min="0" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="min_stock">Min Stock</Label>
              <Input id="min_stock" type="number" min="0" value={form.min_stock} onChange={(e) => set("min_stock", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="warehouse">Warehouse</Label>
              <Input id="warehouse" value={form.warehouse} onChange={(e) => set("warehouse", e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={mutation.isPending} className="mt-2">
            {mutation.isPending ? "Adding..." : "Add Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
