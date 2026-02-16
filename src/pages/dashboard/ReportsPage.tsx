import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  MapPin, 
  Calendar, 
  CheckCircle2,
  Clock,
  Loader2,
  Eye,
  Download,
  FileCheck
} from "lucide-react";
import { format } from "date-fns";

interface ReportWithJob {
  id: string;
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  job: {
    id: string;
    inspection_type: string;
    scheduled_date: string;
    status: string;
    client_report_accepted: boolean;
    property: {
      address_line_1: string;
      city: string;
      postcode: string;
    };
  };
}

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  new_inventory: "New Inventory",
  check_in: "Check-In",
  check_out: "Check-Out",
  mid_term: "Mid-Term",
  interim: "Interim",
};

const ReportsPage = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      
      let query = supabase
        .from("inspection_reports")
        .select(`
          id,
          started_at,
          submitted_at,
          completed_at,
          job:jobs(
            id,
            inspection_type,
            scheduled_date,
            status,
            client_report_accepted,
            property:properties(
              address_line_1,
              city,
              postcode
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (role === "clerk") {
        query = query.eq("clerk_id", user.id);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Filter out reports where job or property is null
        const validReports = data.filter(
          (r) => r.job !== null && r.job.property !== null
        ) as ReportWithJob[];
        setReports(validReports);
      }
      setLoading(false);
    };

    fetchReports();
  }, [user, role]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getReportStatus = (report: ReportWithJob) => {
    if (report.job.client_report_accepted) return { label: "Accepted", color: "bg-success/10 text-success" };
    if (report.completed_at) return { label: "Completed", color: "bg-success/10 text-success" };
    if (report.submitted_at) return { label: "Submitted", color: "bg-primary/10 text-primary" };
    if (report.started_at) return { label: "In Progress", color: "bg-warning/10 text-warning" };
    return { label: "Pending", color: "bg-muted text-muted-foreground" };
  };

  // Group reports
  const pendingReports = reports.filter(r => !r.submitted_at);
  const submittedReports = reports.filter(r => r.submitted_at && !r.job.client_report_accepted);
  const completedReports = reports.filter(r => r.job.client_report_accepted);

  const renderReportCard = (report: ReportWithJob) => {
    const status = getReportStatus(report);
    
    return (
      <Card key={report.id} className="hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className={status.color}>
                  {status.label}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {INSPECTION_TYPE_LABELS[report.job.inspection_type]}
                </Badge>
              </div>
              
              <h4 className="font-medium text-foreground">
                {report.job.property.address_line_1}
              </h4>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {report.job.property.city}, {report.job.property.postcode}
              </div>
              
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(report.job.scheduled_date), "d MMM yyyy")}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => navigate(`/dashboard/reports/${report.job.id}`)}
              >
                <Eye className="w-4 h-4" />
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            {role === "clerk" 
              ? "View your submitted inspection reports" 
              : "Review and approve inventory reports"}
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">No Reports Yet</h3>
            <p className="text-sm text-muted-foreground">
              {role === "clerk" 
                ? "Complete inspections to generate reports."
                : "Reports will appear here once inspections are completed."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending Review (for clients) */}
          {role === "client" && submittedReports.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileCheck className="w-5 h-5 text-warning" />
                <h3 className="font-semibold text-foreground">Pending Your Review</h3>
                <Badge variant="secondary">{submittedReports.length}</Badge>
              </div>
              <div className="space-y-3">
                {submittedReports.map(renderReportCard)}
              </div>
            </div>
          )}

          {/* In Progress (for clerks) */}
          {role === "clerk" && pendingReports.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-warning" />
                <h3 className="font-semibold text-foreground">In Progress</h3>
                <Badge variant="secondary">{pendingReports.length}</Badge>
              </div>
              <div className="space-y-3">
                {pendingReports.map(renderReportCard)}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedReports.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <h3 className="font-semibold text-foreground">Completed & Accepted</h3>
                <Badge variant="secondary">{completedReports.length}</Badge>
              </div>
              <div className="space-y-3">
                {completedReports.map(renderReportCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
