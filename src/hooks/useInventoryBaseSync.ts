import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IBMatch {
  job_id: string;
  score: number;
  property_address: string;
}

export interface IBEvent {
  uid: string;
  summary: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  match: IBMatch | null;
}

interface SyncResult {
  success: boolean;
  total_events: number;
  events: IBEvent[];
  matched_count: number;
  error?: string;
}

export const useInventoryBaseSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [events, setEvents] = useState<IBEvent[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);

  const fetchEvents = async (): Promise<SyncResult | null> => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return null;
      }

      const response = await supabase.functions.invoke("inventorybase-sync");

      if (response.error) {
        toast.error("InventoryBase sync failed", { description: response.error.message || "Failed to sync" });
        return null;
      }

      const data = response.data as SyncResult;
      if (!data.success) {
        toast.error("Sync error", { description: data.error });
        return null;
      }

      setEvents(data.events);
      setMatchedCount(data.matched_count);

      // Notify admin of IB sync results
      try {
        await supabase.functions.invoke("notify-admin", {
          body: {
            type: "ib_sync",
            totalEvents: data.total_events,
            matchedCount: data.matched_count,
          },
        });
      } catch (e) {
        console.error("Failed to notify admin of IB sync:", e);
      }

      if (data.matched_count > 0) {
        toast.success(`Fetched ${data.total_events} inspections — ${data.matched_count} auto-matched to LISTD jobs`);
      } else {
        toast.success(`Fetched ${data.total_events} inspections from InventoryBase`);
      }
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("InventoryBase sync failed", { description: msg });
      return null;
    } finally {
      setSyncing(false);
    }
  };

  const linkEvent = async (jobId: string, ibUid: string): Promise<boolean> => {
    setLinking(jobId);
    try {
      const response = await supabase.functions.invoke("inventorybase-sync", {
        body: { action: "auto-link", job_id: jobId, inventorybase_uid: ibUid },
      });

      if (response.error) {
        toast.error("Failed to link", { description: response.error.message });
        return false;
      }

      const data = response.data;
      if (!data.success) {
        toast.error("Link failed", { description: data.error });
        return false;
      }

      // Update local state to remove the match
      setEvents(prev => prev.map(e =>
        e.uid === ibUid ? { ...e, match: null } : e
      ));

      toast.success("Job linked to InventoryBase event");
      return true;
    } catch (err) {
      toast.error("Failed to link event");
      return false;
    } finally {
      setLinking(null);
    }
  };

  return { fetchEvents, linkEvent, syncing, linking, events, matchedCount };
};
