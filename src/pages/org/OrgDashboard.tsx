import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Briefcase, CheckCircle, Clock, PoundSterling, Users, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { INSPECTION_TYPE_LABELS, JOB_STATUS_LABELS, JobStatus } from "@/types/database";
import NotificationDropdown from "@/components/dashboard/NotificationDropdown";

const STATUS_STYLES: Partial<Record<string, string>> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning",
  published: "bg-primary/10 text-primary",
  accepted: "bg-accent/10 text-accent",
  assigned: "bg-accent/10 text-accent",
  in_progress: "bg-warning/10 text-warning",
  submitted: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  paid: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

interface OrgJob {
  id: string;
  inspection_type: string;
  scheduled_date: string;
  status: string;
  quoted_price: number | null;
  final_price: number | null;
  created_by_name: string | null;
  properties: {
    address_line_1: string;
    city: string;
    postcode: string;
  } | null;
}

interface OrgMember {
  id: string;
  user_id: string;
  org_role: string;
  profiles: {
    full_name: string | null;
    phone: string | null;
  } | null;
}

const OrgDashboard = () => {
  const { user, orgRole, organisationId, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<OrgJob[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !organisationId || (orgRole !== "admin" && orgRole !== "owner"))) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, user, orgRole, organisationId, navigate]);

  useEffect(() => {
    if (!organisationId) return;

    const fetchData = async () => {
      // Fetch org name
      const { data: org } = await supabase
        .from("organisations")
        .select("name")
        .eq("id", organisationId)
        .single();
      if (org) setOrgName(org.name);

      // Fetch org jobs
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id, inspection_type, scheduled_date, status, quoted_price, final_price, created_by_name, properties(address_line_1, city, postcode)")
        .eq("organisation_id", organisationId)
        .order("scheduled_date", { ascending: false })
        .limit(100);
      setJobs((jobsData as any) || []);

      // Fetch org members
      const { data: membersData } = await supabase
        .from("organisation_members")
        .select("id, user_id, org_role, profiles(full_name, phone)")
        .eq("organisation_id", organisationId)
        .eq("status", "active");
      setMembers((membersData as any) || []);

      setLoading(false);
    };

    fetchData();
  }, [organisationId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !organisationId || (orgRole !== "admin" && orgRole !== "owner")) return null;

  const totalSpend = jobs.reduce((sum, j) => sum + (j.final_price || j.quoted_price || 0), 0);
  const completedJobs = jobs.filter(j => ["completed", "paid", "signed", "reviewed"].includes(j.status));
  const pendingJobs = jobs.filter(j => ["pending", "published", "accepted", "assigned", "in_progress", "submitted"].includes(j.status));

  const formatType = (t: string) => INSPECTION_TYPE_LABELS[t as keyof typeof INSPECTION_TYPE_LABELS] || t.replace(/_/g, " ");

  return (
    <div className="min-h-screen bg-background">
      <header className="h-12 flex items-center justify-between border-b border-border px-4 bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-foreground">{orgName} — Team View</span>
        </div>
        <NotificationDropdown />
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">{orgName}</h1>
          <p className="text-sm text-muted-foreground">Organisation overview and team activity</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Jobs", value: jobs.length, icon: Briefcase, color: "text-primary" },
            { label: "Completed", value: completedJobs.length, icon: CheckCircle, color: "text-success" },
            { label: "Pending", value: pendingJobs.length, icon: Clock, color: "text-warning" },
            { label: "Total Spend", value: `£${totalSpend.toFixed(2)}`, icon: PoundSterling, color: "text-accent" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              Team Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {(m.profiles as any)?.full_name || "Unnamed"}
                  </p>
                  <p className="text-[11px] text-muted-foreground capitalize">{m.org_role}</p>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize">{m.org_role}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4" />
              All Organisation Jobs ({jobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No jobs found</p>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:shadow-sm cursor-pointer transition-shadow"
                  onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {job.properties?.address_line_1 || "Address pending"}
                      {job.properties?.postcode ? `, ${job.properties.postcode}` : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatType(job.inspection_type)} · {format(parseISO(job.scheduled_date), "d MMM yyyy")}
                      {job.created_by_name && ` · ${job.created_by_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(job.final_price || job.quoted_price) && (
                      <span className="text-xs font-medium text-muted-foreground">
                        £{(job.final_price || job.quoted_price || 0).toFixed(2)}
                      </span>
                    )}
                    <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[job.status] || ""}`}>
                      {JOB_STATUS_LABELS[job.status as JobStatus] || job.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default OrgDashboard;
