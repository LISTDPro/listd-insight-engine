import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Flag, Plus, RefreshCw, ShieldOff } from "lucide-react";
import { format } from "date-fns";

interface ClerkIncident {
  id: string;
  clerk_id: string;
  job_id: string | null;
  incident_type: string;
  severity: string;
  notes: string | null;
  restrict_priority: boolean;
  logged_by: string | null;
  created_at: string;
}

interface ClerkOption {
  user_id: string;
  full_name: string | null;
}

const INCIDENT_TYPES: Record<string, string> = {
  cancellation_24_48h: "Cancellation (24–48h before)",
  cancellation_lt_24h: "Cancellation (<24h before)",
  no_show: "No-Show",
  missed_deadline: "Missed Report Deadline",
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  flag: { label: "Flag", color: "bg-warning/10 text-warning border-warning/30" },
  major_flag: { label: "Major Flag", color: "bg-orange-100 text-orange-700 border-orange-300" },
  critical_flag: { label: "Critical Flag", color: "bg-destructive/10 text-destructive border-destructive/30" },
};

const ClerkReliabilityPanel = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<ClerkIncident[]>([]);
  const [clerks, setClerks] = useState<ClerkOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [selectedClerk, setSelectedClerk] = useState("");
  const [incidentType, setIncidentType] = useState("cancellation_lt_24h");
  const [severity, setSeverity] = useState("flag");
  const [notes, setNotes] = useState("");
  const [restrictPriority, setRestrictPriority] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [incidentRes, clerkRes] = await Promise.all([
      (supabase as any).from("clerk_incidents").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name").order("full_name"),
    ]);
    if (incidentRes.data) setIncidents(incidentRes.data as ClerkIncident[]);
    if (clerkRes.data) setClerks(clerkRes.data as ClerkOption[]);
    setLoading(false);
  };

  const handleLogIncident = async () => {
    if (!selectedClerk || !incidentType) return;
    setSaving(true);

    const { error } = await (supabase as any).from("clerk_incidents").insert({
      clerk_id: selectedClerk,
      incident_type: incidentType,
      severity,
      notes: notes || null,
      restrict_priority: restrictPriority,
      logged_by: profile?.user_id || null,
    });

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Incident logged", description: "Clerk reliability record updated." });
      setDialogOpen(false);
      setSelectedClerk("");
      setNotes("");
      setRestrictPriority(false);
      fetchData();
    }
  };

  // Group incidents by clerk
  const incidentCountByClerk = incidents.reduce((acc, inc) => {
    acc[inc.clerk_id] = (acc[inc.clerk_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const restrictedClerks = incidents
    .filter((i) => i.restrict_priority)
    .map((i) => i.clerk_id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Clerk Reliability Tracking</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Internal performance flags — not visible to clerks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Log Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-destructive" />
                  Log Clerk Incident
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Clerk</Label>
                  <Select value={selectedClerk} onValueChange={setSelectedClerk}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select clerk..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clerks.map((c) => (
                        <SelectItem key={c.user_id} value={c.user_id}>
                          {c.full_name || c.user_id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Incident Type</Label>
                  <Select value={incidentType} onValueChange={setIncidentType}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INCIDENT_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Severity</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SEVERITY_CONFIG).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Context or details..."
                    rows={2}
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div>
                    <p className="text-xs font-medium text-foreground">Restrict Priority Job Access</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Prevent clerk from being allocated to Priority tier jobs</p>
                  </div>
                  <Switch
                    checked={restrictPriority}
                    onCheckedChange={setRestrictPriority}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleLogIncident}
                  disabled={saving || !selectedClerk}
                >
                  {saving ? "Saving..." : "Log Incident"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary stats */}
      {Object.keys(incidentCountByClerk).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(incidentCountByClerk)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([clerkId, count]) => {
              const clerk = clerks.find((c) => c.user_id === clerkId);
              const isRestricted = restrictedClerks.includes(clerkId);
              return (
                <div key={clerkId} className={`p-3 rounded-lg border ${isRestricted ? "bg-destructive/5 border-destructive/20" : "bg-muted/30 border-border"}`}>
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-medium text-foreground truncate">{clerk?.full_name || clerkId.slice(0, 8)}</p>
                    {isRestricted && <ShieldOff className="w-3.5 h-3.5 text-destructive shrink-0" />}
                  </div>
                  <p className="text-lg font-bold text-foreground mt-1">{count}</p>
                  <p className="text-[10px] text-muted-foreground">incident{count !== 1 ? "s" : ""}</p>
                </div>
              );
            })}
        </div>
      )}

      {/* Incidents table */}
      <div className="bg-card border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Clerk</TableHead>
              <TableHead>Incident</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Restrictions</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Logged</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Loading...</TableCell>
              </TableRow>
            ) : incidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-muted-foreground/40" />
                  No incidents logged
                </TableCell>
              </TableRow>
            ) : (
              incidents.map((inc) => {
                const clerk = clerks.find((c) => c.user_id === inc.clerk_id);
                const sevConfig = SEVERITY_CONFIG[inc.severity] || SEVERITY_CONFIG.flag;
                return (
                  <TableRow key={inc.id}>
                    <TableCell className="font-medium text-sm">
                      {clerk?.full_name || inc.clerk_id.slice(0, 8) + "..."}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {INCIDENT_TYPES[inc.incident_type] || inc.incident_type}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${sevConfig.color}`}>
                        {sevConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inc.restrict_priority ? (
                        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">
                          <ShieldOff className="w-2.5 h-2.5 mr-1" />
                          Priority Restricted
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {inc.notes || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(inc.created_at), "d MMM yyyy")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClerkReliabilityPanel;
