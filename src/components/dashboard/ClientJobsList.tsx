import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "@/hooks/useJobs";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TierBadge from "@/components/ui/tier-badge";
import AcknowledgementDialog from "@/components/dashboard/AcknowledgementDialog";
import {
  INSPECTION_TYPE_LABELS,
  JOB_STATUS_LABELS,
  JobStatus,
} from "@/types/database";
import { format, parseISO } from "date-fns";
import {
  ClipboardList,
  Loader2,
  Plus,
  Shield,
  FileCheck,
  PoundSterling,
} from "lucide-react";

const STATUS_STYLES: Partial<Record<JobStatus, string>> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-warning/10 text-warning",
  published: "bg-primary/10 text-primary",
  accepted: "bg-accent/10 text-accent",
  assigned: "bg-accent/10 text-accent",
  in_progress: "bg-warning/10 text-warning",
  submitted: "bg-success/10 text-success",
  reviewed: "bg-success/10 text-success",
  signed: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  paid: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
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

  const [ackDialogOpen, setAckDialogOpen] = useState(false);
  const [ackData, setAckData] = useState<AckDialogData | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  // Filter logic
  const filtered = jobs.filter((j) => {
    if (statusFilter === "active") return ["published", "accepted", "assigned", "in_progress"].includes(j.status);
    if (statusFilter === "review") return ["submitted", "reviewed"].includes(j.status);
    if (statusFilter === "completed") return ["signed", "completed", "paid"].includes(j.status);
    if (statusFilter === "cancelled") return j.status === "cancelled";
    return true;
  }).filter((j) => {
    if (dateFrom && j.scheduled_date < dateFrom) return false;
    if (dateTo && j.scheduled_date > dateTo) return false;
    return true;
  });

  if (jobsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-foreground mb-2">No Jobs Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Book your first inventory inspection to get started.</p>
          <Button onClick={() => navigate("/book")} className="gap-2">
            <Plus className="w-4 h-4" />
            Book Inventory
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Filters — matching clerk portal */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="review">Pending Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
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

      {/* Job list — clerk portal row style */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No jobs found
            </CardContent>
          </Card>
        ) : (
          filtered.map((job) => {
            const property = propertyMap[job.property_id];
            const needsPreAck = ["published", "accepted", "assigned"].includes(job.status) && !(job as any).client_pre_inspection_ack;
            const needsReportAcceptance = job.status === "submitted" && !(job as any).client_report_accepted;

            return (
              <Card
                key={job.id}
                className="hover:shadow-sm cursor-pointer transition-shadow"
                onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {property?.address_line_1 || "Address pending"}
                      {property?.postcode ? `, ${property.postcode}` : ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {INSPECTION_TYPE_LABELS[job.inspection_type]} · {format(parseISO(job.scheduled_date), "d MMM yyyy")}
                      {job.preferred_time_slot ? ` · ${job.preferred_time_slot}` : ""}
                    </p>
                    {/* Action buttons inline */}
                    {(needsPreAck || needsReportAcceptance) && property && (
                      <div className="flex gap-2 mt-2">
                        {needsPreAck && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[11px] h-7 px-2 gap-1"
                            onClick={(e) => { e.stopPropagation(); openAckDialog(job, "pre_inspection"); }}
                          >
                            <Shield className="w-3 h-3" />
                            Confirm
                          </Button>
                        )}
                        {needsReportAcceptance && (
                          <Button
                            size="sm"
                            className="text-[11px] h-7 px-2 gap-1"
                            onClick={(e) => { e.stopPropagation(); openAckDialog(job, "report_acceptance"); }}
                          >
                            <FileCheck className="w-3 h-3" />
                            Accept Report
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(job.quoted_price || job.final_price) && (
                      <span className="text-sm font-semibold text-foreground">
                        £{(job.final_price || job.quoted_price)?.toFixed(0)}
                      </span>
                    )}
                    <TierBadge tier={(job as any).service_tier} size="sm" />
                    <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[job.status] || ""}`}>
                      {JOB_STATUS_LABELS[job.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })
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
