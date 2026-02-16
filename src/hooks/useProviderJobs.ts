import { useState, useEffect } from "react";
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

export const useProviderJobs = () => {
  const { user } = useAuth();
  const [publishedJobs, setPublishedJobs] = useState<JobWithProperty[]>([]);
  const [myJobs, setMyJobs] = useState<JobWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublishedJobs = async () => {
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
      console.error("Error fetching published jobs:", fetchError);
      return [];
    }
    return data as JobWithProperty[];
  };

  const fetchMyJobs = async () => {
    if (!user) return [];
    
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
      .eq("provider_id", user.id)
      .not("status", "eq", "cancelled")
      .order("scheduled_date", { ascending: true });

    if (fetchError) {
      console.error("Error fetching my jobs:", fetchError);
      return [];
    }
    return data as JobWithProperty[];
  };

  const refreshJobs = async () => {
    setLoading(true);
    setError(null);

    try {
      const [published, mine] = await Promise.all([
        fetchPublishedJobs(),
        fetchMyJobs()
      ]);
      setPublishedJobs(published);
      setMyJobs(mine);
    } catch (err) {
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshJobs();
    }
  }, [user]);

  const acceptJob = async (jobId: string, quotedPrice?: number) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        provider_id: user.id,
        status: "accepted" as JobStatus,
        quoted_price: quotedPrice || null,
      })
      .eq("id", jobId)
      .eq("status", "published");

    if (!updateError) {
      await refreshJobs();
    }

    return { error: updateError as Error | null };
  };

  const declineJob = async (jobId: string) => {
    // For now, declining just removes from view (no action needed)
    // In future, could track declined jobs
    setPublishedJobs(prev => prev.filter(job => job.id !== jobId));
    return { error: null };
  };

  const assignClerk = async (jobId: string, clerkId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        clerk_id: clerkId,
        status: "assigned" as JobStatus,
      })
      .eq("id", jobId)
      .eq("provider_id", user.id);

    if (!updateError) {
      await refreshJobs();
    }

    return { error: updateError as Error | null };
  };

  const unassignClerk = async (jobId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        clerk_id: null,
        status: "accepted" as JobStatus,
      })
      .eq("id", jobId)
      .eq("provider_id", user.id);

    if (!updateError) {
      await refreshJobs();
    }

    return { error: updateError as Error | null };
  };

  return {
    publishedJobs,
    myJobs,
    loading,
    error,
    refreshJobs,
    acceptJob,
    declineJob,
    assignClerk,
    unassignClerk,
  };
};
