import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, parseISO, isSameDay } from "date-fns";

interface ScheduleJob {
  id: string;
  inspection_type: string;
  scheduled_date: string;
  preferred_time_slot: string | null;
  status: string;
  properties: { address_line_1: string; postcode: string } | null;
}

const formatType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const statusDot: Record<string, string> = {
  accepted: "bg-primary",
  assigned: "bg-primary",
  in_progress: "bg-warning",
  submitted: "bg-accent",
  completed: "bg-success",
};

const ClerkSchedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [jobs, setJobs] = useState<ScheduleJob[]>([]);
  const [loading, setLoading] = useState(true);

  const baseDate = addWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("jobs")
      .select("id, inspection_type, scheduled_date, preferred_time_slot, status, properties(address_line_1, postcode)")
      .eq("clerk_id", user.id)
      .gte("scheduled_date", format(weekStart, "yyyy-MM-dd"))
      .lte("scheduled_date", format(weekEnd, "yyyy-MM-dd"))
      .neq("status", "cancelled")
      .order("scheduled_date")
      .then(({ data }) => {
        setJobs((data as any) || []);
        setLoading(false);
      });
  }, [user, weekOffset]);

  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Schedule</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((w) => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" disabled={isCurrentWeek} onClick={() => setWeekOffset(0)}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset((w) => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {format(weekStart, "d MMM")} — {format(weekEnd, "d MMM yyyy")}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {days.map((day) => {
            const dayJobs = jobs.filter((j) => isSameDay(parseISO(j.scheduled_date), day));
            const isToday = isSameDay(day, new Date());

            return (
              <Card key={day.toISOString()} className={isToday ? "ring-2 ring-primary/40" : ""}>
                <CardHeader className="p-2 pb-1">
                  <CardTitle className={`text-[11px] font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {format(day, "EEE d")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 pt-0 space-y-1 min-h-[80px]">
                  {dayJobs.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/50 italic">No jobs</p>
                  ) : (
                    dayJobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-1.5 rounded bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[job.status] || "bg-muted-foreground"}`} />
                          <p className="text-[10px] font-medium text-foreground truncate">
                            {job.properties?.address_line_1?.split(",")[0] || "TBC"}
                          </p>
                        </div>
                        <p className="text-[9px] text-muted-foreground truncate">
                          {formatType(job.inspection_type)}
                          {job.preferred_time_slot ? ` · ${job.preferred_time_slot}` : ""}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClerkSchedule;
