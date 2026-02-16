import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Job, InspectionType, JobStatus } from "@/types/database";

interface CreateJobInput {
  property_id: string;
  inspection_type: InspectionType;
  scheduled_date: string;
  preferred_time_slot?: string;
  special_instructions?: string;
  quoted_price?: number;
  service_tier?: string;
}

export const useJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("jobs")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setJobs(data as Job[]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const createJob = async (input: CreateJobInput, propertyDetails?: { address: string; city: string; postcode: string }) => {
    if (!user) return { error: new Error("Not authenticated"), data: null };

    // Auto-publish jobs so providers can see them immediately
    const { data, error: insertError } = await supabase
      .from("jobs")
      .insert({
        ...input,
        client_id: user.id,
        status: "published" as JobStatus,
      })
      .select()
      .single();

    if (!insertError && data) {
      await fetchJobs();
      
      // Notify clerks about the new job via edge function
      try {
        await supabase.functions.invoke("notify-job-published", {
          body: {
            jobId: data.id,
            propertyAddress: propertyDetails?.address || "Property",
            city: propertyDetails?.city || "",
            postcode: propertyDetails?.postcode || "",
            inspectionType: input.inspection_type,
            scheduledDate: input.scheduled_date,
            timeSlot: input.preferred_time_slot,
          },
        });
        console.log("Clerk notification sent for new job");
      } catch (notifyError) {
        // Don't fail the job creation if notification fails
        console.error("Failed to notify clerks:", notifyError);
      }
    }

    return { 
      error: insertError as Error | null, 
      data: data as Job | null 
    };
  };

  const updateJob = async (id: string, input: Partial<Job>) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error: updateError } = await supabase
      .from("jobs")
      .update(input)
      .eq("id", id)
      .eq("client_id", user.id);

    if (!updateError) {
      await fetchJobs();
    }

    return { error: updateError as Error | null };
  };

  const cancelJob = async (id: string) => {
    return updateJob(id, { status: "cancelled" as JobStatus });
  };

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    createJob,
    updateJob,
    cancelJob,
  };
};
