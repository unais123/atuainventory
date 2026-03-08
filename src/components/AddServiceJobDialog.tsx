import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function AddServiceJobDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    service_request_id: "",
    employee_ids: [] as string[],
    start_time: "",
    end_time: "",
    service_notes: "",
  });
  const qc = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["service_requests_for_jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, service_type, customers(company_name)")
        .in("status", ["Pending", "Assigned", "In Progress"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees_active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees").select("id, name, role").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const toggleEmployee = (id: string) => {
    setForm((f) => ({
      ...f,
      employee_ids: f.employee_ids.includes(id)
        ? f.employee_ids.filter((e) => e !== id)
        : [...f.employee_ids, id],
    }));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.service_request_id) throw new Error("Please select a service request");
      const { data: job, error } = await supabase.from("service_jobs").insert({
        service_request_id: form.service_request_id,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        service_notes: form.service_notes || null,
      }).select("id").single();
      if (error) throw error;

      if (form.employee_ids.length > 0) {
        const rows = form.employee_ids.map((eid) => ({
          service_job_id: job.id,
          employee_id: eid,
        }));
        const { error: linkError } = await supabase.from("service_job_employees").insert(rows);
        if (linkError) throw linkError;
      }
    },
    onSuccess: () => {
      toast.success("Service job created");
      qc.invalidateQueries({ queryKey: ["service-jobs"] });
      setForm({ service_request_id: "", employee_ids: [], start_time: "", end_time: "", service_notes: "" });
      setOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Job</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Service Job</DialogTitle>
          <DialogDescription>Create a service job from an existing service request.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Service Request *</Label>
            <Select value={form.service_request_id} onValueChange={(v) => setForm((f) => ({ ...f, service_request_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select request" /></SelectTrigger>
              <SelectContent>
                {requests.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.customers?.company_name ?? "—"} — {r.service_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
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
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>End Date</Label>
              <Input type="datetime-local" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.service_notes} onChange={(e) => setForm((f) => ({ ...f, service_notes: e.target.value }))} />
          </div>
          <Button type="submit" disabled={mutation.isPending} className="mt-2">
            {mutation.isPending ? "Creating..." : "Create Job"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
