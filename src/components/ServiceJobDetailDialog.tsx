import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Constants } from "@/integrations/supabase/types";
import { format } from "date-fns";

interface ServiceJob {
  id: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  service_notes: string | null;
  service_request_id: string;
  employee_id: string | null;
  service_job_employees?: { employee_id: string; employees: { name: string; role: string } }[];
  service_requests?: {
    service_type: string;
    customers?: { company_name: string } | null;
  } | null;
}

interface Props {
  job: ServiceJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUSES = Constants.public.Enums.service_job_status;

export function ServiceJobDetailDialog({ job, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    status: "Scheduled",
    service_request_id: "",
    employee_ids: [] as string[],
    start_time: "",
    end_time: "",
    service_notes: "",
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees").select("id, name, role").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: editing,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["service_requests_for_jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, service_type, customers(company_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: editing,
  });

  useEffect(() => {
    if (job) {
      const empIds = (job.service_job_employees || []).map((sje: any) => sje.employee_id);
      setForm({
        status: job.status,
        service_request_id: job.service_request_id,
        employee_ids: empIds,
        start_time: job.start_time ? job.start_time.slice(0, 16) : "",
        end_time: job.end_time ? job.end_time.slice(0, 16) : "",
        service_notes: job.service_notes || "",
      });
    }
  }, [job]);

  const toggleEmployee = (id: string) => {
    setForm((f) => ({
      ...f,
      employee_ids: f.employee_ids.includes(id)
        ? f.employee_ids.filter((e) => e !== id)
        : [...f.employee_ids, id],
    }));
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("service_jobs").update({
        status: form.status as any,
        service_request_id: form.service_request_id,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        service_notes: form.service_notes || null,
      }).eq("id", job!.id);
      if (error) throw error;

      // Sync employees: delete all, re-insert
      await supabase.from("service_job_employees").delete().eq("service_job_id", job!.id);
      if (form.employee_ids.length > 0) {
        const rows = form.employee_ids.map((eid) => ({
          service_job_id: job!.id,
          employee_id: eid,
        }));
        const { error: linkError } = await supabase.from("service_job_employees").insert(rows);
        if (linkError) throw linkError;
      }
    },
    onSuccess: () => {
      toast.success("Service job updated");
      qc.invalidateQueries({ queryKey: ["service-jobs"] });
      setEditing(false);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("service_jobs").delete().eq("id", job!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service job deleted");
      qc.invalidateQueries({ queryKey: ["service-jobs"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!job) return null;

  const customerName = job.service_requests?.customers?.company_name ?? "—";
  const serviceType = job.service_requests?.service_type ?? "—";
  const assignedEmployees = (job.service_job_employees || []).map((sje: any) => sje.employees);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setEditing(false); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            {editing ? "Edit Service Job" : `${serviceType} — ${customerName}`}
            {!editing && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete service job?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete this service job.</AlertDialogDescription>
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
          {!editing && <DialogDescription>Service job details</DialogDescription>}
        </DialogHeader>

        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4 py-2">
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
              <Label>Assigned Employees</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {employees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active employees</p>
                ) : (
                  employees.map((emp: any) => (
                    <label key={emp.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={form.employee_ids.includes(emp.id)}
                        onCheckedChange={() => toggleEmployee(emp.id)}
                      />
                      {emp.name} <span className="text-muted-foreground">({emp.role})</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.service_notes} onChange={(e) => setForm({ ...form, service_notes: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Customer:</span> {customerName}</div>
              <div><span className="text-muted-foreground">Service:</span> {serviceType}</div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Status:</span>
                <StatusBadge status={job.status} />
              </div>
              <div><span className="text-muted-foreground">Start:</span> {job.start_time ? format(new Date(job.start_time), "dd MMM yyyy HH:mm") : "—"}</div>
              <div><span className="text-muted-foreground">End:</span> {job.end_time ? format(new Date(job.end_time), "dd MMM yyyy HH:mm") : "—"}</div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Employees:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {assignedEmployees.length === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  assignedEmployees.map((emp: any, i: number) => (
                    <Badge key={i} variant="secondary">{emp.name}</Badge>
                  ))
                )}
              </div>
            </div>
            {job.service_notes && (
              <div className="text-sm">
                <span className="text-muted-foreground">Notes:</span>
                <p className="mt-1">{job.service_notes}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
