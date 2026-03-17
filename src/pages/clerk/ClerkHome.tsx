import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, CheckCircle, Clock, Loader2 } from "lucide-react";
import { format, isToday, startOfWeek, endOfWeek, parseISO, isPast } from "date-fns";
import CompleteJobDialog from "@/components/clerk/CompleteJobDialog";

interface ClerkJob {
  id: string;
  inspection_type: string;
  scheduled_date: string;
  preferred_time_slot: string | null;
  status: string;
  client_id: string;
  properties: {
    address_line_1: string;
    city: string;
    postcode: string;
  } | null;
}

const statusColor: Record<string, string> = {
  accepted: "bg-primary/10 text-primary",
  assigned: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  submitted: "bg-accent/10 text-accent",
  completed: "bg-success/10 text-success",
  published: "bg-secondary text-secondary-foreground",
  pending: "bg-muted text-muted-foreground",
};

const completableStatuses = ["in_progress", "accepted", "assigned"];

const ClerkHome = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ClerkJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeJob, setCompleteJob] = useState<ClerkJob | null>(null);

  const fetchJobs = async () => {
    if (!user) return;
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

    const { data } = await supabase
      .from("jobs")
      .select("id, inspection_type, scheduled_date, preferred_time_slot, status, client_id, properties(address_line_1, city, postcode)")
      .eq("clerk_id", user.id)
      .gte("scheduled_date", weekStart)
      .lte("scheduled_date", weekEnd)
      .neq("status", "cancelled")
      .order("scheduled_date", { ascending: true });

    setJobs((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  // Monthly stats
  const [monthStats, setMonthStats] = useState({ total: 0, completed: 0, pending: 0 });
  useEffect(() => {
    if (!user) return;
    const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
    supabase
      .from("jobs")
      .select("id, status")
      .eq("clerk_id", user.id)
      .gte("scheduled_date", monthStart)
      .neq("status", "cancelled")
      .then(({ data }) => {
        const all = data || [];
        setMonthStats({
          total: all.length,
          completed: all.filter((j) => ["completed", "paid", "signed", "reviewed"].includes(j.status)).length,
          pending: all.filter((j) => ["accepted", "assigned", "in_progress", "published", "pending"].includes(j.status)).length,
        });
      });
  }, [user]);

  const todayJobs = jobs.filter((j) => isToday(parseISO(j.scheduled_date)));
  const upcomingJobs = jobs.filter((j) => !isToday(parseISO(j.scheduled_date)));

  const formatType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const JobRow = ({ job }: { job: ClerkJob }) => (
    <div
      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:shadow-sm cursor-pointer transition-shadow"
      onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {job.properties?.address_line_1 || "Address pending"}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {formatType(job.inspection_type)} · {job.preferred_time_slot || "TBC"}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {completableStatuses.includes(job.status) && (
          <Button
            size="sm"
            variant="success"
            className="text-[11px] h-7 px-2"
            onClick={(e) => { e.stopPropagation(); setCompleteJob(job); }}
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Complete
          </Button>
        )}
        <Badge variant="outline" className={`ml-1 text-[10px] ${statusColor[job.status] || ""}`}>
          {formatType(job.status)}
        </Badge>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Welcome back, {profile?.full_name?.split(" ")[0] || "Clerk"}
        </h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "This Month", value: monthStats.total, icon: Briefcase, color: "text-primary" },
          { label: "Completed", value: monthStats.completed, icon: CheckCircle, color: "text-success" },
          { label: "Pending", value: monthStats.pending, icon: Clock, color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-border bg-card text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's jobs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Today's Jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {todayJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No jobs scheduled for today</p>
          ) : (
            todayJobs.map((j) => <JobRow key={j.id} job={j} />)
          )}
        </CardContent>
      </Card>

      {/* Upcoming this week */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Upcoming This Week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcomingJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming jobs this week</p>
          ) : (
            upcomingJobs.map((j) => (
              <div key={j.id}>
                <p className="text-[10px] text-muted-foreground mb-1 font-medium">
                  {format(parseISO(j.scheduled_date), "EEEE, d MMM")}
                </p>
                <JobRow job={j} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {completeJob && (
        <CompleteJobDialog
          open={!!completeJob}
          onOpenChange={(o) => !o && setCompleteJob(null)}
          jobId={completeJob.id}
          propertyAddress={completeJob.properties?.address_line_1 || "the property"}
          clientId={completeJob.client_id}
          onCompleted={fetchJobs}
        />
      )}
    </div>
  );
};

export default ClerkHome;
