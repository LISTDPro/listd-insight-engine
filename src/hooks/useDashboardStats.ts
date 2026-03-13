import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfDay, endOfDay, addDays, subMonths, format, startOfMonth } from "date-fns";

interface ClientStats {
  activeJobs: number;
  pendingApproval: number;
  reportsToReview: number;
  upcomingInspections: number;
  readyForPayment: number;
  totalSpend: number;
  totalJobs: number;
  monthSpend: number;
  monthJobs: number;
  avgJobCost: number;
  monthlyData: MonthlyData[];
  inspectionTypeBreakdown: InspectionTypeData[];
  statusBreakdown: { status: string; count: number }[];
}

interface MonthlyData {
  month: string;
  jobs: number;
  earnings: number;
}

interface InspectionTypeData {
  type: string;
  count: number;
}

interface ClerkStats {
  availableJobs: number;
  todayInspections: number;
  submittedReports: number;
  monthJobs: number;
  monthEarnings: number;
  pendingPayments: number;
  totalEarnings: number;
  totalJobs: number;
  avgJobValue: number;
  monthlyData: MonthlyData[];
  inspectionTypeBreakdown: InspectionTypeData[];
}


export const useDashboardStats = () => {
  const { user, role } = useAuth();
  const [clientStats, setClientStats] = useState<ClientStats>({
    activeJobs: 0,
    pendingApproval: 0,
    reportsToReview: 0,
    upcomingInspections: 0,
    readyForPayment: 0,
    totalSpend: 0,
    totalJobs: 0,
    monthSpend: 0,
    monthJobs: 0,
    avgJobCost: 0,
    monthlyData: [],
    inspectionTypeBreakdown: [],
    statusBreakdown: [],
  });
  const [clerkStats, setClerkStats] = useState<ClerkStats>({
    availableJobs: 0,
    todayInspections: 0,
    submittedReports: 0,
    monthJobs: 0,
    monthEarnings: 0,
    pendingPayments: 0,
    totalEarnings: 0,
    totalJobs: 0,
    avgJobValue: 0,
    monthlyData: [],
    inspectionTypeBreakdown: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !role) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        if (role === "client") {
          await fetchClientStats();
        } else if (role === "clerk") {
          await fetchClerkStats();
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, role]);

  const fetchClientStats = async () => {
    if (!user) return;

    const { count: activeCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id)
      .not("status", "in", '("completed","cancelled","paid")');

    const { count: reviewCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id)
      .in("status", ["submitted", "reviewed"])
      .or("client_report_accepted.is.null,client_report_accepted.eq.false");

    const today = startOfDay(new Date());
    const nextWeek = endOfDay(addDays(today, 7));
    const { count: upcomingCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id)
      .gte("scheduled_date", today.toISOString().split("T")[0])
      .lte("scheduled_date", nextWeek.toISOString().split("T")[0])
      .not("status", "in", '("completed","cancelled","paid")');

    const { count: paymentCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id)
      .in("status", ["signed", "completed"])
      .eq("client_report_accepted", true);

    const { count: pendingCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("client_id", user.id)
      .or("client_pre_inspection_ack.is.null,client_pre_inspection_ack.eq.false")
      .not("status", "in", '("draft","cancelled")');

    // All jobs for charts (last 6 months)
    const sixMonthsAgo = subMonths(new Date(), 6).toISOString().split("T")[0];
    const { data: allJobs } = await supabase
      .from("jobs")
      .select("scheduled_date, quoted_price, final_price, inspection_type, status")
      .eq("client_id", user.id)
      .gte("scheduled_date", sixMonthsAgo)
      .not("status", "eq", "cancelled");

    // Build monthly spending data
    const monthlyMap = new Map<string, { jobs: number; spend: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, "MMM yyyy");
      monthlyMap.set(key, { jobs: 0, spend: 0 });
    }

    const inspectionMap = new Map<string, number>();
    const statusMap = new Map<string, number>();
    let totalSpend = 0;
    let totalJobs = 0;

    const thisMonthKey = format(new Date(), "MMM yyyy");
    let monthSpend = 0;
    let monthJobs = 0;

    const TYPE_LABELS: Record<string, string> = {
      new_inventory: "New Inventory",
      check_in: "Check-In",
      check_out: "Check-Out",
      mid_term: "Mid-Term",
      interim: "Interim",
    };

    const STATUS_LABELS: Record<string, string> = {
      draft: "Draft",
      pending: "Pending",
      published: "Published",
      accepted: "Accepted",
      assigned: "Assigned",
      in_progress: "In Progress",
      submitted: "Submitted",
      reviewed: "Reviewed",
      signed: "Signed",
      completed: "Completed",
      paid: "Paid",
    };

    for (const job of allJobs || []) {
      const monthKey = format(new Date(job.scheduled_date), "MMM yyyy");
      const price = job.final_price || job.quoted_price || 0;

      if (monthlyMap.has(monthKey)) {
        const entry = monthlyMap.get(monthKey)!;
        entry.jobs += 1;
        entry.spend += price;
      }

      if (monthKey === thisMonthKey) {
        monthSpend += price;
        monthJobs += 1;
      }

      totalSpend += price;
      totalJobs += 1;

      const iType = job.inspection_type || "other";
      inspectionMap.set(iType, (inspectionMap.get(iType) || 0) + 1);

      const st = job.status || "unknown";
      statusMap.set(st, (statusMap.get(st) || 0) + 1);
    }

    const monthlyData: MonthlyData[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month: month.split(" ")[0],
      jobs: data.jobs,
      earnings: Math.round(data.spend),
    }));

    const inspectionTypeBreakdown: InspectionTypeData[] = Array.from(inspectionMap.entries()).map(([type, count]) => ({
      type: TYPE_LABELS[type] || type,
      count,
    }));

    const statusBreakdown = Array.from(statusMap.entries()).map(([status, count]) => ({
      status: STATUS_LABELS[status] || status,
      count,
    }));

    setClientStats({
      activeJobs: activeCount || 0,
      pendingApproval: pendingCount || 0,
      reportsToReview: reviewCount || 0,
      upcomingInspections: upcomingCount || 0,
      readyForPayment: paymentCount || 0,
      totalSpend,
      totalJobs,
      monthSpend,
      monthJobs,
      avgJobCost: totalJobs > 0 ? totalSpend / totalJobs : 0,
      monthlyData,
      inspectionTypeBreakdown,
      statusBreakdown,
    });
  };

  const fetchClerkStats = async () => {
    if (!user) return;

    const { count: availableCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    const todayStr = new Date().toISOString().split("T")[0];
    const { count: todayCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("clerk_id", user.id)
      .eq("scheduled_date", todayStr)
      .not("status", "in", '("completed","cancelled","paid","submitted")');

    const { count: submittedCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("clerk_id", user.id)
      .eq("status", "submitted");

    const monthStart = startOfMonth(new Date()).toISOString().split("T")[0];
    const { data: monthJobs } = await supabase
      .from("jobs")
      .select("quoted_price, final_price")
      .eq("clerk_id", user.id)
      .gte("scheduled_date", monthStart)
      .in("status", ["completed", "paid", "submitted", "reviewed"]);

    const monthEarnings = (monthJobs || []).reduce((sum, j) => sum + (j.clerk_payout || 0), 0);

    const { count: pendingPayCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("clerk_id", user.id)
      .in("status", ["completed", "reviewed", "submitted"]);

    const sixMonthsAgo = subMonths(new Date(), 6).toISOString().split("T")[0];
    const { data: allJobs } = await supabase
      .from("jobs")
      .select("scheduled_date, clerk_payout, inspection_type, status")
      .eq("clerk_id", user.id)
      .gte("scheduled_date", sixMonthsAgo)
      .not("status", "in", '("draft","cancelled")');

    const monthlyMap = new Map<string, { jobs: number; earnings: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, "MMM yyyy");
      monthlyMap.set(key, { jobs: 0, earnings: 0 });
    }

    const inspectionMap = new Map<string, number>();
    let totalEarnings = 0;
    let totalJobs = 0;

    for (const job of allJobs || []) {
      const monthKey = format(new Date(job.scheduled_date), "MMM yyyy");
      const price = (job.final_price || job.quoted_price || 0) * 0.85;
      if (monthlyMap.has(monthKey)) {
        const entry = monthlyMap.get(monthKey)!;
        entry.jobs += 1;
        entry.earnings += price;
      }
      totalEarnings += price;
      totalJobs += 1;
      const iType = job.inspection_type || "other";
      inspectionMap.set(iType, (inspectionMap.get(iType) || 0) + 1);
    }

    const monthlyData: MonthlyData[] = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month: month.split(" ")[0],
      jobs: data.jobs,
      earnings: Math.round(data.earnings),
    }));

    const TYPE_LABELS: Record<string, string> = {
      new_inventory: "New Inventory",
      check_in: "Check-In",
      check_out: "Check-Out",
      mid_term: "Mid-Term",
      interim: "Interim",
    };

    const inspectionTypeBreakdown: InspectionTypeData[] = Array.from(inspectionMap.entries()).map(([type, count]) => ({
      type: TYPE_LABELS[type] || type,
      count,
    }));

    setClerkStats({
      availableJobs: availableCount || 0,
      todayInspections: todayCount || 0,
      submittedReports: submittedCount || 0,
      monthJobs: (monthJobs || []).length,
      monthEarnings,
      pendingPayments: pendingPayCount || 0,
      totalEarnings,
      totalJobs,
      avgJobValue: totalJobs > 0 ? totalEarnings / totalJobs : 0,
      monthlyData,
      inspectionTypeBreakdown,
    });
  };


  return {
    clientStats,
    clerkStats,
    loading,
    refetch: () => {
      if (role === "client") fetchClientStats();
      else if (role === "clerk") fetchClerkStats();
    },
  };
};
