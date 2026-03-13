import { useState } from "react";
import { usePlatformSettings, useUpdatePlatformSetting } from "@/hooks/usePlatformSettings";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const SuperAdminSettings = () => {
  const { data: settings, isLoading } = usePlatformSettings();
  const mutation = useUpdatePlatformSetting();
  const [saving, setSaving] = useState<string | null>(null);

  const handleToggle = async (key: string, current: string) => {
    const newVal = current === "true" ? "false" : "true";
    setSaving(key);
    await mutation.mutateAsync({ key, value: newVal });
    toast({ title: "Setting updated" });
    setSaving(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Instagram URL</label>
            <Input value={settings?.instagram_url || ""} readOnly className="mt-1" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Facebook URL</label>
            <Input value={settings?.facebook_url || ""} readOnly className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Google Reviews Enabled</span>
            <Switch
              checked={settings?.google_reviews_enabled === "true"}
              onCheckedChange={() =>
                handleToggle("google_reviews_enabled", settings?.google_reviews_enabled || "true")
              }
              disabled={saving === "google_reviews_enabled"}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Trustpilot Enabled</span>
            <Switch
              checked={settings?.trustpilot_enabled === "true"}
              onCheckedChange={() =>
                handleToggle("trustpilot_enabled", settings?.trustpilot_enabled || "false")
              }
              disabled={saving === "trustpilot_enabled"}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Review Emails Enabled</span>
            <Switch
              checked={settings?.review_email_enabled === "true"}
              onCheckedChange={() =>
                handleToggle("review_email_enabled", settings?.review_email_enabled || "true")
              }
              disabled={saving === "review_email_enabled"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminSettings;
