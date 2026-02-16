import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReportReview } from "@/hooks/useReportReview";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import AcknowledgementDialog from "@/components/dashboard/AcknowledgementDialog";
import RatingDialog from "@/components/dashboard/RatingDialog";
import {
  INSPECTION_TYPE_LABELS,
  CONDITION_LABELS,
  CONDITION_GLOSSARY,
  CLEANLINESS_LABELS,
  CLEANLINESS_GLOSSARY,
  CleanlinessRating,
  ConditionRating,
  PROPERTY_TYPE_LABELS,
  PropertyType,
  FURNISHED_STATUS_LABELS,
  FurnishedStatus,
} from "@/types/database";
import { format } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Home,
  BedDouble,
  Bath,
  FileCheck,
  AlertCircle,
  Loader2,
  User,
  Gauge,
  Key,
  Flame,
  BookOpen,
  CheckCircle2,
  Download,
} from "lucide-react";
import { generateInspectionPDF, downloadReport } from "@/utils/generateReport";
import { toast } from "sonner";

const ReportReviewPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { role, profile } = useAuth();
  const { data, loading, error, refetch } = useReportReview(jobId);
  const [ackDialogOpen, setAckDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      const { report, job, rooms, items, photos } = data;
      const rawMR = report.meter_readings;
      const meterArray = rawMR && typeof rawMR === "object" && !Array.isArray(rawMR) && "meters" in (rawMR as any)
        ? (rawMR as any).meters || []
        : Array.isArray(rawMR) ? rawMR : [];
      const alarmsArr = rawMR && typeof rawMR === "object" && !Array.isArray(rawMR) && "alarms" in (rawMR as any)
        ? (rawMR as any).alarms || []
        : [];
      const keysArr = Array.isArray(report.keys_info) ? report.keys_info : [];

      const pdfJob = {
        id: job.id,
        inspection_type: job.inspection_type,
        scheduled_date: job.scheduled_date,
        special_instructions: job.special_instructions,
        properties: {
          ...job.property,
          kitchens: 1,
          living_rooms: 1,
          heavily_furnished: false,
        },
      };

      const doc = await generateInspectionPDF({
        job: pdfJob,
        report,
        rooms,
        items,
        photos,
        meterReadings: meterArray,
        keysInfo: keysArr,
        alarmsData: alarmsArr,
      });

      const address = job.property.address_line_1.replace(/[^a-zA-Z0-9]/g, "_");
      downloadReport(doc, `LISTD_Report_${address}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center py-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Report Not Found</h2>
        <p className="text-muted-foreground mb-4">{error || "Unable to load report."}</p>
        <Button onClick={() => navigate("/dashboard/jobs")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>
      </div>
    );
  }

  const { report, job, rooms, items, photos, clerkName } = data;
  const needsAcceptance = role === "client" && !job.client_report_accepted && report.submitted_at;

  const rawMeterReadings = report.meter_readings;
  const meterArray: any[] = rawMeterReadings && typeof rawMeterReadings === "object" && !Array.isArray(rawMeterReadings) && "meters" in (rawMeterReadings as any)
    ? (rawMeterReadings as any).meters || []
    : Array.isArray(rawMeterReadings) ? rawMeterReadings : [];
  const alarmsArray: any[] = rawMeterReadings && typeof rawMeterReadings === "object" && !Array.isArray(rawMeterReadings) && "alarms" in (rawMeterReadings as any)
    ? (rawMeterReadings as any).alarms || []
    : [];
  const rawKeysInfo = report.keys_info;
  const keysArray: any[] = Array.isArray(rawKeysInfo) ? rawKeysInfo : [];
  const hasMeterData = meterArray.length > 0;
  const hasKeysData = keysArray.length > 0;
  const hasAlarmsData = alarmsArray.length > 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto relative">
      {/* DRAFT watermark when report not yet accepted */}
      {!job.client_report_accepted && (
        <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center overflow-hidden">
          <span className="text-[120px] md:text-[180px] font-black text-destructive/10 rotate-[-30deg] select-none tracking-widest uppercase">
            DRAFT
          </span>
        </div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inspection Report</h1>
            <p className="text-muted-foreground">
              {INSPECTION_TYPE_LABELS[job.inspection_type as keyof typeof INSPECTION_TYPE_LABELS]} •{" "}
              {format(new Date(job.scheduled_date), "d MMMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {job.client_report_accepted && (
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={downloading} className="gap-2">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? "Generating…" : "Download PDF"}
            </Button>
          )}
          {job.client_report_accepted && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Accepted
            </Badge>
          )}
          {needsAcceptance && (
            <Button onClick={() => setAckDialogOpen(true)} className="gap-2">
              <FileCheck className="w-4 h-4" />
              Accept Report
            </Button>
          )}
        </div>
      </div>

      {/* Property & Report summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <Home className="w-4 h-4" /> Property
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{job.property.address_line_1}</p>
            {job.property.address_line_2 && (
              <p className="text-sm text-muted-foreground">{job.property.address_line_2}</p>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {job.property.city}, {job.property.postcode}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="secondary" className="text-xs">
                {PROPERTY_TYPE_LABELS[job.property.property_type as PropertyType]}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <BedDouble className="w-3 h-3 mr-1" />
                {job.property.bedrooms} Beds
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Bath className="w-3 h-3 mr-1" />
                {job.property.bathrooms} Baths
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {FURNISHED_STATUS_LABELS[job.property.furnished_status as FurnishedStatus]}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" /> Report Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {clerkName && (
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Inspector: <span className="font-medium">{clerkName}</span></span>
              </div>
            )}
            {report.started_at && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Started: {format(new Date(report.started_at), "d MMM yyyy, HH:mm")}</span>
              </div>
            )}
            {report.submitted_at && (
              <div className="flex items-center gap-2">
                <FileCheck className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Submitted: {format(new Date(report.submitted_at), "d MMM yyyy, HH:mm")}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Rooms:</span>
              <span className="font-medium">{rooms.length}</span>
              <span className="text-muted-foreground ml-2">Items:</span>
              <span className="font-medium">{items.length}</span>
              <span className="text-muted-foreground ml-2">Photos:</span>
              <span className="font-medium">{photos.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule of Condition Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="w-4 h-4" /> Schedule of Condition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left p-2 font-medium text-muted-foreground">Room</th>
                  <th className="text-center p-2 font-medium text-muted-foreground">Items</th>
                  <th className="text-center p-2 font-medium text-muted-foreground">Completed</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Overall</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, i) => {
                  const roomItems = items.filter((it) => it.room_id === room.id);
                  const completed = roomItems.filter((it) => it.completed).length;
                  const worstCondition = roomItems.reduce<ConditionRating | null>((worst, item) => {
                    if (!item.condition) return worst;
                    if (!worst) return item.condition;
                    const order: ConditionRating[] = ["excellent", "good", "fair", "poor", "damaged", "missing"];
                    return order.indexOf(item.condition) > order.indexOf(worst) ? item.condition : worst;
                  }, null);

                  return (
                    <tr key={room.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="p-2 font-medium">{room.room_name}</td>
                      <td className="p-2 text-center text-muted-foreground">{roomItems.length}</td>
                      <td className="p-2 text-center">
                        <span className={completed === roomItems.length && roomItems.length > 0 ? "text-success font-medium" : "text-muted-foreground"}>
                          {completed}/{roomItems.length}
                        </span>
                      </td>
                      <td className="p-2">
                        {worstCondition ? (
                          <Badge variant="outline" className="text-xs">
                            {CONDITION_LABELS[worstCondition]}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Meter Readings & Keys */}
      {(hasMeterData || hasKeysData || hasAlarmsData || report.smoke_alarms_checked || report.carbon_monoxide_checked) && (
        <div className="grid gap-4 md:grid-cols-2">
          {hasMeterData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gauge className="w-4 h-4" /> Meter Readings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {meterArray.map((meter: any, i: number) => (
                    <div key={meter.id || i} className="flex justify-between border-b border-border/50 pb-1 last:border-0">
                      <span className="text-muted-foreground capitalize">{meter.type}</span>
                      <div className="text-right">
                        <span className="font-medium">{meter.reading || "—"} {meter.unit || ""}</span>
                        {meter.serial_number && <p className="text-xs text-muted-foreground">S/N: {meter.serial_number}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(hasKeysData || hasAlarmsData || report.smoke_alarms_checked || report.carbon_monoxide_checked) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="w-4 h-4" /> Keys & Safety
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {keysArray.map((key: any, i: number) => (
                  <div key={key.id || i} className="flex justify-between">
                    <span className="text-muted-foreground">{key.type || `Key Set ${i + 1}`}</span>
                    <span className="font-medium">Qty: {key.quantity || 0}</span>
                  </div>
                ))}
                {alarmsArray.map((alarm: any, i: number) => (
                  <div key={alarm.id || i} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{alarm.type?.replace(/_/g, " ") || `Device ${i + 1}`}</span>
                    <Badge variant="outline" className="text-xs">
                      {alarm.tested === "yes" ? "Tested ✓" : alarm.tested === "no" ? "Failed ✗" : "Not Tested"}
                    </Badge>
                  </div>
                ))}
                {report.smoke_alarms_checked && (
                  <div className="flex items-center gap-2 text-success">
                    <Flame className="w-3.5 h-3.5" /> Smoke alarms checked
                  </div>
                )}
                {report.carbon_monoxide_checked && (
                  <div className="flex items-center gap-2 text-success">
                    <Flame className="w-3.5 h-3.5" /> CO alarms checked
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* General Notes */}
      {report.general_notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> General Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {report.general_notes || "No notes provided."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Room-by-room summary */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Room-by-Room Summary</h2>
        {rooms.map((room) => {
          const roomItems = items.filter((it) => it.room_id === room.id);
          const roomPhotos = photos.filter((p) => p.room_id === room.id);
          return (
            <Card key={room.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{room.room_name}</span>
                  {room.overall_condition && (
                    <Badge variant="outline" className="text-xs">
                      {CONDITION_LABELS[room.overall_condition as ConditionRating] || room.overall_condition}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{roomItems.length} items</span>
                  <span>{roomPhotos.length} photos</span>
                  <span>{roomItems.filter(i => i.completed).length} completed</span>
                </div>
                {roomItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30 border-b">
                          <th className="text-left p-2 font-medium">Item</th>
                          <th className="text-left p-2 font-medium">Condition</th>
                          <th className="text-left p-2 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomItems.map((item, idx) => (
                          <tr key={item.id} className={idx % 2 === 0 ? "" : "bg-muted/10"}>
                            <td className="p-2 font-medium">{item.item_name}</td>
                            <td className="p-2 text-muted-foreground">
                              {item.condition ? CONDITION_LABELS[item.condition as ConditionRating] : "—"}
                            </td>
                            <td className="p-2 text-muted-foreground">{item.condition_notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {room.notes && (
                  <p className="text-xs text-muted-foreground italic">{room.notes}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Client acceptance info */}
      {job.client_report_accepted && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Report Accepted</p>
                {job.client_report_accepted_at && (
                  <p className="text-sm text-muted-foreground">
                    Accepted on {format(new Date(job.client_report_accepted_at), "d MMM yyyy, HH:mm")}
                  </p>
                )}
                {job.client_report_comments && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="font-medium text-foreground">Comments:</span> {job.client_report_comments}
                  </p>
                )}
                {job.client_signature_url && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Client Signature</p>
                    <img
                      src={job.client_signature_url}
                      alt="Client signature"
                      className="h-16 border rounded bg-background p-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom accept bar for clients */}
      {needsAcceptance && (
        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t p-4 -mx-6 -mb-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Review the report above, then accept to finalize.
            </p>
            <Button onClick={() => setAckDialogOpen(true)} className="gap-2">
              <FileCheck className="w-4 h-4" />
              Accept Report
            </Button>
          </div>
        </div>
      )}

      {/* Acknowledgement Dialog */}
      <AcknowledgementDialog
        open={ackDialogOpen}
        onOpenChange={setAckDialogOpen}
        jobId={job.id}
        type="report_acceptance"
        propertyAddress={job.property.address_line_1}
        city={job.property.city}
        postcode={job.property.postcode}
        inspectionType={job.inspection_type}
        scheduledDate={job.scheduled_date}
        clientName={profile?.full_name || undefined}
        onSuccess={() => {
          refetch();
          // Prompt rating after acceptance
          setRatingDialogOpen(true);
        }}
      />

      {/* Rating Dialog — shows after report acceptance */}
      {data && data.report.clerk_id && (
        <RatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          jobId={job.id}
          clerkId={data.report.clerk_id}
          clerkName={clerkName || "the clerk"}
        />
      )}
    </div>
  );
};

export default ReportReviewPage;
