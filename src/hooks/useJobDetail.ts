import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface JobWithDetails {
  id: string;
  property_id: string;
  client_id: string;
  provider_id: string | null;
  clerk_id: string | null;
  inspection_type: string;
  scheduled_date: string;
  preferred_time_slot: string | null;
  status: string;
  special_instructions: string | null;
  quoted_price: number | null;
  final_price: number | null;
  service_tier: string | null;
  created_at: string;
  updated_at: string;
  client_pre_inspection_ack: boolean | null;
  client_pre_inspection_ack_at: string | null;
  client_report_accepted: boolean | null;
  client_report_accepted_at: string | null;
  client_report_comments: string | null;
  provider_job_completed_ack: boolean | null;
  provider_job_completed_ack_at: string | null;
  clerk_report_submitted_ack: boolean | null;
  clerk_report_submitted_ack_at: string | null;
  // Related data
  property?: {
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    postcode: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
  };
  clerk_profile?: {
    full_name: string | null;
    phone: string | null;
  };
  provider_profile?: {
    full_name: string | null;
    company_name: string | null;
  };
}

export interface TimelineEvent {
  id: string;
  type: "status" | "acknowledgement" | "assignment" | "creation" | "communication";
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  actor?: string;
}

export const useJobDetail = (jobId: string | undefined) => {
  const { user } = useAuth();
  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = async () => {
    if (!user || !jobId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch job with property
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select(`
          *,
          property:properties(
            address_line_1,
            address_line_2,
            city,
            postcode,
            property_type,
            bedrooms,
            bathrooms
          )
        `)
        .eq("id", jobId)
        .maybeSingle();

      if (jobError) throw jobError;
      if (!jobData) {
        setError("Job not found");
        setLoading(false);
        return;
      }

      // Fetch clerk profile if assigned
      let clerkProfile = null;
      if (jobData.clerk_id) {
        const { data: clerkData } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", jobData.clerk_id)
          .maybeSingle();
        clerkProfile = clerkData;
      }

      // Provider role reserved for future SaaS expansion. Not active in Phase 1.

      const fullJob: JobWithDetails = {
        ...jobData,
        property: jobData.property,
        clerk_profile: clerkProfile,
        provider_profile: null,
      };

      setJob(fullJob);
      setTimeline(buildTimeline(fullJob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job");
    } finally {
      setLoading(false);
    }
  };

  const buildTimeline = (job: JobWithDetails): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Job creation
    events.push({
      id: "created",
      type: "creation",
      title: "Job Created",
      description: "Inspection job was booked and published",
      timestamp: job.created_at,
      icon: "plus-circle",
    });

    // Client pre-inspection acknowledgement
    if (job.client_pre_inspection_ack && job.client_pre_inspection_ack_at) {
      events.push({
        id: "client_pre_ack",
        type: "acknowledgement",
        title: "Client Confirmed Details",
        description: "Client acknowledged property details are correct before inspection",
        timestamp: job.client_pre_inspection_ack_at,
        icon: "shield-check",
        actor: "Client",
      });
    }

    // Provider role reserved for future SaaS expansion. Not active in Phase 1.

    // Clerk assignment
    if (job.clerk_id) {
      events.push({
        id: "clerk_assigned",
        type: "assignment",
        title: "Clerk Assigned",
        description: job.clerk_profile?.full_name
          ? `${job.clerk_profile.full_name} was assigned to this job`
          : "A clerk was assigned to this job",
        timestamp: job.updated_at,
        icon: "user-check",
        actor: job.clerk_profile?.full_name || "Clerk",
      });
    }

    // Status-based events
    const statusEvents: Record<string, { title: string; description: string; icon: string }> = {
      in_progress: {
        title: "Inspection Started",
        description: "The clerk has begun the property inspection",
        icon: "play-circle",
      },
      submitted: {
        title: "Report Submitted",
        description: "The inspection report has been submitted for review",
        icon: "file-check",
      },
      reviewed: {
        title: "Report Reviewed",
        description: "The inspection report has been reviewed",
        icon: "eye",
      },
    };

    if (statusEvents[job.status]) {
      events.push({
        id: `status_${job.status}`,
        type: "status",
        ...statusEvents[job.status],
        timestamp: job.updated_at,
      });
    }

    // Clerk report submitted acknowledgement
    if (job.clerk_report_submitted_ack && job.clerk_report_submitted_ack_at) {
      events.push({
        id: "clerk_submitted_ack",
        type: "acknowledgement",
        title: "Clerk Confirmed Submission",
        description: "Clerk acknowledged the report has been fully submitted",
        timestamp: job.clerk_report_submitted_ack_at,
        icon: "check-circle",
        actor: job.clerk_profile?.full_name || "Clerk",
      });
    }

    // Client report acceptance
    if (job.client_report_accepted && job.client_report_accepted_at) {
      events.push({
        id: "client_report_accepted",
        type: "acknowledgement",
        title: "Client Accepted Report",
        description: job.client_report_comments 
          ? `Report accepted with comments: "${job.client_report_comments}"`
          : "Client reviewed and accepted the inspection report",
        timestamp: job.client_report_accepted_at,
        icon: "thumbs-up",
        actor: "Client",
      });
    }

    // Provider role reserved for future SaaS expansion. Not active in Phase 1.

    // Completed/Paid status
    if (job.status === "completed" || job.status === "paid" || job.status === "signed") {
      events.push({
        id: "job_completed",
        type: "status",
        title: job.status === "paid" ? "Payment Released" : "Job Completed",
        description: job.status === "paid" 
          ? "Payment has been processed and released"
          : "The inspection job has been completed successfully",
        timestamp: job.updated_at,
        icon: job.status === "paid" ? "credit-card" : "check-circle-2",
      });
    }

    // Cancelled status
    if (job.status === "cancelled") {
      events.push({
        id: "job_cancelled",
        type: "status",
        title: "Job Cancelled",
        description: "This job has been cancelled",
        timestamp: job.updated_at,
        icon: "x-circle",
      });
    }

    // Reschedule events
    if ((job as any).reschedule_requested_at && (job as any).reschedule_status) {
      events.push({
        id: "reschedule_requested",
        type: "communication",
        title: "Reschedule Requested",
        description: `Client requested to reschedule to ${(job as any).reschedule_requested_date || "a new date"}`,
        timestamp: (job as any).reschedule_requested_at,
        icon: "calendar",
        actor: "Client",
      });

      if ((job as any).reschedule_status === "approved" && (job as any).reschedule_resolved_at) {
        events.push({
          id: "reschedule_approved",
          type: "status",
          title: "Reschedule Approved",
          description: "The reschedule request was approved by an admin",
          timestamp: (job as any).reschedule_resolved_at,
          icon: "check-circle",
          actor: "Admin",
        });
      } else if ((job as any).reschedule_status === "rejected" && (job as any).reschedule_resolved_at) {
        events.push({
          id: "reschedule_rejected",
          type: "status",
          title: "Reschedule Declined",
          description: "The reschedule request was declined. Original date remains.",
          timestamp: (job as any).reschedule_resolved_at,
          icon: "x-circle",
          actor: "Admin",
        });
      }
    }

    // Sort by timestamp descending (newest first)
    return events.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  useEffect(() => {
    fetchJob();
  }, [user, jobId]);

  return {
    job,
    timeline,
    loading,
    error,
    refetch: fetchJob,
  };
};
