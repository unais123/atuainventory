import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { LogOut, Upload, Building2, Landmark } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [company, setCompany] = useState({
    company_name: "", company_name_ar: "", logo_url: "",
    address: "", phone: "", email: "", vat_number: "", cr_number: "",
    bank_account_name: "", bank_name: "", bank_account_no: "", bank_iban: "",
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: companySettings } = useQuery({
    queryKey: ["company_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    if (companySettings) {
      setCompany({
        company_name: companySettings.company_name || "",
        company_name_ar: companySettings.company_name_ar || "",
        logo_url: companySettings.logo_url || "",
        address: companySettings.address || "",
        phone: companySettings.phone || "",
        email: companySettings.email || "",
        vat_number: companySettings.vat_number || "",
        cr_number: companySettings.cr_number || "",
        bank_account_name: companySettings.bank_account_name || "",
        bank_name: companySettings.bank_name || "",
        bank_account_no: companySettings.bank_account_no || "",
        bank_iban: companySettings.bank_iban || "",
      });
    }
  }, [companySettings]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles").update({ full_name: fullName, phone }).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCompany = useMutation({
    mutationFn: async () => {
      if (!companySettings?.id) throw new Error("No company settings found");
      const { error } = await supabase
        .from("company_settings").update({
          company_name: company.company_name,
          company_name_ar: company.company_name_ar,
          logo_url: company.logo_url,
          address: company.address,
          phone: company.phone,
          email: company.email,
          vat_number: company.vat_number,
          cr_number: company.cr_number,
          bank_account_name: company.bank_account_name,
          bank_name: company.bank_name,
          bank_account_no: company.bank_account_no,
          bank_iban: company.bank_iban,
        }).eq("id", companySettings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company_settings"] });
      toast({ title: "Company settings updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `logo.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("company-assets").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("company-assets").getPublicUrl(path);
    setCompany((c) => ({ ...c, logo_url: urlData.publicUrl }));
    toast({ title: "Logo uploaded — click Save to apply" });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-header">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, company, and bank details.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input disabled value={user?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Company Information</CardTitle>
          <CardDescription>This information appears on your invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); updateCompany.mutate(); }} className="space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-lg">
                <AvatarImage src={company.logo_url} />
                <AvatarFallback className="rounded-lg text-xs bg-muted">Logo</AvatarFallback>
              </Avatar>
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1" />Upload Logo
                </Button>
                <p className="text-xs text-muted-foreground mt-1">Recommended: 200×80px, PNG or JPG</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name (English)</Label>
                <Input value={company.company_name} onChange={(e) => setCompany({ ...company, company_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Company Name (Arabic)</Label>
                <Input dir="rtl" value={company.company_name_ar} onChange={(e) => setCompany({ ...company, company_name_ar: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>VAT Number</Label>
                <Input value={company.vat_number} onChange={(e) => setCompany({ ...company, vat_number: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CR Number</Label>
                <Input value={company.cr_number} onChange={(e) => setCompany({ ...company, cr_number: e.target.value })} />
              </div>
            </div>

            <Separator />

            {/* Bank Details */}
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Landmark className="h-4 w-4" />Bank Details
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input value={company.bank_account_name} onChange={(e) => setCompany({ ...company, bank_account_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input value={company.bank_name} onChange={(e) => setCompany({ ...company, bank_name: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input value={company.bank_account_no} onChange={(e) => setCompany({ ...company, bank_account_no: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input value={company.bank_iban} onChange={(e) => setCompany({ ...company, bank_iban: e.target.value })} />
              </div>
            </div>

            <Button type="submit" disabled={updateCompany.isPending}>
              {updateCompany.isPending ? "Saving..." : "Save Company Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Sign out of your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
