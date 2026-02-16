import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncResult {
  user_id: string;
  name: string;
  xero_contact_id?: string;
  action: "created" | "updated" | "skipped";
  error?: string;
}

interface SyncSummary {
  created: number;
  updated: number;
  skipped: number;
  total: number;
}

export const useXeroContactSync = () => {
  const [syncing, setSyncing] = useState(false);

  const syncContacts = async (userIds: string[]) => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to sync contacts");
        return { success: false };
      }

      const response = await supabase.functions.invoke("xero-sync-contact", {
        body: { user_ids: userIds },
      });

      if (response.error) {
        const errorMsg = response.error.message || "Failed to sync contacts";
        if (errorMsg.includes("No Xero connection") || errorMsg.includes("reconnect")) {
          toast.error("Xero not connected", {
            description: "Please connect your Xero account in Settings first.",
          });
        } else {
          toast.error("Contact sync failed", { description: errorMsg });
        }
        return { success: false, error: errorMsg };
      }

      const data = response.data as { summary: SyncSummary; results: SyncResult[] };
      const { summary } = data;

      toast.success("Contacts synced to Xero!", {
        description: `${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped`,
      });

      return { success: true, data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to sync contacts to Xero", { description: msg });
      return { success: false, error: msg };
    } finally {
      setSyncing(false);
    }
  };

  return { syncContacts, syncing };
};
