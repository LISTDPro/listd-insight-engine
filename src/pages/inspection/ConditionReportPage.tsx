import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useConditionMapper } from "@/hooks/useConditionMapper";
import { CONDITION_LABELS, type ItemCondition } from "@/utils/conditionMapperDefaults";
import { generateConditionReportPDF } from "@/utils/generateConditionReport";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft, Download, Send, Loader2, CheckCircle, AlertTriangle,
  Camera, FileText, Building, User, Calendar
} from "lucide-react";

import listdLogoDark from "@/assets/listd-logo-dark.png";

interface JobMeta {
  inspectionType?: string;
  scheduledDate?: string;
  clientId?: string;
  clientEmail?: string;
  property?: {
    address_line_1: string;
    address_line_2?: string | null;
    city: string;
    postcode: string;
  } | null;
  clerkName?: string;
}

const CONDITION_BADGE_STYLES: Record<ItemCondition, string> = {
  good: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  fair: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  poor: "bg-red-500/10 text-red-600 border-red-500/30",
  na: "bg-muted text-muted-foreground border-border",
};

const ConditionReportPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { rooms, items, photos, loading } = useConditionMapper(jobId);

  const [jobMeta, setJobMeta] = useState<JobMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [clerkSignName, setClerkSignName] = useState("");
  const [tenantSignName, setTenantSignName] = useState("");

  // Fetch job metadata
  useEffect(() => {
    if (!jobId) return;
    (async () => {
      setMetaLoading(true);
      const { data: job } = await supabase
        .from("jobs")
        .select("inspection_type, scheduled_date, property_id, clerk_id, client_id")
        .eq("id", jobId)
        .single();
      if (!job) { setMetaLoading(false); return; }

      const [propRes, clerkRes] = await Promise.all([
        supabase.from("properties").select("address_line_1, address_line_2, city, postcode").eq("id", job.property_id).single(),
        job.clerk_id ? supabase.from("profiles").select("full_name").eq("user_id", job.clerk_id).single() : Promise.resolve({ data: null }),
      ]);

      // Get client email from auth — we use profiles for name only
      let clientEmail: string | undefined;
      // We'll try to get it from the admin-list-users function or just leave it
      // For now we store it from the job's client_id profile
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", job.client_id)
        .single();

      setJobMeta({
        inspectionType: job.inspection_type,
        scheduledDate: job.scheduled_date,
        clientId: job.client_id,
        property: propRes.data,
        clerkName: clerkRes.data?.full_name || undefined,
      });

      if (clerkRes.data?.full_name) {
        setClerkSignName(clerkRes.data.full_name);
      }

      setMetaLoading(false);
    })();
  }, [jobId]);

  // Computed summaries
  const flaggedItems = useMemo(() => {
    return items.filter(i => i.condition === "fair" || i.condition === "poor");
  }, [items]);

  const summary = useMemo(() => {
    const total = items.length;
    const good = items.filter(i => i.condition === "good").length;
    const fair = items.filter(i => i.condition === "fair").length;
    const poor = items.filter(i => i.condition === "poor").length;
    const na = items.filter(i => i.condition === "na").length;
    return { total, good, fair, poor, na };
  }, [items]);

  const handleDownloadPDF = async () => {
    if (!jobId || rooms.length === 0) {
      toast.error("No data to generate report");
      return;
    }
    setGenerating(true);
    try {
      const doc = await generateConditionReportPDF({
        jobId,
        inspectionType: jobMeta?.inspectionType,
        scheduledDate: jobMeta?.scheduledDate,
        property: jobMeta?.property,
        rooms, items, photos,
        clerkName: jobMeta?.clerkName,
      });
      const addr = jobMeta?.property?.address_line_1?.replace(/[^a-zA-Z0-9]/g, "_") || "property";
      doc.save(`LISTD_Condition_Report_${addr}.pdf`);

      // Record in generated_reports
      await supabase.from("generated_reports" as any).insert({
        job_id: jobId,
        generated_by: profile?.user_id,
      } as any);

      toast.success("Report downloaded");
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReport = async () => {
    if (!jobId || !jobMeta?.clientId) {
      toast.error("No client associated with this job");
      return;
    }
    setSending(true);
    try {
      // Generate PDF blob
      const doc = await generateConditionReportPDF({
        jobId,
        inspectionType: jobMeta?.inspectionType,
        scheduledDate: jobMeta?.scheduledDate,
        property: jobMeta?.property,
        rooms, items, photos,
        clerkName: jobMeta?.clerkName,
      });

      const pdfBlob = doc.output("blob");
      const addr = jobMeta?.property?.address_line_1?.replace(/[^a-zA-Z0-9]/g, "_") || "property";
      const fileName = `LISTD_Condition_Report_${addr}_${Date.now()}.pdf`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("condition-photos")
        .upload(`reports/${jobId}/${fileName}`, pdfBlob, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("condition-photos").getPublicUrl(`reports/${jobId}/${fileName}`);

      // Record
      await supabase.from("generated_reports" as any).insert({
        job_id: jobId,
        generated_by: profile?.user_id,
        report_url: urlData.publicUrl,
        sent_at: new Date().toISOString(),
      } as any);

      // Update job report_url
      await supabase.from("jobs").update({ report_url: urlData.publicUrl } as any).eq("id", jobId);

      toast.success("Report saved and linked to job");
    } catch (err) {
      console.error("Send report failed", err);
      toast.error("Failed to send report");
    } finally {
      setSending(false);
    }
  };

  const typeLabel = jobMeta?.inspectionType
    ? jobMeta.inspectionType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : "Condition Report";

  const dateStr = jobMeta?.scheduledDate
    ? format(new Date(jobMeta.scheduledDate), "dd MMMM yyyy")
    : format(new Date(), "dd MMMM yyyy");

  if (loading || metaLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 md:px-8 py-3">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/inspection/${jobId}/mapper`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Report Preview</h1>
              <p className="text-sm text-muted-foreground">{rooms.length} rooms · {items.length} items</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleDownloadPDF}
              disabled={generating || rooms.length === 0}
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleSendReport}
              disabled={sending || rooms.length === 0}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline">Send Report</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Report preview content */}
      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {/* Cover / Header Card */}
        <Card className="overflow-hidden">
          <div className="bg-[hsl(var(--primary))] text-primary-foreground p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <img src={listdLogoDark} alt="LISTD" className="h-8 mb-4 brightness-0 invert" />
                <h2 className="text-xl md:text-2xl font-bold">{typeLabel} — Condition Report</h2>
                <p className="text-primary-foreground/70 mt-1">{dateStr}</p>
              </div>
              {jobMeta?.property && (
                <div className="text-right hidden md:block">
                  <p className="font-semibold">{jobMeta.property.address_line_1}</p>
                  <p className="text-sm text-primary-foreground/70">
                    {[jobMeta.property.address_line_2, jobMeta.property.city, jobMeta.property.postcode].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Meta row */}
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {jobMeta?.property && (
                <div className="flex items-start gap-2">
                  <Building className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Property</p>
                    <p className="text-sm font-medium">{jobMeta.property.address_line_1}</p>
                    <p className="text-xs text-muted-foreground">
                      {jobMeta.property.city}, {jobMeta.property.postcode}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">{dateStr}</p>
                </div>
              </div>
              {jobMeta?.clerkName && (
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Inspector</p>
                    <p className="text-sm font-medium">{jobMeta.clerkName}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Reference</p>
                  <p className="text-sm font-medium font-mono">{jobId?.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{summary.total}</p>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{summary.good}</p>
              <p className="text-xs text-muted-foreground">Good</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{summary.fair}</p>
              <p className="text-xs text-muted-foreground">Fair</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{summary.poor}</p>
              <p className="text-xs text-muted-foreground">Poor</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{summary.na}</p>
              <p className="text-xs text-muted-foreground">N/A</p>
            </CardContent>
          </Card>
        </div>

        {/* Room-by-room sections */}
        {rooms.map((room) => {
          const roomItems = items.filter(i => i.room_id === room.id);
          const roomPhotos = photos.filter(p => roomItems.some(i => i.id === p.item_id));

          return (
            <Card key={room.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="w-1 h-6 rounded-full bg-accent" />
                  {room.room_name}
                  <Badge variant="outline" className="ml-auto text-xs">
                    {roomItems.length} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {roomItems.map((item) => {
                  const itemPhotos = photos.filter(p => p.item_id === item.id);
                  return (
                    <div key={item.id} className="border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm text-foreground">{item.item_name}</span>
                        <Badge variant="outline" className={CONDITION_BADGE_STYLES[item.condition]}>
                          {CONDITION_LABELS[item.condition]}
                        </Badge>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground">{item.notes}</p>
                      )}
                      {itemPhotos.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {itemPhotos.map(photo => (
                            <div key={photo.id} className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border border-border">
                              <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {/* Flagged Items Summary */}
        {flaggedItems.length > 0 && (
          <Card className="border-amber-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                Items Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {flaggedItems.map(item => {
                  const room = rooms.find(r => r.id === item.room_id);
                  return (
                    <div key={item.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.item_name}</p>
                        <p className="text-xs text-muted-foreground">{room?.room_name}</p>
                        {item.notes && <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>}
                      </div>
                      <Badge variant="outline" className={CONDITION_BADGE_STYLES[item.condition]}>
                        {CONDITION_LABELS[item.condition]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Signature Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Clerk / Inspector</p>
                <Input
                  placeholder="Full name"
                  value={clerkSignName}
                  onChange={e => setClerkSignName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Date: {format(new Date(), "dd/MM/yyyy")}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Tenant</p>
                <Input
                  placeholder="Full name"
                  value={tenantSignName}
                  onChange={e => setTenantSignName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Date: {format(new Date(), "dd/MM/yyyy")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center italic max-w-3xl mx-auto">
          This condition report has been prepared by a LISTD inventory clerk and provides a fair and accurate
          representation of the property's condition at the time of inspection. All observations are made in
          good faith. This document may be used as evidence in any deposit dispute resolution.
        </p>
      </div>
    </div>
  );
};

export default ConditionReportPage;
