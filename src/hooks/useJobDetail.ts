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
    kitchens: number;
    living_rooms: number;
    dining_areas: number;
    utility_rooms: number;
    storage_rooms: number;
    hallways_stairs: number;
    gardens: number;
    communal_areas: number;
    furnished_status: string;
    heavily_furnished: boolean;
    notes: string | null;
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
          property:properties(*)
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

      // Fetch creator profile if created_by_user_id exists
      let creatorName: string | null = null;
      if (jobData.created_by_user_id) {
        const { data: creatorData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", jobData.created_by_user_id)
          .maybeSingle();
        creatorName = creatorData?.full_name || null;
      }

      // Fetch assigner profile if assigned_by exists
      let assignerName: string | null = null;
      if ((jobData as any).assigned_by) {
        const { data: assignerData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", (jobData as any).assigned_by)
          .maybeSingle();
        assignerName = assignerData?.full_name || null;
      }

      const fullJob: JobWithDetails = {
        ...jobData,
        property: jobData.property,
        clerk_profile: clerkProfile,
        provider_profile: null,
        creator_name: creatorName,
        assigner_name: assignerName,
      } as any;

      setJob(fullJob);
      setTimeline(buildTimeline(fullJob));

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
      actor: (job as any).creator_name || undefined,
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
      const assignerName = (job as any).assigner_name;
      const clerkName = job.clerk_profile?.full_name;
      const isSelfAssigned = (job as any).assigned_by === job.clerk_id;
      
      let assignDescription: string;
      let assignActor: string;
      
      if (assignerName && !isSelfAssigned) {
        assignDescription = `${clerkName || "A clerk"} was assigned by ${assignerName}`;
        assignActor = assignerName;
      } else if (isSelfAssigned) {
        assignDescription = `${clerkName || "Clerk"} self-assigned this job`;
        assignActor = clerkName || "Clerk";
      } else {
        assignDescription = `${clerkName || "A clerk"} was assigned to this job`;
        assignActor = clerkName || "Clerk";
      }

      events.push({
        id: "clerk_assigned",
        type: "assignment",
        title: "Clerk Assigned",
        description: assignDescription,
        timestamp: (job as any).accepted_at || job.updated_at,
        icon: "user-check",
        actor: assignActor,
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

  const fetchPropertyChangeLogs = async (propertyId: string, jobCreatedAt: string): Promise<TimelineEvent[]> => {
    const { data } = await supabase
      .from("property_change_logs" as any)
      .select("*")
      .eq("property_id", propertyId)
      .gte("created_at", jobCreatedAt)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) return [];

    return (data as any[]).map((log) => {
      const changes = log.changes as Record<string, { old: any; new: any }>;
      const fieldLabels: Record<string, string> = {
        address_line_1: "Address", address_line_2: "Address Line 2",
        city: "City", postcode: "Postcode", property_type: "Property Type",
        bedrooms: "Bedrooms", bathrooms: "Bathrooms", kitchens: "Kitchens",
        living_rooms: "Living Rooms", dining_areas: "Dining Areas",
        utility_rooms: "Utility Rooms", storage_rooms: "Storage Rooms",
        hallways_stairs: "Hallways", gardens: "Gardens",
        communal_areas: "Communal Areas", furnished_status: "Furnished Status",
        heavily_furnished: "Heavily Furnished", notes: "Notes",
      };

      const desc = Object.entries(changes)
        .map(([field, vals]) => `${fieldLabels[field] || field}: ${vals.old} → ${vals.new}`)
        .join(", ");

      const pricingFlag = log.may_affect_pricing
        ? " ⚠️ This change may affect pricing — flagged for review."
        : "";

      return {
        id: `property_change_${log.id}`,
        type: "communication" as const,
        title: "Property Details Updated",
        description: `${desc}${pricingFlag}`,
        timestamp: log.created_at,
        icon: "building",
        actor: "Client",
      };
    });
  };

  useEffect(() => {
    const loadAll = async () => {
      await fetchJob();
    };
    loadAll();
  }, [user, jobId]);

  // Fetch property change logs after job is loaded and merge into timeline
  useEffect(() => {
    if (!job) return;
    fetchPropertyChangeLogs(job.property_id, job.created_at).then((changeEvents) => {
      if (changeEvents.length > 0) {
        setTimeline((prev) => {
          // Remove old property_change_ events to avoid duplicates
          const filtered = prev.filter((e) => !e.id.startsWith("property_change_"));
          const merged = [...filtered, ...changeEvents];
          return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });
      }
    });
  }, [job?.id]);

  return {
    job,
    timeline,
    loading,
    error,
    refetch: fetchJob,
  };
};
