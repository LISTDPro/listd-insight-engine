import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { usePlatformSettings, useUpdatePlatformSetting } from "@/hooks/usePlatformSettings";
import { Star, Instagram, Facebook, Link2, Mail, Save } from "lucide-react";

const PlatformSettingsPanel = () => {
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSetting = useUpdatePlatformSetting();
  const { toast } = useToast();

  const [form, setForm] = useState({
    google_review_link: "",
    google_star_rating: "",
    google_review_count: "",
    instagram_url: "",
    facebook_url: "",
    review_email_enabled: "true",
    tenancies_completed_override: "",
  });

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const handleSave = async (key: keyof typeof form) => {
    try {
      await updateSetting.mutateAsync({ key, value: form[key] });
      toast({ title: "Saved", description: `${key.replace(/_/g, " ")} updated.` });
    } catch {
      toast({ title: "Error", description: "Failed to save setting.", variant: "destructive" });
    }
  };

  const handleSaveAll = async () => {
    try {
      await Promise.all(
        Object.keys(form).map((key) =>
          updateSetting.mutateAsync({ key, value: form[key as keyof typeof form] })
        )
      );
      toast({ title: "All settings saved" });
    } catch {
      toast({ title: "Error", description: "Failed to save some settings.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Google Reviews */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <Star className="w-4 h-4 text-warning" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Google Reviews</h3>
            <p className="text-xs text-muted-foreground">Configure review display and link</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Google Review Link</Label>
              <div className="flex gap-2">
                <Input
                  value={form.google_review_link}
                  onChange={(e) => setForm((f) => ({ ...f, google_review_link: e.target.value }))}
                  placeholder="https://g.page/r/..."
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => handleSave("google_review_link")}>
                  <Save className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Star Rating Override</Label>
              <div className="flex gap-2">
                <Input
                  value={form.google_star_rating}
                  onChange={(e) => setForm((f) => ({ ...f, google_star_rating: e.target.value }))}
                  placeholder="5.0"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => handleSave("google_star_rating")}>
                  <Save className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Review Count Display</Label>
              <div className="flex gap-2">
                <Input
                  value={form.google_review_count}
                  onChange={(e) => setForm((f) => ({ ...f, google_review_count: e.target.value }))}
                  placeholder="24"
                  type="number"
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => handleSave("google_review_count")}>
                  <Save className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tenancies Completed Override</Label>
              <div className="flex gap-2">
                <Input
                  value={form.tenancies_completed_override}
                  onChange={(e) => setForm((f) => ({ ...f, tenancies_completed_override: e.target.value }))}
                  placeholder="Leave blank to use live count"
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => handleSave("tenancies_completed_override")}>
                  <Save className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Email Toggle */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Review Request Emails</h3>
            <p className="text-xs text-muted-foreground">Auto-send review request 24h after report accepted</p>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enable automatic review emails</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clients receive a "Quick favour?" email 24 hours after accepting their report
              </p>
            </div>
            <Switch
              checked={form.review_email_enabled === "true"}
              onCheckedChange={(checked) => {
                const value = checked ? "true" : "false";
                setForm((f) => ({ ...f, review_email_enabled: value }));
                updateSetting.mutate({ key: "review_email_enabled", value });
              }}
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Social Links</h3>
            <p className="text-xs text-muted-foreground">Displayed in footers across the platform</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5" /> Instagram URL
              </Label>
              <div className="flex gap-2">
                <Input
                  value={form.instagram_url}
                  onChange={(e) => setForm((f) => ({ ...f, instagram_url: e.target.value }))}
                  placeholder="https://instagram.com/..."
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => handleSave("instagram_url")}>
                  <Save className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5" /> Facebook URL
              </Label>
              <div className="flex gap-2">
                <Input
                  value={form.facebook_url}
                  onChange={(e) => setForm((f) => ({ ...f, facebook_url: e.target.value }))}
                  placeholder="https://facebook.com/..."
                  className="text-sm"
                />
                <Button size="sm" variant="outline" onClick={() => handleSave("facebook_url")}>
                  <Save className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save All */}
      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={updateSetting.isPending} className="gap-2">
          <Save className="w-4 h-4" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
};

export default PlatformSettingsPanel;
