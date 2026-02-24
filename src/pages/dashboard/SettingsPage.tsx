import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Shield,
  Bell,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";

interface NotificationPrefs {
  email_job_updates: boolean;
  email_payment_updates: boolean;
  email_report_delivery: boolean;
  email_new_messages: boolean;
  email_marketing: boolean;
  inapp_job_updates: boolean;
  inapp_payment_updates: boolean;
  inapp_report_delivery: boolean;
  inapp_new_messages: boolean;
}

const defaultPrefs: NotificationPrefs = {
  email_job_updates: true,
  email_payment_updates: true,
  email_report_delivery: true,
  email_new_messages: true,
  email_marketing: false,
  inapp_job_updates: true,
  inapp_payment_updates: true,
  inapp_report_delivery: true,
  inapp_new_messages: true,
};

const SettingsPage = () => {
  const { profile, role, user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [prefsLoading, setPrefLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setCompanyName(profile.company_name || "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const updates: Record<string, string> = {
      full_name: fullName.trim(),
      phone: phone.trim(),
    };
    if (role === "client") {
      updates.company_name = companyName.trim();
    }
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);
    setSavingProfile(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully" });
      setPwDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  useEffect(() => {
    if (user) fetchPrefs();
  }, [user]);

  const fetchPrefs = async () => {
    const { data } = await supabase
      .from("notification_preferences" as any)
      .select("*")
      .eq("user_id", user!.id)
      .single();

    if (data) {
      const d = data as any;
      setPrefs({
        email_job_updates: d.email_job_updates,
        email_payment_updates: d.email_payment_updates,
        email_report_delivery: d.email_report_delivery,
        email_new_messages: d.email_new_messages,
        email_marketing: d.email_marketing,
        inapp_job_updates: d.inapp_job_updates,
        inapp_payment_updates: d.inapp_payment_updates,
        inapp_report_delivery: d.inapp_report_delivery,
        inapp_new_messages: d.inapp_new_messages,
      });
    }
    setPrefLoading(false);
  };

  const savePrefs = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await (supabase as any)
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        ...prefs,
      }, { onConflict: "user_id" });

    setSaving(false);
    if (!error) {
      toast({ title: "Preferences saved" });
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const togglePref = (key: keyof NotificationPrefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getRoleBadge = () => {
    switch (role) {
      case "client":
        return <Badge className="bg-primary/10 text-primary">Client</Badge>;
      case "clerk":
        return <Badge className="bg-success/10 text-success">Clerk</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const notifRows: { key: keyof NotificationPrefs; label: string; description: string; channel: "email" | "inapp" }[] = [
    { key: "email_job_updates", label: "Job Updates", description: "Status changes, assignments, and scheduling", channel: "email" },
    { key: "email_payment_updates", label: "Payment Updates", description: "Escrow holds, releases, and payout confirmations", channel: "email" },
    { key: "email_report_delivery", label: "Report Delivery", description: "When reports are submitted or ready for review", channel: "email" },
    { key: "email_new_messages", label: "New Messages", description: "In-app messages from clients or clerks", channel: "email" },
    { key: "email_marketing", label: "Product Updates", description: "New features, tips, and platform news", channel: "email" },
    { key: "inapp_job_updates", label: "Job Updates", description: "Status changes, assignments, and scheduling", channel: "inapp" },
    { key: "inapp_payment_updates", label: "Payment Updates", description: "Escrow holds, releases, and payout confirmations", channel: "inapp" },
    { key: "inapp_report_delivery", label: "Report Delivery", description: "When reports are submitted or ready for review", channel: "inapp" },
    { key: "inapp_new_messages", label: "New Messages", description: "In-app messages from clients or clerks", channel: "inapp" },
  ];

  const emailRows = notifRows.filter(r => r.channel === "email");
  const inappRows = notifRows.filter(r => r.channel === "inapp");

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Profile</CardTitle>
            </div>
            <CardDescription>Your personal information and account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                <span className="text-xl font-semibold text-accent-foreground">
                  {profile?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-foreground">{profile?.full_name || "User"}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="mt-1">{getRoleBadge()}</div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              {role === "client" && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input 
                    id="company" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
            <CardDescription>Control which notifications you receive by email and in-app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {prefsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Email Notifications */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">Email Notifications</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Mute all</span>
                      <Switch
                        checked={emailRows.every(r => !prefs[r.key])}
                        onCheckedChange={(muted) => {
                          setPrefs(prev => {
                            const next = { ...prev };
                            emailRows.forEach(r => { next[r.key] = !muted; });
                            return next;
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {emailRows.map(row => (
                      <div key={row.key} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{row.label}</p>
                          <p className="text-xs text-muted-foreground">{row.description}</p>
                        </div>
                        <Switch
                          checked={prefs[row.key]}
                          onCheckedChange={() => togglePref(row.key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* In-App Notifications — Always On */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">In-App Notifications</h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">Always On</Badge>
                  </div>
                  <div className="space-y-3">
                    {inappRows.map(row => (
                      <div key={row.key} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{row.label}</p>
                          <p className="text-xs text-muted-foreground">{row.description}</p>
                        </div>
                        <Switch
                          checked={true}
                          disabled
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={savePrefs} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Preferences
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Security</CardTitle>
            </div>
            <CardDescription>Password and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Password</p>
                <p className="text-sm text-muted-foreground">Last changed: Never</p>
              </div>
              <Button variant="outline" onClick={() => setPwDialogOpen(true)}>Change Password</Button>
            </div>

            <Dialog open={pwDialogOpen} onOpenChange={(open) => { setPwDialogOpen(open); if (!open) { setNewPassword(""); setConfirmPassword(""); } }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>Enter your new password below.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPw">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPw"
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowNew(!showNew)}>
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPw">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPw"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPwDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleChangePassword} disabled={changingPw || !newPassword || !confirmPassword}>
                    {changingPw && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Password
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
