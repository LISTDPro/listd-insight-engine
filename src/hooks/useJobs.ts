import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Job, InspectionType, JobStatus } from "@/types/database";
import { getClerkPayout, calculateMargin } from "@/utils/clerkPricing";

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
  const { user, organisationId } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    // Org-aware: fetch by organisation_id if user belongs to an org, otherwise by client_id
    let query = supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (organisationId) {
      query = query.eq("organisation_id", organisationId);
    } else {
      query = query.eq("client_id", user.id);
    }

    const { data, error: fetchError } = await query;

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

  const createJob = async (input: CreateJobInput, propertyDetails?: { address: string; city: string; postcode: string; property_type?: string }) => {
    if (!user) return { error: new Error("Not authenticated"), data: null };

    // Calculate clerk payout and margin automatically
    const clerkPay = propertyDetails?.property_type
      ? getClerkPayout(input.inspection_type, propertyDetails.property_type)
      : 0;
    const clientPrice = input.quoted_price ?? 0;
    const margin = calculateMargin(clientPrice, clerkPay);

    // Auto-publish jobs so providers can see them immediately
    const { data, error: insertError } = await supabase
      .from("jobs")
      .insert({
        ...input,
        client_id: user.id,
        created_by_user_id: user.id,
        organisation_id: organisationId || undefined,
        status: "published" as JobStatus,
        clerk_payout: clerkPay,
        clerk_final_payout: clerkPay,
        margin,
      } as any)
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
        console.error("Failed to notify clerks:", notifyError);
      }

      // Notify admin about the new job
      try {
        await supabase.functions.invoke("notify-admin", {
          body: {
            type: "job_posted",
            jobId: data.id,
            propertyAddress: propertyDetails?.address || "Property",
            city: propertyDetails?.city || "",
            postcode: propertyDetails?.postcode || "",
            inspectionType: input.inspection_type,
            scheduledDate: input.scheduled_date,
          },
        });
      } catch (e) {
        console.error("Failed to notify admin:", e);
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
