import { useState } from "react";
import { useAllJobs } from "@/hooks/useSuperAdminData";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Search } from "lucide-react";

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

const JOB_STATUSES = [
  "all", "draft", "pending", "published", "accepted", "assigned",
  "in_progress", "submitted", "completed", "cancelled",
];

const SuperAdminJobs = () => {
  const { data: jobs, isLoading } = useAllJobs();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = (jobs || []).filter((j) => {
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    const addr = j.property?.address_line_1 || "";
    return addr.toLowerCase().includes(search.toLowerCase()) || j.id.includes(search);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">All Jobs</h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by address or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {JOB_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All Statuses" : s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Organisation</TableHead>
              <TableHead>Clerk</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No jobs found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    {job.property?.address_line_1 || "—"}
                  </TableCell>
                  <TableCell>{job.organisation?.name || "—"}</TableCell>
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
                  <TableCell className="text-right">
                    {job.quoted_price ? `£${Number(job.quoted_price).toFixed(2)}` : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SuperAdminJobs;
