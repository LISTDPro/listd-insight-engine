import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, MapPin, Calendar, Clock, Home, Sofa, Layers } from "lucide-react";
import { format, parseISO, isPast } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import CompleteJobDialog from "@/components/clerk/CompleteJobDialog";

interface ClerkJob {
  id: string;
  inspection_type: string;
  scheduled_date: string;
  preferred_time_slot: string | null;
  status: string;
  created_by_name: string | null;
  client_id: string;
  service_tier: string;
  clerk_payout: number | null;
  properties: {
    address_line_1: string;
    city: string;
    postcode: string;
    bedrooms?: number;
    property_type?: string;
    furnished_status?: string;
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
  reviewed: "bg-success/10 text-success",
  signed: "bg-success/10 text-success",
  paid: "bg-success/10 text-success",
};

const formatType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatPropertyType = (t: string) => {
  if (t === "studio") return "Studio";
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace("Bed", "Bedroom");
};

const formatFurnished = (s: string) =>
  s === "part_furnished" ? "Part Furnished" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const completableStatuses = ["in_progress", "accepted", "assigned"];

const ClerkJobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ClerkJob[]>([]);
  const [availableJobs, setAvailableJobs] = useState<ClerkJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tab, setTab] = useState("my");
  const [completeJob, setCompleteJob] = useState<ClerkJob | null>(null);

  const fetchJobs = async () => {
    if (!user) return;
    let q = supabase
      .from("jobs")
      .select("id, inspection_type, scheduled_date, preferred_time_slot, status, created_by_name, client_id, service_tier, clerk_payout, properties(address_line_1, city, postcode, bedrooms, property_type, furnished_status)")
      .eq("clerk_id", user.id)
      .neq("status", "cancelled")
      .order("scheduled_date", { ascending: false });

    if (dateFrom) q = q.gte("scheduled_date", dateFrom);
    if (dateTo) q = q.lte("scheduled_date", dateTo);

    const { data } = await q;
    setJobs((data as any) || []);
  };

  const fetchAvailableJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("id, inspection_type, scheduled_date, preferred_time_slot, status, created_by_name, client_id, service_tier, clerk_payout, properties(address_line_1, city, postcode, bedrooms, property_type, furnished_status)")
      .eq("status", "published")
      .is("clerk_id", null)
      .order("scheduled_date", { ascending: true });

    setAvailableJobs((data as any) || []);
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchJobs(), fetchAvailableJobs()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [user, dateFrom, dateTo]);

  const handleAccept = async (jobId: string) => {
    if (!user) return;
    setAccepting(jobId);

    const { error } = await supabase
      .from("jobs")
      .update({
        clerk_id: user.id,
        status: "accepted" as any,
        assigned_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("status", "published");

    setAccepting(null);

    if (error) {
      toast({ title: "Could not accept job", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job accepted!", description: "This job has been added to your list." });
      await fetchAll();
      setTab("my");
    }
  };

  const completedStatuses = ["completed", "paid", "signed", "reviewed", "submitted"];
  const pendingStatuses = ["accepted", "assigned", "published", "pending"];
  const inProgressStatuses = ["in_progress"];

  const filtered = jobs.filter((j) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "completed") return completedStatuses.includes(j.status);
    if (statusFilter === "pending") return pendingStatuses.includes(j.status);
    if (statusFilter === "in_progress") return inProgressStatuses.includes(j.status);
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-foreground">Jobs</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="my">My Jobs</TabsTrigger>
          <TabsTrigger value="available" className="gap-1.5">
            Available
            {availableJobs.length > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 min-w-[18px] px-1 ml-1">
                {availableJobs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── My Jobs Tab ── */}
        <TabsContent value="my" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-[150px]" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
            <Input type="date" className="w-[150px]" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
            {(statusFilter !== "all" || dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("all"); setDateFrom(""); setDateTo(""); }}>
                Clear
              </Button>
            )}
          </div>

          {/* Job list */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No jobs found
                </CardContent>
              </Card>
            ) : (
              filtered.map((job) => (
                <Card
                  key={job.id}
                  className="hover:shadow-sm cursor-pointer transition-shadow"
                  onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {job.properties?.address_line_1 || "Address pending"}
                        {job.properties?.postcode ? `, ${job.properties.postcode}` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatType(job.inspection_type)} · {format(parseISO(job.scheduled_date), "d MMM yyyy")}
                        {job.preferred_time_slot ? ` · ${job.preferred_time_slot}` : ""}
                      </p>
                      {job.created_by_name && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">Client: {job.created_by_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {completableStatuses.includes(job.status) ? (
                        <Button
                          size="sm"
                          variant="success"
                          className="text-[11px] h-7 px-2"
                          onClick={(e) => { e.stopPropagation(); setCompleteJob(job); }}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                      ) : null}
                      {!["completed", "cancelled", "paid", "signed"].includes(job.status) && isPast(parseISO(job.scheduled_date + "T23:59:59")) && (
                        <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                      )}
                      <Badge variant="outline" className={`text-[10px] ${statusColor[job.status] || ""}`}>
                        {formatType(job.status)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Available Jobs Tab ── */}
        <TabsContent value="available" className="space-y-2 mt-4">
          {availableJobs.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No available jobs right now. Check back soon!
              </CardContent>
            </Card>
          ) : (
            availableJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {job.properties?.address_line_1 || "Address pending"}
                        {job.properties?.postcode ? `, ${job.properties.postcode}` : ""}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {formatType(job.inspection_type)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(job.scheduled_date), "d MMM yyyy")}
                        </span>
                        {job.preferred_time_slot && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {job.preferred_time_slot}
                          </span>
                        )}
                        {job.properties?.property_type && (
                          <span className="flex items-center gap-1">
                            <Home className="w-3 h-3" />
                            {formatPropertyType(job.properties.property_type)}
                          </span>
                        )}
                        {job.properties?.furnished_status && (
                          <span className="flex items-center gap-1">
                            <Sofa className="w-3 h-3" />
                            {formatFurnished(job.properties.furnished_status)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {job.clerk_payout != null && job.clerk_payout > 0 && (
                        <span className="text-sm font-semibold text-foreground">
                          £{Number(job.clerk_payout).toFixed(2)}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {job.service_tier}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      className="text-[11px] h-7 px-3"
                      disabled={accepting === job.id}
                      onClick={() => handleAccept(job.id)}
                    >
                      {accepting === job.id ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      Accept Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {completeJob && (
        <CompleteJobDialog
          open={!!completeJob}
          onOpenChange={(o) => !o && setCompleteJob(null)}
          jobId={completeJob.id}
          propertyAddress={completeJob.properties?.address_line_1 || "the property"}
          clientId={completeJob.client_id}
          onCompleted={fetchAll}
        />
      )}
    </div>
  );
};

export default ClerkJobs;
