import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";
import { format, parseISO } from "date-fns";

interface ClerkJob {
  id: string;
  inspection_type: string;
  scheduled_date: string;
  preferred_time_slot: string | null;
  status: string;
  created_by_name: string | null;
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
  reviewed: "bg-success/10 text-success",
  signed: "bg-success/10 text-success",
  paid: "bg-success/10 text-success",
};

const formatType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const ClerkJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<ClerkJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      let q = supabase
        .from("jobs")
        .select("id, inspection_type, scheduled_date, preferred_time_slot, status, created_by_name, properties(address_line_1, city, postcode)")
        .eq("clerk_id", user.id)
        .neq("status", "cancelled")
        .order("scheduled_date", { ascending: false });

      if (dateFrom) q = q.gte("scheduled_date", dateFrom);
      if (dateTo) q = q.lte("scheduled_date", dateTo);

      const { data } = await q;
      setJobs((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, [user, dateFrom, dateTo]);

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
      <h1 className="text-xl font-bold text-foreground">My Jobs</h1>

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
                <Badge variant="outline" className={`shrink-0 text-[10px] ${statusColor[job.status] || ""}`}>
                  {formatType(job.status)}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ClerkJobs;
