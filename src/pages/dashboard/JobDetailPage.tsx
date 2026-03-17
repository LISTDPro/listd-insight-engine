import { useParams, useNavigate } from "react-router-dom";
import { useJobDetail } from "@/hooks/useJobDetail";
import { useAuth } from "@/hooks/useAuth";
import { useClerkJobs } from "@/hooks/useClerkJobs";
import AdminPayoutControls from "@/components/admin/AdminPayoutControls";
import AdminSurchargeOverride from "@/components/admin/AdminSurchargeOverride";
import CancellationFeeCard from "@/components/admin/CancellationFeeCard";
import ClerkJobDetailPanel from "@/components/dashboard/ClerkJobDetailPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import TierBadge from "@/components/ui/tier-badge";
import JobTimeline from "@/components/dashboard/JobTimeline";
import AcknowledgementDialog from "@/components/dashboard/AcknowledgementDialog";
import JobMessaging from "@/components/dashboard/JobMessaging";
import { 
  INSPECTION_TYPE_LABELS, 
  JOB_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  PropertyType,
  JobStatus
} from "@/types/database";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import RescheduleRequestDialog from "@/components/dashboard/RescheduleRequestDialog";
import { useProperties } from "@/hooks/useProperties";
import PropertyForm, { PropertyFormData } from "@/components/booking/PropertyForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Home, 
  BedDouble, 
  Bath,
  User,
  Building,
  FileText,
  Shield,
  FileCheck,
  AlertCircle,
  PoundSterling,
  Layers,
  Check,
  X,
  Loader2,
  ClipboardCheck,
  CheckCircle2,
  ShieldCheck,
  Pencil,
  ClipboardList
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

const JobDetailPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { role, profile } = useAuth();
  const { job, timeline, loading, error, refetch } = useJobDetail(jobId);
  const { acceptJob, declineJob } = useClerkJobs();
  
  const [ackDialogOpen, setAckDialogOpen] = useState(false);
  const [ackType, setAckType] = useState<"pre_inspection" | "report_acceptance">("pre_inspection");
  const [accepting, setAccepting] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [tenantDetails, setTenantDetails] = useState<any[]>([]);
  const [editPropertyOpen, setEditPropertyOpen] = useState(false);
  const [editPropertyLoading, setEditPropertyLoading] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [reportLinkInput, setReportLinkInput] = useState("");
  const [savingReportLink, setSavingReportLink] = useState(false);
  const { updateProperty } = useProperties();
  // Fetch tenant details for this job
  useEffect(() => {
    if (!jobId) return;
    supabase
      .from("tenant_details")
      .select("*")
      .eq("job_id", jobId)
      .order("tenant_order", { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error("Failed to fetch tenant details:", error);
        if (data) setTenantDetails(data);
      });
  }, [jobId]);

  // Reschedule eligibility: client only, not completed/cancelled/in_progress+
  const canRequestReschedule = role === "client" && 
    job && ['published', 'accepted', 'assigned'].includes(job.status) &&
    !(job as any).reschedule_status;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-4">{error || "This job doesn't exist or you don't have access."}</p>
          <Button onClick={() => navigate("/dashboard/jobs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  const needsPreAck = role === "client" && 
    ['published', 'accepted', 'assigned'].includes(job.status) && 
    !job.client_pre_inspection_ack;
    
  const needsReportAcceptance = role === "client" && 
    job.status === 'submitted' && 
    !job.client_report_accepted;

  const openAckDialog = (type: "pre_inspection" | "report_acceptance") => {
    setAckType(type);
    setAckDialogOpen(true);
  };

  const isClerkAvailableJob = role === "clerk" && job.status === "published" && !job.clerk_id;
  const isClerkAcceptedJob = role === "clerk" && 
    ["accepted", "assigned"].includes(job.status) && 
    job.clerk_id === profile?.user_id;
  const isClerkInProgressJob = role === "clerk" && 
    job.status === "in_progress" && 
    job.clerk_id === profile?.user_id;

  // Clerk can mark as completed when job is "submitted" and report has been uploaded
  const isClerkSubmittedJob = role === "clerk" &&
    job.status === "submitted" &&
    job.clerk_id === profile?.user_id;

  // Clerk can complete from accepted/assigned/in_progress via CompleteJobDialog
  const canClerkComplete = role === "clerk" &&
    ["accepted", "assigned", "in_progress"].includes(job.status) &&
    job.clerk_id === profile?.user_id;

  // Overdue check
  const isOverdue = job && !["completed", "cancelled", "paid", "signed"].includes(job.status) &&
    isPast(parseISO(job.scheduled_date + "T23:59:59"));

  // InventoryBase
  const inventorybaseJobId = (job as any).inventorybase_job_id;
  const reportUrl = (job as any).report_url;

  const handleSaveReportLink = async () => {
    if (!reportLinkInput.trim()) return;
    setSavingReportLink(true);
    const { error } = await supabase
      .from("jobs")
      .update({ report_url: reportLinkInput.trim() } as any)
      .eq("id", job.id);
    setSavingReportLink(false);
    if (error) {
      toast.error("Failed to save report link");
    } else {
      toast.success("Report link saved");
      setReportLinkInput("");
      refetch();
    }
  };



  const handleMarkCompleted = async () => {
    if (!job) return;

    // Validate: report must exist
    const hasReport = !!(job as any).report_url;
    if (!hasReport) {
      // Also check inspection_reports table
      const { data: reports } = await supabase
        .from("inspection_reports")
        .select("id")
        .eq("job_id", job.id)
        .limit(1);
      
      if (!reports || reports.length === 0) {
        toast.error("Cannot mark as completed — no report has been uploaded for this job.");
        return;
      }
    }

    // Validate: required fields
    if (!job.scheduled_date || !job.property_id) {
      toast.error("Cannot mark as completed — required job fields are missing.");
      return;
    }

    setMarkingComplete(true);

    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        status: "completed" as any,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", job.id);

    if (updateError) {
      setMarkingComplete(false);
      toast.error("Failed to mark job as completed");
      return;
    }

    // Trigger completion email to client (fire-and-forget)
    supabase.functions.invoke("notify-job-completed", {
      body: { jobId: job.id },
    }).then(({ error: notifyError }) => {
      if (notifyError) {
        console.error("Failed to send completion notification:", notifyError);
      }
    });

    // Create in-app notification for client
    await supabase.from("notifications").insert({
      user_id: job.client_id,
      type: "job",
      title: "Inspection Completed",
      message: `Your inspection at ${job.property?.address_line_1 || "your property"} has been completed.`,
      link: `/dashboard/jobs/${job.id}`,
    });

    setMarkingComplete(false);
    toast.success("Job marked as completed — client has been notified");
    refetch();
  };

  const handleAcceptJob = async () => {
    setAccepting(true);
    const { error } = await acceptJob(job.id);
    setAccepting(false);
    if (error) {
      toast.error("Failed to accept job");
    } else {
      toast.success("Job accepted! It's now in your active jobs.");
      refetch();
    }
  };

  const handleDeclineJob = () => {
    declineJob(job.id);
    toast.info("Job declined");
    navigate("/dashboard/jobs");
  };


  // Inspection is handled via InventoryBase — no in-app inspection flow

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/dashboard/jobs")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">
                {job.property?.address_line_1 || "Job Details"}
              </h1>
              <Badge 
                variant="outline" 
                className={STATUS_STYLES[job.status as JobStatus] || ""}
              >
                {JOB_STATUS_LABELS[job.status as JobStatus]}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-2 flex-wrap">
              {INSPECTION_TYPE_LABELS[job.inspection_type as keyof typeof INSPECTION_TYPE_LABELS]} • 
              Created {format(new Date(job.created_at), "MMM d, yyyy")}
              {(job as any).creator_name && (
                <span className="text-xs">• Created by: {(job as any).creator_name}</span>
              )}
              <TierBadge tier={job.service_tier} />
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {(needsPreAck || needsReportAcceptance || isClerkAvailableJob || isClerkAcceptedJob || isClerkInProgressJob || isClerkSubmittedJob || canRequestReschedule || (job as any).reschedule_status === "pending") && (
          <div className="flex gap-2">
            {isClerkAvailableJob && (
              <>
                <Button 
                  variant="outline" 
                  className="gap-1 text-destructive hover:text-destructive"
                  onClick={handleDeclineJob}
                >
                  <X className="w-4 h-4" />
                  Decline
                </Button>
                <Button 
                  variant="accent" 
                  className="gap-1"
                  onClick={handleAcceptJob}
                  disabled={accepting}
                >
                  {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Accept Job
                </Button>
              </>
            )}
            {isClerkAcceptedJob && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success" />
                Accepted — awaiting InventoryBase assignment
              </div>
            )}
            {isClerkInProgressJob && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                In progress via InventoryBase
              </div>
            )}
            {isClerkSubmittedJob && (
              <Button
                variant="success"
                className="gap-1"
                onClick={handleMarkCompleted}
                disabled={markingComplete}
              >
                {markingComplete ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Mark as Completed
              </Button>
            )}
            {needsPreAck && (
              <Button onClick={() => openAckDialog("pre_inspection")} className="gap-2">
                <Shield className="w-4 h-4" />
                Confirm Details
              </Button>
            )}
            {needsReportAcceptance && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/dashboard/reports/${job.id}`)}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Report
                </Button>
                <Button onClick={() => openAckDialog("report_acceptance")} className="gap-2">
                  <FileCheck className="w-4 h-4" />
                  Accept Report
                </Button>
              </>
            )}
            {!needsReportAcceptance && job.client_report_accepted && (
              <Button
                variant="outline"
                onClick={() => navigate(`/dashboard/reports/${job.id}`)}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                View Report
              </Button>
            )}
            {canRequestReschedule && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setRescheduleOpen(true)}
              >
                <Calendar className="w-4 h-4" />
                Request Reschedule
              </Button>
            )}
            {(job as any).reschedule_status === "pending" && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                Reschedule Pending
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Property & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Card — show client price to clients/admins, payout to clerks */}
          {(job.quoted_price || job.final_price) && role !== "clerk" && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <PoundSterling className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {job.final_price ? "Final Price" : "Quoted Price"}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        £{(job.final_price || job.quoted_price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={STATUS_STYLES[job.status as JobStatus] || ""}>
                    {JOB_STATUS_LABELS[job.status as JobStatus]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Clerk sees only their payout */}
          {role === "clerk" && ((job as any).clerk_payout > 0 || (job as any).clerk_final_payout > 0) && (
            <Card className="border-accent/30 bg-accent/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <PoundSterling className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Your Payout</p>
                      <p className="text-2xl font-bold text-accent">
                        £{((job as any).clerk_final_payout || (job as any).clerk_payout || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={STATUS_STYLES[job.status as JobStatus] || ""}>
                    {JOB_STATUS_LABELS[job.status as JobStatus]}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clerk Job Detail Panel — scoped view for clerks only */}
          {role === "clerk" && (
            <ClerkJobDetailPanel job={job as any} tenantDetails={tenantDetails} />
          )}

          {/* Clerk Action Card — prominent status/action for clerks */}
          {role === "clerk" && job.clerk_id === profile?.user_id && (
            <Card className={
              isClerkSubmittedJob
                ? "border-success/40 bg-success/5"
                : "border-border bg-muted/30"
            }>
              <CardContent className="p-5">
                {isClerkSubmittedJob ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Report Submitted</p>
                        <p className="text-sm text-muted-foreground">Mark this job as completed to notify the client.</p>
                      </div>
                    </div>
                    <Button
                      variant="success"
                      className="gap-1.5 w-full sm:w-auto"
                      onClick={handleMarkCompleted}
                      disabled={markingComplete}
                    >
                      {markingComplete ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Mark as Completed
                    </Button>
                  </div>
                ) : isClerkInProgressJob ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <ClipboardCheck className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Inspection In Progress</p>
                      <p className="text-sm text-muted-foreground">Once the report is submitted via InventoryBase, you'll be able to mark this job as completed here.</p>
                    </div>
                  </div>
                ) : isClerkAcceptedJob ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Awaiting Inspection Start</p>
                      <p className="text-sm text-muted-foreground">This job has been accepted. The inspection will begin once assigned in InventoryBase.</p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Condition Report buttons for clerks on their jobs */}
          {role === "clerk" && job.clerk_id === profile?.user_id && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => navigate(`/inspection/${job.id}/mapper`)}
              >
                <ClipboardList className="w-4 h-4" />
                Condition Mapper
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => navigate(`/inspection/${job.id}/report`)}
              >
                <FileText className="w-4 h-4" />
                View Report
              </Button>
            </div>
          )}

          {/* Property Card — for clients and admins */}
          {role !== "clerk" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Property Details
                  </span>
                  {role === "client" && !["completed", "paid", "cancelled"].includes(job.status) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditPropertyOpen(true)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.property && (
                  <>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{job.property.address_line_1}</p>
                        {job.property.address_line_2 && (
                          <p className="text-muted-foreground">{job.property.address_line_2}</p>
                        )}
                        <p className="text-muted-foreground">
                          {job.property.city}, {job.property.postcode}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {PROPERTY_TYPE_LABELS[job.property.property_type as PropertyType]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BedDouble className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{job.property.bedrooms} Beds</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bath className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{job.property.bathrooms} Baths</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Schedule Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {format(new Date(job.scheduled_date), "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                {job.preferred_time_slot && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time Slot</p>
                      <p className="font-medium capitalize">{job.preferred_time_slot}</p>
                    </div>
                  </div>
                )}
              </div>

              {job.special_instructions && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Special Instructions</p>
                  <p className="text-sm">{job.special_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Team Card */}
          {(job.provider_id || job.clerk_id) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Assigned Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Provider role reserved for future SaaS expansion. Not active in Phase 1. */}
                {job.clerk_profile && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">{job.clerk_profile.full_name || "Clerk"}</p>
                      <p className="text-sm text-muted-foreground">Inventory Clerk</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Admin: Tier Acknowledgement timestamp */}
          {role === "admin" && (job as any).tier_acknowledged_at && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Tier Acknowledged by Client</p>
                    <p className="text-xs text-muted-foreground">
                      Client confirmed understanding of the <strong>{(job as any).service_tier}</strong> tier scope on{" "}
                      {format(new Date((job as any).tier_acknowledged_at), "d MMM yyyy 'at' HH:mm")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin: Cancellation Fee Card — shown for cancelled jobs or active jobs */}
          {role === "admin" && (job.status === "cancelled" || ["pending", "published", "accepted", "assigned", "in_progress"].includes(job.status)) && (
            <CancellationFeeCard
              jobId={job.id}
              scheduledDate={job.scheduled_date}
              quotedPrice={job.final_price || job.quoted_price || 0}
              currentCancellationFee={(job as any).cancellation_fee || 0}
              status={job.status}
              cancelledAt={(job as any).cancelled_at}
              onUpdate={refetch}
            />
          )}

          {/* Admin: Surcharge Override */}
          {role === "admin" && (
            <AdminSurchargeOverride
              jobId={job.id}
              shortNoticeSurchargeApplied={(job as any).short_notice_surcharge_applied || false}
              quotedPrice={job.final_price || job.quoted_price || 0}
              clerkPayout={(job as any).clerk_final_payout || (job as any).clerk_payout || 0}
              onUpdate={refetch}
            />
          )}

          {/* Admin Payout Controls */}
          {role === "admin" && (
            <AdminPayoutControls
              jobId={job.id}
              clerkPayout={(job as any).clerk_payout || 0}
              clerkBonus={(job as any).clerk_bonus || 0}
              clerkFinalPayout={(job as any).clerk_final_payout || 0}
              clerkPayoutLocked={(job as any).clerk_payout_locked || false}
              status={job.status}
              quotedPrice={job.final_price || job.quoted_price || 0}
              margin={(job as any).margin || 0}
              onUpdate={refetch}
            />
          )}

          {/* Tenant Details Card */}
          {tenantDetails.length > 0 && (role === "client" || role === "admin" || role === "clerk") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Tenant Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tenantDetails.map((t: any) => (
                  <div key={t.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t.full_name || "—"}
                        {t.tenant_order === 2 && <span className="text-xs text-muted-foreground ml-1">(Second Tenant)</span>}
                      </p>
                      {t.email && <p className="text-xs text-muted-foreground">{t.email}</p>}
                      {t.phone && <p className="text-xs text-muted-foreground">{t.phone}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {/* Empty tenant state for clerks on check-in jobs */}
          {tenantDetails.length === 0 && role === "clerk" && job.inspection_type === "check_in" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Tenant Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No tenant details provided yet.</p>
              </CardContent>
            </Card>
          )}

          {/* Reschedule Status Card (admin) */}
          {role === "admin" && (job as any).reschedule_status === "pending" && (
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <Calendar className="w-5 h-5" />
                  Reschedule Request Pending
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="text-muted-foreground">Requested new date:</p>
                  <p className="font-medium text-foreground">
                    {(job as any).reschedule_requested_date && format(new Date((job as any).reschedule_requested_date), "EEEE, d MMMM yyyy")}
                    {(job as any).reschedule_requested_time_slot && ` · ${(job as any).reschedule_requested_time_slot}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-success text-success-foreground hover:bg-success/90 gap-1"
                    onClick={async () => {
                      const { error } = await supabase
                        .from("jobs")
                        .update({
                          scheduled_date: (job as any).reschedule_requested_date,
                          preferred_time_slot: (job as any).reschedule_requested_time_slot,
                          reschedule_status: "approved",
                          reschedule_resolved_at: new Date().toISOString(),
                        } as any)
                        .eq("id", job.id);
                      if (!error) {
                        await supabase.from("notifications").insert({
                          user_id: job.client_id,
                          type: "job",
                          title: "Reschedule Approved",
                          message: `Your reschedule request has been approved. New date: ${(job as any).reschedule_requested_date}`,
                          link: `/dashboard/jobs/${job.id}`,
                        });
                        if (job.clerk_id) {
                          await supabase.from("notifications").insert({
                            user_id: job.clerk_id,
                            type: "job",
                            title: "Job Rescheduled",
                            message: `A job has been rescheduled to ${(job as any).reschedule_requested_date}`,
                            link: `/dashboard/jobs/${job.id}`,
                          });
                        }
                        toast.success("Reschedule approved");
                        refetch();
                      } else {
                        toast.error("Failed to approve reschedule");
                      }
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30 gap-1"
                    onClick={async () => {
                      const { error } = await supabase
                        .from("jobs")
                        .update({
                          reschedule_status: "rejected",
                          reschedule_resolved_at: new Date().toISOString(),
                        } as any)
                        .eq("id", job.id);
                      if (!error) {
                        await supabase.from("notifications").insert({
                          user_id: job.client_id,
                          type: "job",
                          title: "Reschedule Declined",
                          message: "Your reschedule request has been declined. The original date remains unchanged.",
                          link: `/dashboard/jobs/${job.id}`,
                        });
                        toast.success("Reschedule rejected");
                        refetch();
                      } else {
                        toast.error("Failed to reject reschedule");
                      }
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Timeline + Messaging */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <JobTimeline events={timeline} />
            </CardContent>
          </Card>

          {/* In-app messaging */}
          {job.clerk_id && role === "client" && (
            <JobMessaging
              jobId={job.id}
              otherUserId={job.clerk_id}
              otherUserName={job.clerk_profile?.full_name || "Clerk"}
            />
          )}
          {job.client_id && role === "clerk" && (
            <JobMessaging
              jobId={job.id}
              otherUserId={job.client_id}
              otherUserName="Client"
            />
          )}
        </div>
      </div>

      {/* Acknowledgement Dialog */}
      {job.property && (
        <AcknowledgementDialog
          open={ackDialogOpen}
          onOpenChange={setAckDialogOpen}
          jobId={job.id}
          type={ackType}
          propertyAddress={job.property.address_line_1}
          city={job.property.city}
          postcode={job.property.postcode}
          inspectionType={job.inspection_type}
          scheduledDate={job.scheduled_date}
          clientName={profile?.full_name || undefined}
          onSuccess={refetch}
        />
      )}

      {/* Reschedule Dialog */}
      <RescheduleRequestDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        jobId={job.id}
        currentDate={job.scheduled_date}
        currentTimeSlot={job.preferred_time_slot}
        onSuccess={refetch}
      />

      {/* Edit Property Dialog */}
      {job.property && (
        <Dialog open={editPropertyOpen} onOpenChange={setEditPropertyOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Property Details</DialogTitle>
            </DialogHeader>
            <PropertyForm
              initialData={{
                address_line_1: job.property.address_line_1,
                address_line_2: job.property.address_line_2 || "",
                city: job.property.city,
                postcode: job.property.postcode,
                property_type: job.property.property_type as any,
                bedrooms: job.property.bedrooms,
                bathrooms: job.property.bathrooms,
                kitchens: (job.property as any).kitchens ?? 1,
                living_rooms: (job.property as any).living_rooms ?? 1,
                dining_areas: (job.property as any).dining_areas ?? 0,
                utility_rooms: (job.property as any).utility_rooms ?? 0,
                storage_rooms: (job.property as any).storage_rooms ?? 0,
                hallways_stairs: (job.property as any).hallways_stairs ?? 0,
                gardens: (job.property as any).gardens ?? 0,
                communal_areas: (job.property as any).communal_areas ?? 0,
                furnished_status: (job.property as any).furnished_status ?? "unfurnished",
                heavily_furnished: (job.property as any).heavily_furnished ?? false,
                notes: (job.property as any).notes ?? "",
              }}
              onSubmit={async (data: PropertyFormData) => {
                setEditPropertyLoading(true);
                const { error } = await updateProperty(job.property_id, data);
                setEditPropertyLoading(false);
                if (error) {
                  toast.error("Failed to update property");
                } else {
                  toast.success("Property details updated");
                  setEditPropertyOpen(false);
                  refetch();
                }
              }}
              onCancel={() => setEditPropertyOpen(false)}
              isLoading={editPropertyLoading}
              submitLabel="Save Changes"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default JobDetailPage;
