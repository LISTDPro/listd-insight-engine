import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSuperAdminStats = () =>
  useQuery({
    queryKey: ["super-admin-stats"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [orgs, clerks, jobsAll, jobsMonth, props, reports, revenueMonth] =
        await Promise.all([
          supabase.from("organisations").select("id", { count: "exact", head: true }),
          supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "clerk"),
          supabase.from("jobs").select("id", { count: "exact", head: true }),
          supabase.from("jobs").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
          supabase.from("properties").select("id", { count: "exact", head: true }),
          supabase.from("generated_reports").select("id", { count: "exact", head: true }),
          supabase.from("jobs").select("quoted_price").gte("created_at", monthStart).not("quoted_price", "is", null),
        ]);

      const revenue = (revenueMonth.data || []).reduce(
        (sum, j) => sum + (Number(j.quoted_price) || 0),
        0
      );

      return {
        totalOrgs: orgs.count || 0,
        totalClerks: clerks.count || 0,
        totalJobsAllTime: jobsAll.count || 0,
        totalJobsMonth: jobsMonth.count || 0,
        totalProperties: props.count || 0,
        totalReports: reports.count || 0,
        revenueMonth: revenue,
      };
    },
    staleTime: 30_000,
  });

export const useRecentJobs = () =>
  useQuery({
    queryKey: ["super-admin-recent-jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("jobs")
        .select("id, status, scheduled_date, inspection_type, quoted_price, property_id, client_id, clerk_id")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!data || data.length === 0) return [];

      const propertyIds = [...new Set(data.map((j) => j.property_id))];
      const clerkIds = [...new Set(data.filter((j) => j.clerk_id).map((j) => j.clerk_id!))];

      const [propRes, clerkRes] = await Promise.all([
        supabase.from("properties").select("id, address_line_1, city").in("id", propertyIds),
        clerkIds.length > 0
          ? supabase.from("profiles").select("user_id, full_name").in("user_id", clerkIds)
          : Promise.resolve({ data: [] }),
      ]);

      const propMap = Object.fromEntries((propRes.data || []).map((p) => [p.id, p]));
      const clerkMap = Object.fromEntries((clerkRes.data || []).map((c) => [c.user_id, c]));

      return data.map((j) => ({
        ...j,
        property: propMap[j.property_id],
        clerk: j.clerk_id ? clerkMap[j.clerk_id] : null,
      }));
    },
    staleTime: 30_000,
  });

export const useRecentOrgs = () =>
  useQuery({
    queryKey: ["super-admin-recent-orgs"],
    queryFn: async () => {
      const { data: orgs } = await supabase
        .from("organisations")
        .select("id, name, created_at, created_by")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!orgs || orgs.length === 0) return [];

      const ownerIds = [...new Set(orgs.map((o) => o.created_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ownerIds);

      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));

      return orgs.map((o) => ({
        ...o,
        ownerName: profileMap[o.created_by]?.full_name || "Unknown",
      }));
    },
    staleTime: 30_000,
  });

export const useAllOrganisations = () =>
  useQuery({
    queryKey: ["super-admin-all-orgs"],
    queryFn: async () => {
      const { data: orgs } = await supabase
        .from("organisations")
        .select("id, name, created_at, created_by")
        .order("created_at", { ascending: false });

      if (!orgs) return [];

      const orgIds = orgs.map((o) => o.id);
      const ownerIds = [...new Set(orgs.map((o) => o.created_by))];

      const [membersRes, jobsRes, propsRes, profilesRes] = await Promise.all([
        supabase.from("organisation_members").select("organisation_id, user_id, org_role").in("organisation_id", orgIds).eq("status", "active"),
        supabase.from("jobs").select("id, organisation_id").in("organisation_id", orgIds),
        supabase.from("properties").select("id, organisation_id").in("organisation_id", orgIds),
        supabase.from("profiles").select("user_id, full_name").in("user_id", ownerIds),
      ]);

      const profileMap = Object.fromEntries((profilesRes.data || []).map((p) => [p.user_id, p]));

      return orgs.map((o) => {
        const members = (membersRes.data || []).filter((m) => m.organisation_id === o.id);
        const owner = members.find((m) => m.org_role === "owner");
        return {
          ...o,
          ownerName: profileMap[o.created_by]?.full_name || "Unknown",
          memberCount: members.length,
          jobCount: (jobsRes.data || []).filter((j) => j.organisation_id === o.id).length,
          propertyCount: (propsRes.data || []).filter((p) => p.organisation_id === o.id).length,
        };
      });
    },
    staleTime: 60_000,
  });

export const useAllClerks = () =>
  useQuery({
    queryKey: ["super-admin-all-clerks"],
    queryFn: async () => {
      const { data: clerkRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "clerk");

      if (!clerkRoles || clerkRoles.length === 0) return [];

      const clerkIds = clerkRoles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, clerk_jobs_completed, clerk_rating, clerk_level, created_at")
        .in("user_id", clerkIds);

      return (profiles || []).map((p) => ({
        ...p,
        jobsCompleted: p.clerk_jobs_completed || 0,
        rating: Number(p.clerk_rating) || 0,
        level: p.clerk_level || 1,
      }));
    },
    staleTime: 60_000,
  });

export const useAllJobs = () =>
  useQuery({
    queryKey: ["super-admin-all-jobs"],
    queryFn: async () => {
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, status, scheduled_date, inspection_type, quoted_price, property_id, client_id, clerk_id, organisation_id, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!jobs || jobs.length === 0) return [];

      const propertyIds = [...new Set(jobs.map((j) => j.property_id))];
      const clerkIds = [...new Set(jobs.filter((j) => j.clerk_id).map((j) => j.clerk_id!))];
      const orgIds = [...new Set(jobs.filter((j) => j.organisation_id).map((j) => j.organisation_id!))];

      const [propRes, clerkRes, orgRes] = await Promise.all([
        supabase.from("properties").select("id, address_line_1, city, postcode").in("id", propertyIds),
        clerkIds.length > 0 ? supabase.from("profiles").select("user_id, full_name").in("user_id", clerkIds) : Promise.resolve({ data: [] }),
        orgIds.length > 0 ? supabase.from("organisations").select("id, name").in("id", orgIds) : Promise.resolve({ data: [] }),
      ]);

      const propMap = Object.fromEntries((propRes.data || []).map((p) => [p.id, p]));
      const clerkMap = Object.fromEntries((clerkRes.data || []).map((c) => [c.user_id, c]));
      const orgMap = Object.fromEntries((orgRes.data || []).map((o) => [o.id, o]));

      return jobs.map((j) => ({
        ...j,
        property: propMap[j.property_id],
        clerk: j.clerk_id ? clerkMap[j.clerk_id] : null,
        organisation: j.organisation_id ? orgMap[j.organisation_id] : null,
      }));
    },
    staleTime: 30_000,
  });
