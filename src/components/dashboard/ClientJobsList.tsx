import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "@/hooks/useJobs";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TierBadge from "@/components/ui/tier-badge";
import AcknowledgementDialog from "@/components/dashboard/AcknowledgementDialog";
import SwipeableCardStack from "@/components/dashboard/SwipeableCardStack";
import SwipeJobCardContent from "@/components/dashboard/SwipeJobCardContent";
import { 
  INSPECTION_TYPE_LABELS, 
  JOB_STATUS_LABELS, 
  JobStatus,
  Job
} from "@/types/database";
import { format } from "date-fns";
import { 
  MapPin, 
  Calendar, 
  ClipboardList, 
  ChevronRight,
  Loader2,
  Clock,
  Plus,
  Shield,
  FileCheck,
  PoundSterling,
  Eye,
  Layers
} from "lucide-react";

const STATUS_STYLES: Partial<Record<JobStatus, string>> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning border-warning/30",
  published: "bg-primary/10 text-primary border-primary/30",
  accepted: "bg-accent/10 text-accent border-accent/30",
  assigned: "bg-accent/10 text-accent border-accent/30",
  in_progress: "bg-warning/10 text-warning border-warning/30",
  submitted: "bg-success/10 text-success border-success/30",
  reviewed: "bg-success/10 text-success border-success/30",
  signed: "bg-success/10 text-success border-success/30",
  completed: "bg-success/10 text-success border-success/30",
  paid: "bg-success/10 text-success border-success/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

interface AckDialogData {
  jobId: string;
  type: "pre_inspection" | "report_acceptance";
  propertyAddress: string;
  city: string;
  postcode: string;
  inspectionType: string;
  scheduledDate: string;
}

const ClientJobsList = () => {
  const navigate = useNavigate();
  const { jobs, loading: jobsLoading, fetchJobs } = useJobs();
  const { properties } = useProperties();
  const { profile } = useAuth();
  
  // Acknowledgement dialog state
  const [ackDialogOpen, setAckDialogOpen] = useState(false);
  const [ackData, setAckData] = useState<AckDialogData | null>(null);

  // Create a lookup for properties
  const propertyMap = properties.reduce((acc, prop) => {
    acc[prop.id] = prop;
    return acc;
  }, {} as Record<string, typeof properties[0]>);

  const openAckDialog = (job: typeof jobs[0], type: "pre_inspection" | "report_acceptance") => {
    const property = propertyMap[job.property_id];
    setAckData({
      jobId: job.id,
      type,
      propertyAddress: property?.address_line_1 || "Property",
      city: property?.city || "",
      postcode: property?.postcode || "",
      inspectionType: job.inspection_type,
      scheduledDate: job.scheduled_date,
    });
    setAckDialogOpen(true);
  };

  if (jobsLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-foreground mb-2">No Jobs Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Book your first inventory inspection to get started.
          </p>
          <Button onClick={() => navigate("/book")} className="gap-2">
            <Plus className="w-4 h-4" />
            Book Inventory
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group jobs by status category
  const activeJobs = jobs.filter(j => 
    ['published', 'accepted', 'assigned', 'in_progress'].includes(j.status)
  );
  const pendingReviewJobs = jobs.filter(j => 
    ['submitted', 'reviewed'].includes(j.status)
  );
  const completedJobs = jobs.filter(j => 
    ['signed', 'completed', 'paid'].includes(j.status)
  );

  const renderJobCard = (job: typeof jobs[0]) => {
    const property = propertyMap[job.property_id];
    const needsPreAck = ['published', 'accepted', 'assigned'].includes(job.status) && 
                        !(job as any).client_pre_inspection_ack;
    const needsReportAcceptance = job.status === 'submitted' && 
                                   !(job as any).client_report_accepted;
    
    return (
      <Card 
        key={job.id}
        className="hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={STATUS_STYLES[job.status] || ""}
                >
                  {JOB_STATUS_LABELS[job.status]}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {INSPECTION_TYPE_LABELS[job.inspection_type]}
                </Badge>
                <TierBadge tier={(job as any).service_tier} size="sm" />
                {needsPreAck && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
                    Needs Confirmation
                  </Badge>
                )}
                {needsReportAcceptance && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                    Review Report
                  </Badge>
                )}
              </div>
              
              {property ? (
                <>
                  <h4 className="font-medium text-foreground truncate">
                    {property.address_line_1}
                  </h4>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    {property.city}, {property.postcode}
                  </div>
                  {/* Creator Badge */}
                  {(job as any).created_by_user_id && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Created by: {(job as any).creator_name || "You"}
                    </div>
                  )}
                </>
              ) : (
                <h4 className="font-medium text-foreground">Property Loading...</h4>
              )}
              
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(job.scheduled_date), "EEE, MMM d, yyyy")}
                </div>
                {job.preferred_time_slot && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {job.preferred_time_slot === "morning" && "Morning"}
                    {job.preferred_time_slot === "afternoon" && "Afternoon"}
                    {job.preferred_time_slot === "evening" && "Evening"}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {(needsPreAck || needsReportAcceptance) && property && (
                <div className="flex gap-2 mt-3">
                  {needsPreAck && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAckDialog(job, "pre_inspection");
                      }}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Confirm Details
                    </Button>
                  )}
                  {needsReportAcceptance && (
                    <Button 
                      size="sm" 
                      className="gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAckDialog(job, "report_acceptance");
                      }}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Accept Report
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Price & Arrow */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {(job.quoted_price || job.final_price) && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-primary">
                    <PoundSterling className="w-4 h-4" />
                    <span className="text-lg font-bold">
                      {(job.final_price || job.quoted_price)?.toFixed(0)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {job.final_price ? "Final" : "Quote"}
                  </span>
                </div>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Active Jobs</h3>
              <Badge variant="secondary">{activeJobs.length}</Badge>
            </div>
            <div className="space-y-3">
              {activeJobs.map(renderJobCard)}
            </div>
          </div>
        )}

        {/* Pending Review — Swipeable */}
        {pendingReviewJobs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Pending Review</h3>
              <Badge variant="secondary">{pendingReviewJobs.length}</Badge>
            </div>
            <SwipeableCardStack
              items={pendingReviewJobs.map((j) => ({ ...j, id: j.id }))}
              rightLabel="Review"
              leftLabel="Skip"
              rightIcon={<Eye className="w-5 h-5" />}
              leftIcon={<ChevronRight className="w-5 h-5" />}
              onSwipeRight={(job) => navigate(`/dashboard/jobs/${job.id}`)}
              onSwipeLeft={() => {}}
              renderCard={(job) => {
                const property = propertyMap[job.property_id];
                return (
                  <SwipeJobCardContent
                    job={{ ...job, property: property || null }}
                    statusBadge={
                      <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                        {JOB_STATUS_LABELS[job.status]}
                      </Badge>
                    }
                  />
                );
              }}
              emptyMessage={null}
            />
          </div>
        )}

        {/* Completed Jobs */}
        {completedJobs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Completed</h3>
              <Badge variant="secondary">{completedJobs.length}</Badge>
            </div>
            <div className="space-y-3">
              {completedJobs.slice(0, 5).map(renderJobCard)}
            </div>
          </div>
        )}
      </div>

      {/* Acknowledgement Dialog */}
      {ackData && (
        <AcknowledgementDialog
          open={ackDialogOpen}
          onOpenChange={setAckDialogOpen}
          jobId={ackData.jobId}
          type={ackData.type}
          propertyAddress={ackData.propertyAddress}
          city={ackData.city}
          postcode={ackData.postcode}
          inspectionType={ackData.inspectionType}
          scheduledDate={ackData.scheduledDate}
          clientName={profile?.full_name || undefined}
          onSuccess={fetchJobs}
        />
      )}
    </>
  );
};

export default ClientJobsList;
