import { useNavigate } from "react-router-dom";
import { useClerkJobs } from "@/hooks/useClerkJobs";
import { INSPECTION_TYPE_LABELS, PROPERTY_TYPE_LABELS, FURNISHED_STATUS_LABELS, PropertyType, FurnishedStatus } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { calculatePayoutBreakdown } from "@/utils/escrow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TierBadge from "@/components/ui/tier-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ClipboardCheck,
  Inbox,
  Briefcase,
  Check,
  X,
  Loader2,
  RefreshCw,
  PoundSterling
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import SwipeableCardStack from "./SwipeableCardStack";
import SwipeJobCardContent from "./SwipeJobCardContent";

const ClerkJobsList = () => {
  const navigate = useNavigate();
  const { 
    availableJobs, 
    myJobs, 
    loading, 
    refreshJobs,
    acceptJob,
    declineJob 
  } = useClerkJobs();

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return "Overdue";
    return format(date, "EEE, MMM d");
  };

  const getDateColor = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isPast(date) && !isToday(date)) return "text-destructive";
    if (isToday(date)) return "text-primary font-semibold";
    return "text-muted-foreground";
  };

  const handleAcceptJob = async (jobId: string) => {
    const { error } = await acceptJob(jobId);
    if (error) {
      toast.error("Failed to accept job");
    } else {
      toast.success("Job accepted! It's now in your active jobs.");
    }
  };

  const handleDeclineJob = async (jobId: string) => {
    await declineJob(jobId);
    toast.info("Job declined");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Group my jobs
  const todayJobs = myJobs.filter(j => isToday(new Date(j.scheduled_date)));
  const upcomingJobs = myJobs.filter(j => !isToday(new Date(j.scheduled_date)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Job Management</h2>
        <Button variant="outline" size="sm" onClick={refreshJobs} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="my-jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="my-jobs" className="gap-2">
            <Briefcase className="w-4 h-4" />
            My Jobs
            {myJobs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {myJobs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="available" className="gap-2">
            <Inbox className="w-4 h-4" />
            Available
            {availableJobs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {availableJobs.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="today" className="gap-2">
            <Clock className="w-4 h-4" />
            Today
            {todayJobs.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {todayJobs.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Available Jobs Tab — Swipeable */}
        <TabsContent value="available">
          <SwipeableCardStack
            items={availableJobs.map((j) => ({ ...j, id: j.id }))}
            rightLabel="Accept"
            leftLabel="Decline"
            rightIcon={<Check className="w-5 h-5" />}
            leftIcon={<X className="w-5 h-5" />}
            onSwipeRight={(job) => handleAcceptJob(job.id)}
            onSwipeLeft={(job) => handleDeclineJob(job.id)}
            renderCard={(job) => (
              <SwipeJobCardContent
                job={job}
                showNetPayout={true}
                statusBadge={
                  <Badge className="bg-success text-success-foreground text-xs">Available</Badge>
                }
              />
            )}
            emptyMessage={
              <Card>
                <CardContent className="py-8 text-center">
                  <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-foreground mb-2">No Available Jobs</h3>
                  <p className="text-sm text-muted-foreground">
                    New jobs from clients will appear here for you to accept.
                  </p>
                </CardContent>
              </Card>
            }
          />
        </TabsContent>

        {/* Today Tab */}
        <TabsContent value="today" className="space-y-3">
          {todayJobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No Jobs Today</h3>
                <p className="text-sm text-muted-foreground">
                  You have no inspections scheduled for today.
                </p>
              </CardContent>
            </Card>
          ) : (
            todayJobs.map((job) => {
              const payout = (job as any).clerk_final_payout || (job as any).clerk_payout || 0;
              const propType = job.property?.property_type ? PROPERTY_TYPE_LABELS[job.property.property_type as PropertyType] : null;
              const furnished = (job.property as any)?.furnished_status ? FURNISHED_STATUS_LABELS[(job.property as any).furnished_status as FurnishedStatus] : null;
              return (
              <Card 
                key={job.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {INSPECTION_TYPE_LABELS[job.inspection_type as keyof typeof INSPECTION_TYPE_LABELS]}
                        </Badge>
                        <TierBadge tier={(job as any).service_tier} size="sm" />
                        {propType && <Badge variant="secondary" className="text-[10px]">{propType}</Badge>}
                        {furnished && <Badge variant="secondary" className="text-[10px]">{furnished}</Badge>}
                        {job.status === "in_progress" && (
                          <Badge className="bg-warning text-warning-foreground text-xs">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-foreground truncate">
                        {job.property?.address_line_1}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.property?.city}, {job.property?.postcode}
                      </div>
                      {job.preferred_time_slot && (
                        <div className="flex items-center gap-1 text-sm text-primary mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          {job.preferred_time_slot === "morning" && "9:00 - 12:00"}
                          {job.preferred_time_slot === "afternoon" && "12:00 - 17:00"}
                          {job.preferred_time_slot === "evening" && "17:00 - 20:00"}
                        </div>
                      )}
                      {payout > 0 && (
                        <div className="flex items-center gap-1 text-sm text-accent font-semibold mt-1">
                          <PoundSterling className="w-3.5 h-3.5" />
                          {payout.toFixed(0)} payout
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="accent" className="ml-4 gap-1">
                      {job.status === "in_progress" ? "Continue" : "Start"}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })
          )}
        </TabsContent>

        {/* My Jobs Tab */}
        <TabsContent value="my-jobs" className="space-y-6">
          {myJobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">No Active Jobs</h3>
                <p className="text-sm text-muted-foreground">
                  Accept available jobs to see them here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Today's Jobs */}
              {todayJobs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Today ({todayJobs.length})
                  </h3>
                  <div className="space-y-3">
                    {todayJobs.map((job) => {
                      const payout = (job as any).clerk_final_payout || (job as any).clerk_payout || 0;
                      const propType = job.property?.property_type ? PROPERTY_TYPE_LABELS[job.property.property_type as PropertyType] : null;
                      const furnished = (job.property as any)?.furnished_status ? FURNISHED_STATUS_LABELS[(job.property as any).furnished_status as FurnishedStatus] : null;
                      return (
                      <Card 
                        key={job.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {INSPECTION_TYPE_LABELS[job.inspection_type as keyof typeof INSPECTION_TYPE_LABELS]}
                                </Badge>
                                <TierBadge tier={(job as any).service_tier} size="sm" />
                                {propType && <Badge variant="secondary" className="text-[10px]">{propType}</Badge>}
                                {furnished && <Badge variant="secondary" className="text-[10px]">{furnished}</Badge>}
                                {job.status === "in_progress" && (
                                  <Badge className="bg-warning text-warning-foreground text-xs">
                                    In Progress
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium text-foreground truncate">
                                {job.property?.address_line_1}
                              </h4>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5" />
                                {job.property?.city}, {job.property?.postcode}
                              </div>
                              {(job as any).created_by_name && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Created by: <span className="font-medium">{(job as any).created_by_name}</span>
                                </p>
                              )}
                              {payout > 0 && (
                                <div className="flex items-center gap-1 text-sm text-accent font-semibold mt-1">
                                  <PoundSterling className="w-3.5 h-3.5" />
                                  {payout.toFixed(0)} payout
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upcoming Jobs */}
              {upcomingJobs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Upcoming ({upcomingJobs.length})
                  </h3>
                  <div className="space-y-3">
                    {upcomingJobs.map((job) => {
                      const payout = (job as any).clerk_final_payout || (job as any).clerk_payout || 0;
                      const propType = job.property?.property_type ? PROPERTY_TYPE_LABELS[job.property.property_type as PropertyType] : null;
                      const furnished = (job.property as any)?.furnished_status ? FURNISHED_STATUS_LABELS[(job.property as any).furnished_status as FurnishedStatus] : null;
                      return (
                      <Card 
                        key={job.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={cn("text-xs font-medium", getDateColor(job.scheduled_date))}>
                                  {getDateLabel(job.scheduled_date)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {INSPECTION_TYPE_LABELS[job.inspection_type as keyof typeof INSPECTION_TYPE_LABELS]}
                                </Badge>
                                <TierBadge tier={(job as any).service_tier} size="sm" />
                                {propType && <Badge variant="secondary" className="text-[10px]">{propType}</Badge>}
                                {furnished && <Badge variant="secondary" className="text-[10px]">{furnished}</Badge>}
                              </div>
                              <h4 className="font-medium text-foreground mb-1">
                                {job.property?.address_line_1 || "Address pending"}
                                {job.property?.address_line_2 && `, ${job.property.address_line_2}`}
                              </h4>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>
                                  {job.property?.city || "City"}, {job.property?.postcode || "Postcode"}
                                </span>
                              </div>
                              {(job as any).created_by_name && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  Created by: <span className="font-medium">{(job as any).created_by_name}</span>
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(job.scheduled_date), "EEE, d MMM yyyy")}
                                </div>
                                {job.preferred_time_slot && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {job.preferred_time_slot === "morning" && "9:00 - 12:00"}
                                    {job.preferred_time_slot === "afternoon" && "12:00 - 17:00"}
                                    {job.preferred_time_slot === "evening" && "17:00 - 20:00"}
                                  </div>
                                )}
                                {payout > 0 && (
                                  <div className="flex items-center gap-1 text-accent font-semibold">
                                    <PoundSterling className="w-3 h-3" />
                                    {payout.toFixed(0)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClerkJobsList;
