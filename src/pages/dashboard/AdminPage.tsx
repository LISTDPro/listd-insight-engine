import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Briefcase, ShieldCheck, AlertTriangle,
  CheckCircle2, XCircle, Clock, Search, Eye, UserCheck, Package, Zap,
  ListChecks, ExternalLink, ClipboardList, Mail, RefreshCw, Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MarkDeliveredDialog from "@/components/admin/MarkDeliveredDialog";
import DisputeResolutionDialog from "@/components/admin/DisputeResolutionDialog";
import IssueStrikeDialog from "@/components/admin/IssueStrikeDialog";
import DailyChecklistPayments from "@/components/admin/DailyChecklistPayments";
import EmailLogDashboard from "@/components/admin/EmailLogDashboard";
import { useInventoryBaseSync } from "@/hooks/useInventoryBaseSync";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  onboarding_completed: boolean;
  verification_status: string;
  created_at: string;
  role: string | null;
  clerk_jobs_completed: number | null;
  clerk_rating: number | null;
  clerk_level: number | null;
}

interface JobRow {
  id: string;
  status: string;
  inspection_type: string;
  scheduled_date: string;
  created_at: string;
  client_id: string;
  clerk_id: string | null;
  property_id: string;
  service_tier: string;
  quoted_price: number | null;
  inventorybase_job_id: string | null;
}

interface DisputeRow {
  id: string;
  job_id: string;
  raised_by: string;
  raised_against: string;
  reason: string;
  description: string | null;
  status: string;
  resolution: string | null;
  admin_notes: string | null;
  created_at: string;
}

const AdminPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fetchEvents: fetchIBEvents, linkEvent: linkIBEvent, syncing: ibSyncing, linking: ibLinking, events: ibEvents, matchedCount: ibMatchedCount } = useInventoryBaseSync();

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");

  // Dialog states
  const [markDeliveredJobId, setMarkDeliveredJobId] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<DisputeRow | null>(null);
  const [strikeTarget, setStrikeTarget] = useState<{ userId: string; name: string } | null>(null);

  useEffect(() => {
    if (role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchAllData();
  }, [role]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchJobs(), fetchDisputes()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");

    if (profiles) {
      const merged = profiles.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        phone: p.phone,
        onboarding_completed: p.onboarding_completed,
        verification_status: p.verification_status || "unverified",
        created_at: p.created_at,
        role: roles?.find((r: any) => r.user_id === p.user_id)?.role || null,
        clerk_jobs_completed: p.clerk_jobs_completed,
        clerk_rating: p.clerk_rating,
        clerk_level: p.clerk_level,
      }));
      setUsers(merged);
    }
  };

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setJobs(data as JobRow[]);
  };

  const fetchDisputes = async () => {
    const { data } = await (supabase as any)
      .from("disputes")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setDisputes(data as DisputeRow[]);
  };

  const approveClerk = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ verification_status: "verified" } as any)
      .eq("user_id", userId);

    if (!error) {
      toast({ title: "Clerk approved", description: "Verification status updated." });
      fetchUsers();
    }
  };

  const rejectClerk = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ verification_status: "rejected" } as any)
      .eq("user_id", userId);

    if (!error) {
      toast({ title: "Clerk rejected", description: "Verification status updated." });
      fetchUsers();
    }
  };

  const forceCompleteJob = async (jobId: string) => {
    const { error } = await supabase
      .from("jobs")
      .update({ status: "completed" as any })
      .eq("id", jobId);

    if (!error) {
      toast({ title: "Job force-completed" });
      fetchJobs();
    }
  };

  const cancelJob = async (jobId: string) => {
    const { error } = await supabase
      .from("jobs")
      .update({ status: "cancelled" as any })
      .eq("id", jobId);

    if (!error) {
      toast({ title: "Job cancelled" });
      fetchJobs();
    }
  };

  // Stats
  const totalUsers = users.length;
  const totalClerks = users.filter((u) => u.role === "clerk").length;
  const totalClients = users.filter((u) => u.role === "client").length;
  const activeJobs = jobs.filter((j) => !["completed", "cancelled", "paid"].includes(j.status)).length;
  const openDisputes = disputes.filter((d) => d.status === "open").length;
  const unverifiedClerks = users.filter(
    (u) => u.role === "clerk" && u.verification_status !== "verified"
  ).length;

  // Checklist counts
  const needsIBCreation = jobs.filter(j => j.status === "accepted" && !j.inventorybase_job_id).length;
  const needsDelivery = jobs.filter(j => ["in_progress", "submitted"].includes(j.status)).length;

  // Filtered data
  const filteredUsers = users.filter((u) => {
    const matchesSearch = !searchTerm ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.user_id.includes(searchTerm);
    const matchesFilter = userFilter === "all" || u.role === userFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredJobs = jobs.filter((j) => {
    return jobFilter === "all" || j.status === jobFilter;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      published: "bg-blue-100 text-blue-800",
      accepted: "bg-primary/10 text-primary",
      in_progress: "bg-accent/30 text-accent-foreground",
      completed: "bg-success/10 text-success",
      cancelled: "bg-destructive/10 text-destructive",
      submitted: "bg-purple-100 text-purple-800",
      paid: "bg-success/20 text-success",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${variants[status] || "bg-muted text-muted-foreground"}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  const getRoleBadge = (role: string | null) => {
    if (!role) return <Badge variant="outline">No role</Badge>;
    const colors: Record<string, string> = {
      client: "bg-blue-100 text-blue-800",
      clerk: "bg-primary/10 text-primary",
      admin: "bg-accent/30 text-accent-foreground",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${colors[role] || ""}`}>
        {role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading admin data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform management and oversight
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { icon: Users, label: "Total Users", value: totalUsers, color: "text-foreground" },
          { icon: UserCheck, label: "Clients", value: totalClients, color: "text-blue-600" },
          { icon: ShieldCheck, label: "Clerks", value: totalClerks, color: "text-primary" },
          { icon: Briefcase, label: "Active Jobs", value: activeJobs, color: "text-accent-foreground" },
          { icon: Clock, label: "Unverified", value: unverifiedClerks, color: "text-warning" },
          { icon: AlertTriangle, label: "Open Disputes", value: openDisputes, color: "text-destructive" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="checklist" className="space-y-6">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="checklist" className="gap-2">
            <ListChecks className="w-4 h-4" /> Daily Checklist
            {(needsIBCreation + needsDelivery) > 0 && (
              <span className="ml-1 bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 font-bold">
                {needsIBCreation + needsDelivery}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="verification" className="gap-2">
            <ShieldCheck className="w-4 h-4" /> Verification
            {unverifiedClerks > 0 && (
              <span className="ml-1 bg-warning text-warning-foreground text-[10px] px-1.5 py-0.5 font-bold">
                {unverifiedClerks}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <Briefcase className="w-4 h-4" /> Jobs
          </TabsTrigger>
          <TabsTrigger value="disputes" className="gap-2">
            <AlertTriangle className="w-4 h-4" /> Disputes
            {openDisputes > 0 && (
              <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 font-bold">
                {openDisputes}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="emails" className="gap-2">
            <Mail className="w-4 h-4" /> Emails
          </TabsTrigger>
        </TabsList>

        {/* Daily Checklist Tab */}
        <TabsContent value="checklist" className="space-y-6">
          {/* InventoryBase Calendar Sync */}
          <div className="bg-card border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">InventoryBase Calendar Sync</h3>
                <p className="text-xs text-muted-foreground">Pull inspection schedules and auto-match to LISTD jobs by address & date</p>
              </div>
              {ibMatchedCount > 0 && (
                <Badge className="bg-success/10 text-success border-success/30">
                  {ibMatchedCount} matched
                </Badge>
              )}
              <Button
                size="sm"
                className="ml-auto gap-2"
                onClick={() => fetchIBEvents()}
                disabled={ibSyncing}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${ibSyncing ? "animate-spin" : ""}`} />
                {ibSyncing ? "Syncing..." : "Sync Now"}
              </Button>
            </div>
            {ibEvents.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Inspection</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>LISTD Match</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ibEvents.slice(0, 30).map((event) => (
                    <TableRow key={event.uid} className={event.match ? "bg-success/5" : ""}>
                      <TableCell className="text-sm font-medium">{event.summary}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{event.location || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {event.start_date ? new Date(event.start_date).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        {event.match ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                              <span className="text-xs font-medium text-success">{event.match.score}% match</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                              {event.match.property_address}
                            </p>
                            <p className="text-[10px] font-mono text-muted-foreground/60">
                              Job: {event.match.job_id.slice(0, 8)}...
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No match</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {event.match ? (
                          <Button
                            size="sm"
                            variant="accent"
                            className="text-xs gap-1"
                            disabled={ibLinking === event.match.job_id}
                            onClick={async () => {
                              if (event.match) {
                                const success = await linkIBEvent(event.match.job_id, event.uid);
                                if (success) fetchJobs();
                              }
                            }}
                          >
                            <Zap className="w-3 h-3" />
                            {ibLinking === event.match?.job_id ? "Linking..." : "Auto-Link"}
                          </Button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {ibEvents.length === 0 && (
              <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                Click "Sync Now" to fetch inspections from InventoryBase and auto-match by address & date
              </div>
            )}
          </div>

          {/* Section 1: Jobs needing InventoryBase creation */}
          <div className="bg-card border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Needs InventoryBase Job Creation</h3>
                <p className="text-xs text-muted-foreground">Accepted jobs without an InventoryBase ID — create externally then record here</p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {needsIBCreation}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Job ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Clerk</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {needsIBCreation === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6 text-sm">
                      <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-success" />
                      All accepted jobs have InventoryBase IDs
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs
                    .filter(j => j.status === "accepted" && !j.inventorybase_job_id)
                    .map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}...</TableCell>
                        <TableCell className="capitalize text-sm">{job.inspection_type.replace("_", " ")}</TableCell>
                        <TableCell className="capitalize text-sm">{job.service_tier}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(job.scheduled_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {job.clerk_id ? job.clerk_id.slice(0, 8) + "..." : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              const ibId = prompt("Enter InventoryBase Job ID:");
                              if (ibId) {
                                supabase
                                  .from("jobs")
                                  .update({ inventorybase_job_id: ibId } as any)
                                  .eq("id", job.id)
                                  .then(({ error }) => {
                                    if (!error) {
                                      toast({ title: "InventoryBase ID saved" });
                                      fetchJobs();
                                    } else {
                                      toast({ title: "Error", description: error.message, variant: "destructive" });
                                    }
                                  });
                              }
                            }}
                          >
                            <ClipboardList className="w-3 h-3 mr-1" />
                            Set IB ID
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Section 2: Jobs needing Mark as Delivered */}
          <div className="bg-card border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Needs Mark as Delivered</h3>
                <p className="text-xs text-muted-foreground">In-progress or submitted jobs ready for delivery confirmation</p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {needsDelivery}
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Job ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {needsDelivery === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6 text-sm">
                      <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-success" />
                      No jobs awaiting delivery
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs
                    .filter(j => ["in_progress", "submitted"].includes(j.status))
                    .map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}...</TableCell>
                        <TableCell className="capitalize text-sm">{job.inspection_type.replace("_", " ")}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(job.scheduled_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{job.quoted_price ? `£${job.quoted_price}` : "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" className="text-xs" onClick={() => setMarkDeliveredJobId(job.id)}>
                            <Package className="w-3 h-3 mr-1" />
                            Mark Delivered
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Section 3: Payments pending approval */}
          <DailyChecklistPayments />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1">
              {["all", "client", "clerk", "admin"].map((f) => (
                <Button
                  key={f}
                  variant={userFilter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUserFilter(f)}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Level / Rating</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.full_name || "—"}
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${
                          u.verification_status === "verified"
                            ? "text-success"
                            : u.verification_status === "rejected"
                            ? "text-destructive"
                            : "text-warning"
                        }`}>
                          {u.verification_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {u.role === "clerk" ? (
                          <span className="text-xs text-muted-foreground">
                            L{u.clerk_level || 1} · ★{u.clerk_rating || 0} · {u.clerk_jobs_completed || 0} jobs
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {u.role === "clerk" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-destructive"
                            onClick={() => setStrikeTarget({ userId: u.user_id, name: u.full_name || "Clerk" })}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Strike
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Verification Tab */}
        <TabsContent value="verification" className="space-y-4">
          <div className="bg-card border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Clerk Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.filter((u) => u.role === "clerk" && u.verification_status !== "verified").length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No pending verifications
                    </TableCell>
                  </TableRow>
                ) : (
                  users
                    .filter((u) => u.role === "clerk" && u.verification_status !== "verified")
                    .map((clerk) => (
                      <TableRow key={clerk.id}>
                        <TableCell className="font-medium">
                          {clerk.full_name || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {clerk.phone || "—"}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${
                            clerk.verification_status === "rejected"
                              ? "text-destructive"
                              : "text-warning"
                          }`}>
                            {clerk.verification_status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(clerk.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveClerk(clerk.user_id)}
                            className="bg-success text-success-foreground hover:bg-success/90"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectClerk(clerk.user_id)}
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="flex gap-1 flex-wrap">
            {["all", "published", "accepted", "in_progress", "submitted", "completed", "cancelled"].map((f) => (
              <Button
                key={f}
                variant={jobFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setJobFilter(f)}
                className="capitalize"
              >
                {f.replace("_", " ")}
              </Button>
            ))}
          </div>

          <div className="bg-card border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Job ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No jobs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">
                        {job.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="capitalize">
                        {job.inspection_type.replace("_", " ")}
                      </TableCell>
                      <TableCell className="capitalize">{job.service_tier}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(job.scheduled_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {job.quoted_price ? `£${job.quoted_price}` : "—"}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {["accepted", "in_progress"].includes(job.status) && (
                          <Button
                            size="sm"
                            onClick={() => setMarkDeliveredJobId(job.id)}
                            className="text-xs"
                          >
                            <Package className="w-3 h-3 mr-1" />
                            Mark Delivered
                          </Button>
                        )}
                        {!["completed", "cancelled", "paid"].includes(job.status) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => forceCompleteJob(job.id)}
                              className="text-xs"
                            >
                              Force Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelJob(job.id)}
                              className="text-xs text-destructive border-destructive/30"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="space-y-4">
          <div className="bg-card border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Dispute ID</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Filed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <AlertTriangle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No disputes filed</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Disputes will appear here when clients or clerks raise them.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  disputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-mono text-xs">
                        {dispute.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {dispute.reason}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground text-xs">
                        {dispute.description || "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${
                          dispute.status === "open"
                            ? "text-warning"
                            : dispute.status === "resolved"
                            ? "text-success"
                            : "text-muted-foreground"
                        }`}>
                          {dispute.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(dispute.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {dispute.status === "open" ? (
                          <Button
                            size="sm"
                            onClick={() => setSelectedDispute(dispute)}
                          >
                            Resolve
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {dispute.resolution}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails">
          <EmailLogDashboard />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {markDeliveredJobId && (
        <MarkDeliveredDialog
          open={!!markDeliveredJobId}
          onOpenChange={(open) => !open && setMarkDeliveredJobId(null)}
          jobId={markDeliveredJobId}
          onSuccess={fetchJobs}
        />
      )}

      {selectedDispute && (
        <DisputeResolutionDialog
          open={!!selectedDispute}
          onOpenChange={(open) => !open && setSelectedDispute(null)}
          dispute={selectedDispute}
          onSuccess={fetchDisputes}
        />
      )}

      {strikeTarget && (
        <IssueStrikeDialog
          open={!!strikeTarget}
          onOpenChange={(open) => !open && setStrikeTarget(null)}
          clerkUserId={strikeTarget.userId}
          clerkName={strikeTarget.name}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
};

export default AdminPage;
