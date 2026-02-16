import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  InspectionReport,
  InspectionRoom,
  InspectionItem,
  InspectionPhoto,
} from "@/types/database";

interface ReportJob {
  id: string;
  inspection_type: string;
  scheduled_date: string;
  status: string;
  special_instructions: string | null;
  client_report_accepted: boolean;
  client_report_accepted_at: string | null;
  client_report_comments: string | null;
  client_signature_url: string | null;
  service_tier: string;
  property: {
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    postcode: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    furnished_status: string;
  };
}

export interface ReportReviewData {
  report: InspectionReport;
  job: ReportJob;
  rooms: InspectionRoom[];
  items: InspectionItem[];
  photos: InspectionPhoto[];
  clerkName: string | null;
}

export const useReportReview = (jobId?: string) => {
  const { user } = useAuth();
  const [data, setData] = useState<ReportReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!jobId || !user) return;
    setLoading(true);

    // Fetch job
    const { data: jobData, error: jobErr } = await supabase
      .from("jobs")
      .select(`
        id, inspection_type, scheduled_date, status, special_instructions,
        client_report_accepted, client_report_accepted_at, client_report_comments,
        client_signature_url, service_tier,
        property:properties(
          address_line_1, address_line_2, city, postcode,
          property_type, bedrooms, bathrooms, furnished_status
        )
      `)
      .eq("id", jobId)
      .single();

    if (jobErr || !jobData) {
      setError(jobErr?.message || "Job not found");
      setLoading(false);
      return;
    }

    // Fetch report
    const { data: reportData, error: reportErr } = await supabase
      .from("inspection_reports")
      .select("*")
      .eq("job_id", jobId)
      .maybeSingle();

    if (reportErr || !reportData) {
      setError(reportErr?.message || "No report found for this job");
      setLoading(false);
      return;
    }

    const report = reportData as InspectionReport;

    // Fetch clerk name
    const { data: clerkProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", report.clerk_id)
      .maybeSingle();

    // Fetch rooms
    const { data: roomsData } = await supabase
      .from("inspection_rooms")
      .select("*")
      .eq("report_id", report.id)
      .order("room_order");

    const rooms = (roomsData || []) as InspectionRoom[];
    const roomIds = rooms.map((r) => r.id);

    // Fetch items and photos in parallel
    const [itemsRes, photosRes] = await Promise.all([
      roomIds.length > 0
        ? supabase
            .from("inspection_items")
            .select("*")
            .in("room_id", roomIds)
            .order("item_order")
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("inspection_photos")
        .select("*")
        .eq("report_id", report.id)
        .order("created_at"),
    ]);

    setData({
      report,
      job: jobData as unknown as ReportJob,
      rooms,
      items: (itemsRes.data || []) as InspectionItem[],
      photos: (photosRes.data || []) as InspectionPhoto[],
      clerkName: clerkProfile?.full_name || null,
    });
    setLoading(false);
  }, [jobId, user]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { data, loading, error, refetch: fetchReport };
};
