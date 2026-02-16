import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Job, JobStatus } from "@/types/database";

interface JobWithProperty extends Job {
  property?: {
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    postcode: string;
    bedrooms: number;
    bathrooms: number;
    property_type: string;
    furnished_status: string;
  };
}

export const useClerkJobs = () => {
  const { user } = useAuth();
  const [availableJobs, setAvailableJobs] = useState<JobWithProperty[]>([]);
  const [myJobs, setMyJobs] = useState<JobWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableJobs = useCallback(async () => {
    // Fetch published jobs that clerks can accept directly
    const { data, error: fetchError } = await supabase
      .from("jobs")
      .select(`
        *,
        property:properties(
          address_line_1,
          address_line_2,
          city,
          postcode,
          bedrooms,
          bathrooms,
          property_type,
          furnished_status
        )
      `)
      .eq("status", "published")
      .order("scheduled_date", { ascending: true });

    if (fetchError) {
      console.error("Error fetching available jobs:", fetchError);
      return [];
    }
    return data as JobWithProperty[];
  }, []);

  const fetchMyJobs = useCallback(async () => {
    if (!user) return [];

    // Fetch jobs assigned to this clerk
    const { data, error: fetchError } = await supabase
      .from("jobs")
      .select(`
        *,
        property:properties(
          address_line_1,
          address_line_2,
          city,
          postcode,
          bedrooms,
          bathrooms,
          property_type,
          furnished_status
        )
      `)
      .eq("clerk_id", user.id)
      .not("status", "in", '("cancelled","completed","paid")')
      .order("scheduled_date", { ascending: true });

    if (fetchError) {
      console.error("Error fetching my jobs:", fetchError);
      return [];
    }
    return data as JobWithProperty[];
  }, [user]);

  const refreshJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [available, mine] = await Promise.all([
        fetchAvailableJobs(),
        fetchMyJobs()
      ]);
      setAvailableJobs(available);
      setMyJobs(mine);
    } catch (err) {
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [fetchAvailableJobs, fetchMyJobs]);

  // Initial fetch and real-time subscription
  useEffect(() => {
    if (!user) return;

    refreshJobs();

    // Subscribe to real-time job updates
    const channel = supabase
      .channel('clerk-jobs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs'
        },
        (payload) => {
          console.log('Real-time job update:', payload);
          // Refresh jobs when any job changes
          refreshJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshJobs]);

  const acceptJob = async (jobId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        clerk_id: user.id,
        status: "accepted" as JobStatus,
      })
      .eq("id", jobId)
      .eq("status", "published");

    if (!updateError) {
      await refreshJobs();
    }

    return { error: updateError as Error | null };
  };

  const declineJob = async (jobId: string) => {
    // For now, declining removes from the local view
    // In future, could track declined jobs to not show again
    setAvailableJobs(prev => prev.filter(job => job.id !== jobId));
    return { error: null };
  };

  const startInspection = async (jobId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        status: "in_progress" as JobStatus,
      })
      .eq("id", jobId)
      .eq("clerk_id", user.id);

    if (!updateError) {
      await refreshJobs();
    }

    return { error: updateError as Error | null };
  };

  return {
    availableJobs,
    myJobs,
    loading,
    error,
    refreshJobs,
    acceptJob,
    declineJob,
    startInspection,
  };
};
