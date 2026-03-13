import { useNavigate, useSearchParams } from "react-router-dom";
import { useTenantPortal } from "@/hooks/useTenantPortal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye, CheckCircle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

const formatType = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const TenantHome = () => {
  const { tenant, property, job, reports, token } = useTenantPortal();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const address = [property?.address_line_1, property?.city, property?.postcode].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-lg font-bold text-foreground">
          Welcome, {tenant?.full_name || "Tenant"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{address}</p>
        {job && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatType(job.inspection_type)} · {format(parseISO(job.scheduled_date), "d MMMM yyyy")}
          </p>
        )}
      </div>

      {/* Reports */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Your Reports</h2>
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No reports available yet</p>
              <p className="text-xs text-muted-foreground mt-1">Reports will appear here once your inspection is complete</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => {
              const isSigned = !!report.signed_at;
              return (
                <Card key={report.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {job ? formatType(job.inspection_type) : "Inspection"} Report
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Generated {format(parseISO(report.generated_at), "d MMM yyyy, HH:mm")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          isSigned
                            ? "bg-success/10 text-success"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {isSigned ? (
                          <><CheckCircle className="w-3 h-3 mr-1" />Signed</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" />Awaiting Signature</>
                        )}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => navigate(`/tenant/portal/report/${report.id}?token=${token}`)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantHome;
