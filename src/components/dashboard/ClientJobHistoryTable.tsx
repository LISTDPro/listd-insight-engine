import { useNavigate } from "react-router-dom";
import { useJobs } from "@/hooks/useJobs";
import { useProperties } from "@/hooks/useProperties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  INSPECTION_TYPE_LABELS,
  JOB_STATUS_LABELS,
  JobStatus,
} from "@/types/database";
import { format } from "date-fns";
import { Loader2, ExternalLink, ClipboardList, Plus } from "lucide-react";

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

const ClientJobHistoryTable = () => {
  const navigate = useNavigate();
  const { jobs, loading } = useJobs();
  const { properties } = useProperties();

  const propertyMap = properties.reduce((acc, prop) => {
    acc[prop.id] = prop;
    return acc;
  }, {} as Record<string, (typeof properties)[0]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium text-foreground mb-1 text-sm">No Jobs Yet</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Book your first inventory inspection to get started.
          </p>
          <Button size="sm" onClick={() => navigate("/book")} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Book Inventory
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Sort jobs by scheduled_date descending
  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Job History</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              All inspections · {jobs.length} total
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => navigate("/dashboard/jobs")}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">Address</TableHead>
                <TableHead className="text-[11px]">Date</TableHead>
                <TableHead className="text-[11px]">Type</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px] text-right">Cost</TableHead>
                <TableHead className="text-[11px] w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedJobs.slice(0, 10).map((job) => {
                const property = propertyMap[job.property_id];
                const price = job.final_price || job.quoted_price;
                return (
                  <TableRow
                    key={job.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/dashboard/jobs/${job.id}`)}
                  >
                    <TableCell className="py-2.5">
                      <div className="text-xs font-medium text-foreground truncate max-w-[200px]">
                        {property?.address_line_1 || "—"}
                      </div>
                      {property && (
                        <div className="text-[10px] text-muted-foreground">
                          {property.city}, {property.postcode}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(job.scheduled_date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="text-xs text-foreground">
                        {INSPECTION_TYPE_LABELS[job.inspection_type]}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${STATUS_STYLES[job.status] || ""}`}
                      >
                        {JOB_STATUS_LABELS[job.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      {price != null ? (
                        <span className="text-xs font-semibold text-foreground">
                          £{price.toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientJobHistoryTable;
