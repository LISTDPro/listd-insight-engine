import {
  Building2,
  Users,
  Briefcase,
  Home,
  FileText,
  PoundSterling,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/dashboard/StatsCard";
import {
  useSuperAdminStats,
  useRecentJobs,
  useRecentOrgs,
} from "@/hooks/useSuperAdminData";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-800",
  published: "bg-blue-100 text-blue-800",
  accepted: "bg-emerald-100 text-emerald-800",
  assigned: "bg-indigo-100 text-indigo-800",
  in_progress: "bg-orange-100 text-orange-800",
  submitted: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const SuperAdminOverview = () => {
  const { data: stats, isLoading: statsLoading } = useSuperAdminStats();
  const { data: recentJobs } = useRecentJobs();
  const { data: recentOrgs } = useRecentOrgs();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Organisations"
          value={statsLoading ? "…" : String(stats?.totalOrgs || 0)}
          icon={Building2}
        />
        <StatsCard
          title="Clerks"
          value={statsLoading ? "…" : String(stats?.totalClerks || 0)}
          icon={Users}
        />
        <StatsCard
          title="Jobs This Month"
          value={statsLoading ? "…" : String(stats?.totalJobsMonth || 0)}
          change={`${stats?.totalJobsAllTime || 0} all time`}
          icon={Briefcase}
        />
        <StatsCard
          title="Properties"
          value={statsLoading ? "…" : String(stats?.totalProperties || 0)}
          icon={Home}
        />
        <StatsCard
          title="Reports Generated"
          value={statsLoading ? "…" : String(stats?.totalReports || 0)}
          icon={FileText}
        />
        <StatsCard
          title="Revenue This Month"
          value={
            statsLoading
              ? "…"
              : `£${(stats?.revenueMonth || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`
          }
          icon={PoundSterling}
        />
      </div>

      {/* Recent Jobs */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Recent Jobs</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Clerk</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(recentJobs || []).map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">
                  {job.property?.address_line_1 || "—"}, {job.property?.city || ""}
                </TableCell>
                <TableCell>{job.clerk?.full_name || "Unassigned"}</TableCell>
                <TableCell className="capitalize">
                  {job.inspection_type?.replace(/_/g, " ")}
                </TableCell>
                <TableCell>
                  <Badge className={statusColor[job.status] || ""}>
                    {job.status?.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>{job.scheduled_date}</TableCell>
              </TableRow>
            ))}
            {(!recentJobs || recentJobs.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No jobs yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Recent Orgs */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Recent Signups</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organisation</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Date Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(recentOrgs || []).map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell>{org.ownerName}</TableCell>
                <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {(!recentOrgs || recentOrgs.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No organisations yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SuperAdminOverview;
