import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar } from "lucide-react";

const jobs = [
  {
    id: "INV-2024-001",
    property: "42 Victoria Street, Manchester",
    type: "Check-out",
    status: "In Progress",
    date: "28 Jan 2026",
  },
  {
    id: "INV-2024-002",
    property: "15 Kings Road, London",
    type: "Check-in",
    status: "Pending Approval",
    date: "29 Jan 2026",
  },
  {
    id: "INV-2024-003",
    property: "8 Queens Avenue, Birmingham",
    type: "Mid-term",
    status: "Scheduled",
    date: "30 Jan 2026",
  },
];

const statusStyles: Record<string, string> = {
  "In Progress": "bg-accent/10 text-accent border-accent/20",
  "Pending Approval": "bg-warning/10 text-warning border-warning/20",
  "Scheduled": "bg-muted text-muted-foreground border-border",
  "Completed": "bg-success/10 text-success border-success/20",
};

const RecentJobs = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Recent Jobs</h3>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/dashboard/jobs")}>
          View All
        </Button>
      </div>
      
      <div className="divide-y divide-border">
        {jobs.map((job) => (
          <div key={job.id} className="px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground">{job.id}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusStyles[job.status]}`}>
                    {job.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {job.property}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {job.date}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentJobs;
