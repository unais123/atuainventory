import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SERVICE_TYPES = ["Installation", "Maintenance", "Repair", "Inspection", "Consultation"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const STATUSES = ["Pending", "Assigned", "In Progress", "Completed", "Invoiced"];

const priorityStyles: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-primary/10 text-primary border-primary/20",
  High: "bg-warning/10 text-warning border-warning/20",
  Urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

interface ServiceRequest {
  id: string;
  service_type: string;
  priority: string;
  location: string | null;
  description: string | null;
  status: string;
  created_at: string;
  customers?: { company_name: string } | null;
}

interface Props {
  request: ServiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceRequestDetailDialog({ request, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    service_type: "",
    priority: "Medium",
    location: "",
    description: "",
    status: "Pending",
  });

  useEffect(() => {
    if (request) {
      setForm({
        service_type: request.service_type,
        priority: request.priority,
        location: request.location || "",
        description: request.description || "",
        status: request.status,
      });
    }
  }, [request]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("service_requests").update({
        service_type: form.service_type,
        priority: form.priority,
        location: form.location || null,
        description: form.description || null,
        status: form.status as any,
      }).eq("id", request!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service request updated");
      qc.invalidateQueries({ queryKey: ["service_requests"] });
      setEditing(false);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("service_requests").delete().eq("id", request!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service request deleted");
      qc.invalidateQueries({ queryKey: ["service_requests"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setEditing(false); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            {editing ? "Edit Service Request" : request.service_type}
            {!editing && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete service request?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete this service request and may fail if there are linked service jobs.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </DialogTitle>
          {!editing && <DialogDescription>Service request details</DialogDescription>}
        </DialogHeader>

        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Type *</Label>
                <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Customer:</span> {request.customers?.company_name ?? "—"}</div>
              <div><span className="text-muted-foreground">Type:</span> {request.service_type}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Priority:</span>
                <Badge variant="outline" className={priorityStyles[request.priority] ?? ""}>{request.priority}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Status:</span>
                <StatusBadge status={request.status} />
              </div>
              {request.location && (
                <div className="col-span-2"><span className="text-muted-foreground">Location:</span> {request.location}</div>
              )}
            </div>
            {request.description && (
              <div className="text-sm">
                <span className="text-muted-foreground">Description:</span>
                <p className="mt-1">{request.description}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
