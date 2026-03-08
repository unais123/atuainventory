import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, ShoppingCart } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface OrderItem {
  inventory_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

interface Props {
  customerId: string;
  customerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrderDialog({ customerId, customerName, open, onOpenChange }: Props) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [laborCharges, setLaborCharges] = useState("");
  const [serviceCharges, setServiceCharges] = useState("");
  const qc = useQueryClient();

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory").select("*").order("item_name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const addItem = () => {
    setItems((prev) => [...prev, { inventory_id: "", item_name: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, inventoryId: string) => {
    const inv = inventory.find((i) => i.id === inventoryId);
    if (!inv) return;
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, inventory_id: inv.id, item_name: inv.item_name, unit_price: Number(inv.selling_price), quantity: 1 }
          : item
      )
    );
  };

  const updateQuantity = (index: number, qty: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  const hardwareTotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const labor = Number(laborCharges) || 0;
  const service = Number(serviceCharges) || 0;
  const subtotal = hardwareTotal + labor + service;
  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  const fmt = (n: number) => `SAR ${n.toLocaleString("en", { minimumFractionDigits: 2 })}`;

  const mutation = useMutation({
    mutationFn: async () => {
      if (items.length === 0) throw new Error("Add at least one item");

      // Check stock availability
      for (const item of items) {
        const inv = inventory.find((i) => i.id === item.inventory_id);
        if (inv && item.quantity > inv.quantity) {
          throw new Error(`Insufficient stock for ${item.item_name}. Available: ${inv.quantity}`);
        }
      }

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

      // Create invoice
      const { data: invoice, error: invError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          customer_id: customerId,
          hardware_total: hardwareTotal,
          labor_charges: labor,
          service_charges: service,
          vat,
          total,
          status: "Pending" as const,
        })
        .select()
        .single();

      if (invError) throw invError;

      // Create invoice items
      const invoiceItems = items.map((item) => ({
        invoice_id: invoice.id,
        description: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems);
      if (itemsError) throw itemsError;

      // Deduct inventory quantities
      for (const item of items) {
        const inv = inventory.find((i) => i.id === item.inventory_id);
        if (inv) {
          const { error: updateError } = await supabase
            .from("inventory")
            .update({ quantity: inv.quantity - item.quantity })
            .eq("id", item.inventory_id);
          if (updateError) throw updateError;

          // Record transaction
          await supabase.from("inventory_transactions").insert({
            inventory_id: item.inventory_id,
            transaction_type: "Stock Out" as const,
            quantity: item.quantity,
            reference: invoiceNumber,
            notes: `Order for ${customerName}`,
          });
        }
      }

      return invoice;
    },
    onSuccess: () => {
      toast.success("Order created and invoice generated!");
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["customer-invoices", customerId] });
      setItems([]);
      setLaborCharges("");
      setServiceCharges("");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Order</DialogTitle>
          <DialogDescription>Order for {customerName}. Select items from inventory.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Order Items</Label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-3 w-3 mr-1" />Add Item
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No items added yet. Click "Add Item" to start.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    {index === 0 && <Label className="text-xs text-muted-foreground">Item</Label>}
                    <Select value={item.inventory_id} onValueChange={(v) => updateItem(index, v)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.map((inv) => (
                          <SelectItem key={inv.id} value={inv.id}>
                            {inv.item_name} (Stock: {inv.quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20">
                    {index === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                    <Input
                      type="number"
                      min={1}
                      className="h-9"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="w-28">
                    {index === 0 && <Label className="text-xs text-muted-foreground">Price</Label>}
                    <Input className="h-9" value={fmt(item.unit_price)} disabled />
                  </div>
                  <div className="w-28">
                    {index === 0 && <Label className="text-xs text-muted-foreground">Total</Label>}
                    <Input className="h-9" value={fmt(item.quantity * item.unit_price)} disabled />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeItem(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="labor">Labor Charges (SAR)</Label>
              <Input id="labor" type="number" min="0" step="0.01" value={laborCharges} onChange={(e) => setLaborCharges(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="service">Service Charges (SAR)</Label>
              <Input id="service" type="number" min="0" step="0.01" value={serviceCharges} onChange={(e) => setServiceCharges(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Hardware Total</span><span>{fmt(hardwareTotal)}</span></div>
            {labor > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Labor</span><span>{fmt(labor)}</span></div>}
            {service > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span>{fmt(service)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">VAT (15%)</span><span>{fmt(vat)}</span></div>
            <div className="flex justify-between font-semibold pt-1.5 border-t"><span>Total</span><span>{fmt(total)}</span></div>
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || items.length === 0 || items.some((i) => !i.inventory_id)}
            className="w-full"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {mutation.isPending ? "Processing..." : "Create Order & Generate Invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
