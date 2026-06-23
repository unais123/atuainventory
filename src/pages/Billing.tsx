import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Receipt, ArrowRight, ArrowLeft, Plus, Trash2, CreditCard, Building2, CheckCircle2, FileText, ScanLine, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BarcodeScannerDialog } from "@/components/BarcodeScannerDialog";

type Step = "customer" | "order" | "invoice" | "payment" | "done";
type CustomerMode = "existing" | "new";


interface OrderItem {
  inventory_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

const emptyCustomer = {
  company_name: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
  vat_number: "",
};

export default function Billing() {

  const location = useLocation();
  const navigate = useNavigate();
  const presetCustomer = (location.state as any)?.customer as
    | { id: string; company_name: string; contact_person?: string | null; email?: string | null; phone?: string | null; address?: string | null; vat_number?: string | null }
    | undefined;

  const [started, setStarted] = useState(!!presetCustomer);
  const [step, setStep] = useState<Step>(presetCustomer ? "order" : "customer");
  const [customerMode, setCustomerMode] = useState<CustomerMode>(presetCustomer ? "existing" : "new");
  const [customer, setCustomer] = useState(presetCustomer ? {
    company_name: presetCustomer.company_name,
    contact_person: presetCustomer.contact_person || "",
    email: presetCustomer.email || "",
    phone: presetCustomer.phone || "",
    address: presetCustomer.address || "",
    vat_number: presetCustomer.vat_number || "",
  } : emptyCustomer);
  const [customerId, setCustomerId] = useState<string | null>(presetCustomer?.id ?? null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [laborCharges, setLaborCharges] = useState("");
  const [serviceCharges, setServiceCharges] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | null>(null);
  const [cardForm, setCardForm] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [bankForm, setBankForm] = useState({ bank: "", reference: "" });
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const qc = useQueryClient();

  // Clear navigation state once consumed so refresh starts fresh
  useEffect(() => {
    if (presetCustomer) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("company_name");
      if (error) throw error;
      return data;
    },
    enabled: started,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory").select("*").order("item_name");
      if (error) throw error;
      return data;
    },
    enabled: started,
  });


  const fmt = (n: number) => `SAR ${n.toLocaleString("en", { minimumFractionDigits: 2 })}`;
  const hardwareTotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const labor = Number(laborCharges) || 0;
  const service = Number(serviceCharges) || 0;
  const subtotal = hardwareTotal + labor + service;
  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  const reset = () => {
    setStarted(false);
    setStep("customer");
    setCustomerMode("new");
    setCustomer(emptyCustomer);
    setCustomerId(null);
    setItems([]);
    setLaborCharges("");
    setServiceCharges("");
    setPaymentMethod(null);
    setCardForm({ number: "", name: "", expiry: "", cvc: "" });
    setBankForm({ bank: "", reference: "" });
    setInvoiceNumber("");
  };

  const pickExistingCustomer = (id: string) => {
    const c = customers.find((x: any) => x.id === id);
    if (!c) return;
    setCustomerId(c.id);
    setCustomer({
      company_name: c.company_name,
      contact_person: c.contact_person || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      vat_number: c.vat_number || "",
    });
  };

  const proceedFromCustomer = () => {
    if (customerMode === "existing") {
      if (!customerId) { toast.error("Please select a customer"); return; }
      setStep("order");
    } else {
      if (!customer.company_name.trim()) { toast.error("Company name is required"); return; }
      saveCustomer.mutate();
    }
  };


  const saveCustomer = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("customers").insert({
        company_name: customer.company_name,
        contact_person: customer.contact_person || null,
        email: customer.email || null,
        phone: customer.phone || null,
        address: customer.address || null,
        vat_number: customer.vat_number || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCustomerId(data.id);
      qc.invalidateQueries({ queryKey: ["customers"] });
      setStep("order");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const generateInvoice = useMutation({
    mutationFn: async () => {
      if (!customerId) throw new Error("Missing customer");
      if (items.length === 0) throw new Error("No items in order");

      const invNum = `INV-${Date.now().toString(36).toUpperCase()}`;
      const { data: invoice, error: invError } = await supabase.from("invoices").insert({
        invoice_number: invNum,
        customer_id: customerId,
        hardware_total: hardwareTotal,
        labor_charges: labor,
        service_charges: service,
        vat,
        total,
        status: "Paid" as const,
      }).select().single();
      if (invError) throw invError;

      const invoiceItems = items.map((it) => ({
        invoice_id: invoice.id,
        description: it.item_name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total: it.quantity * it.unit_price,
      }));
      const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems);
      if (itemsError) throw itemsError;

      for (const it of items) {
        const inv = inventory.find((i) => i.id === it.inventory_id);
        if (inv) {
          await supabase.from("inventory").update({ quantity: inv.quantity - it.quantity }).eq("id", it.inventory_id);
          await supabase.from("inventory_transactions").insert({
            inventory_id: it.inventory_id,
            transaction_type: "Stock Out" as const,
            quantity: it.quantity,
            reference: invNum,
            notes: `Billing - ${customer.company_name}`,
          });
        }
      }

      await supabase.from("payments").insert({
        invoice_id: invoice.id,
        amount: total,
        payment_method: paymentMethod === "card" ? "Card Payment" : "Bank Transfer",
        status: "Completed" as const,
        reference: paymentMethod === "bank" ? bankForm.reference : `CARD-${Date.now().toString(36).toUpperCase()}`,
      } as any);

      return invNum;
    },
    onSuccess: (invNum) => {
      setInvoiceNumber(invNum);
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      setStep("done");
      toast.success("Invoice generated successfully!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addItem = () => setItems((p) => [...p, { inventory_id: "", item_name: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));
  const updateItem = (i: number, invId: string) => {
    const inv = inventory.find((x) => x.id === invId);
    if (!inv) return;
    setItems((p) => p.map((it, idx) => idx === i ? { ...it, inventory_id: inv.id, item_name: inv.item_name, unit_price: Number(inv.selling_price), quantity: 1 } : it));
  };
  const updateQty = (i: number, q: number) => setItems((p) => p.map((it, idx) => idx === i ? { ...it, quantity: Math.max(1, q) } : it));

  const stepIndex = ["customer", "order", "invoice", "payment", "done"].indexOf(step);
  const steps = [
    { key: "customer", label: "Customer" },
    { key: "order", label: "Order" },
    { key: "invoice", label: "Invoice" },
    { key: "payment", label: "Payment" },
  ];

  if (!started) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-header">Billing</h1>
          <p className="text-sm text-muted-foreground">Create a complete bill: customer, order, invoice and payment.</p>
        </div>
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Start a new bill</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Step through adding a customer, creating the order, reviewing the invoice and collecting payment.
            </p>
            <Button onClick={() => setStarted(true)} size="lg">
              <Receipt className="h-4 w-4 mr-2" /> Bill
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="page-header">Billing</h1>
          <p className="text-sm text-muted-foreground">Step {Math.min(stepIndex + 1, 4)} of 4</p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>Cancel</Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((s, i) => {
          const active = stepIndex === i;
          const done = stepIndex > i;
          return (
            <div key={s.key} className="flex items-center gap-2 shrink-0">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium border",
                active && "bg-primary text-primary-foreground border-primary",
                done && "bg-primary/10 text-primary border-primary/30",
                !active && !done && "bg-muted text-muted-foreground"
              )}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("text-sm", active ? "font-medium" : "text-muted-foreground")}>{s.label}</span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      {step === "customer" && (
        <Card>
          <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
          <CardContent>
            <Tabs value={customerMode} onValueChange={(v) => { setCustomerMode(v as CustomerMode); setCustomerId(null); setCustomer(emptyCustomer); }}>
              <TabsList className="mb-4">
                <TabsTrigger value="existing">Existing Customer</TabsTrigger>
                <TabsTrigger value="new">New Customer</TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4">
                <div className="grid gap-2">
                  <Label>Select Customer *</Label>
                  <Select value={customerId ?? ""} onValueChange={pickExistingCustomer}>
                    <SelectTrigger><SelectValue placeholder="Choose an existing customer" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company_name}{c.contact_person ? ` — ${c.contact_person}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {customerId && (
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                    <p className="font-medium">{customer.company_name}</p>
                    {customer.contact_person && <p className="text-muted-foreground">{customer.contact_person}</p>}
                    {customer.email && <p className="text-muted-foreground">{customer.email}</p>}
                    {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="new" className="space-y-4">
                <div className="grid gap-2">
                  <Label>Company Name *</Label>
                  <Input value={customer.company_name} onChange={(e) => setCustomer({ ...customer, company_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Contact Person</Label>
                    <Input value={customer.contact_person} onChange={(e) => setCustomer({ ...customer, contact_person: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone</Label>
                    <Input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Address</Label>
                  <Input value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>VAT Number</Label>
                  <Input value={customer.vat_number} onChange={(e) => setCustomer({ ...customer, vat_number: e.target.value })} />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-4">
              <Button onClick={proceedFromCustomer} disabled={saveCustomer.isPending}>
                {saveCustomer.isPending ? "Saving..." : "Proceed"} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      {step === "order" && (
        <Card>
          <CardHeader><CardTitle>Create Order</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Order Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-3 w-3 mr-1" />Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No items added yet.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end flex-wrap sm:flex-nowrap">
                    <div className="flex-1 min-w-[180px]">
                      <Select value={item.inventory_id} onValueChange={(v) => updateItem(index, v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select item" /></SelectTrigger>
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
                      <Input type="number" min={1} className="h-9" value={item.quantity} onChange={(e) => updateQty(index, parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="w-28">
                      <Input className="h-9" value={fmt(item.unit_price)} disabled />
                    </div>
                    <div className="w-28">
                      <Input className="h-9" value={fmt(item.quantity * item.unit_price)} disabled />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="grid gap-2">
                <Label>Labor Charges (SAR)</Label>
                <Input type="number" min="0" step="0.01" value={laborCharges} onChange={(e) => setLaborCharges(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Service Charges (SAR)</Label>
                <Input type="number" min="0" step="0.01" value={serviceCharges} onChange={(e) => setServiceCharges(e.target.value)} />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Hardware</span><span>{fmt(hardwareTotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Labor</span><span>{fmt(labor)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span>{fmt(service)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">VAT (15%)</span><span>{fmt(vat)}</span></div>
              <div className="flex justify-between font-semibold pt-1.5 border-t"><span>Total</span><span>{fmt(total)}</span></div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("customer")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep("invoice")}
                disabled={items.length === 0 || items.some((i) => !i.inventory_id)}
              >
                Proceed <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "invoice" && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Invoice Preview</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Bill To</p>
                <p className="font-medium">{customer.company_name}</p>
                {customer.contact_person && <p>{customer.contact_person}</p>}
                {customer.email && <p className="text-muted-foreground">{customer.email}</p>}
                {customer.phone && <p className="text-muted-foreground">{customer.phone}</p>}
                {customer.address && <p className="text-muted-foreground">{customer.address}</p>}
                {customer.vat_number && <p className="text-muted-foreground">VAT: {customer.vat_number}</p>}
              </div>
              <div className="space-y-1 sm:text-right">
                <p className="text-muted-foreground">Date</p>
                <p>{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Item</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Unit Price</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{it.item_name}</td>
                      <td className="text-right p-2">{it.quantity}</td>
                      <td className="text-right p-2">{fmt(it.unit_price)}</td>
                      <td className="text-right p-2">{fmt(it.quantity * it.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4 space-y-1.5 text-sm max-w-sm ml-auto">
              <div className="flex justify-between"><span className="text-muted-foreground">Hardware</span><span>{fmt(hardwareTotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Labor</span><span>{fmt(labor)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span>{fmt(service)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">VAT (15%)</span><span>{fmt(vat)}</span></div>
              <div className="flex justify-between font-semibold pt-1.5 border-t text-base"><span>Total</span><span>{fmt(total)}</span></div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("order")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep("payment")}>
                Proceed to Payment <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "payment" && (
        <Card>
          <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={cn(
                  "p-4 rounded-lg border text-left transition-colors",
                  paymentMethod === "card" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <CreditCard className="h-5 w-5 mb-2 text-primary" />
                <p className="font-medium">Card Payment</p>
                <p className="text-xs text-muted-foreground">Pay using credit/debit card</p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("bank")}
                className={cn(
                  "p-4 rounded-lg border text-left transition-colors",
                  paymentMethod === "bank" ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <Building2 className="h-5 w-5 mb-2 text-primary" />
                <p className="font-medium">Bank Transfer</p>
                <p className="text-xs text-muted-foreground">Pay via direct bank transfer</p>
              </button>
            </div>

            {paymentMethod === "card" && (
              <div className="grid gap-4 pt-2">
                <div className="grid gap-2">
                  <Label>Card Number</Label>
                  <Input placeholder="4242 4242 4242 4242" value={cardForm.number} onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Name on Card</Label>
                  <Input value={cardForm.name} onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Expiry</Label>
                    <Input placeholder="MM/YY" value={cardForm.expiry} onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>CVC</Label>
                    <Input placeholder="123" value={cardForm.cvc} onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Demo only — no real card is charged.</p>
              </div>
            )}

            {paymentMethod === "bank" && (
              <div className="grid gap-4 pt-2">
                <div className="grid gap-2">
                  <Label>Bank Name</Label>
                  <Input value={bankForm.bank} onChange={(e) => setBankForm({ ...bankForm, bank: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Transfer Reference</Label>
                  <Input value={bankForm.reference} onChange={(e) => setBankForm({ ...bankForm, reference: e.target.value })} />
                </div>
                <p className="text-xs text-muted-foreground">Demo only — no real transfer is initiated.</p>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("invoice")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => generateInvoice.mutate()}
                disabled={!paymentMethod || generateInvoice.isPending}
              >
                {generateInvoice.isPending ? "Processing..." : "Generate Invoice"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "done" && (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <div>
              <h2 className="text-2xl font-semibold">Invoice Generated</h2>
              <p className="text-muted-foreground">Invoice <span className="font-mono">{invoiceNumber}</span> has been created and marked as paid.</p>
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={reset}>Start New Bill</Button>
              <Button variant="outline" asChild>
                <a href="/invoices">View Invoices</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
