import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Mail, CheckCircle2, XCircle, RefreshCw, Send, Loader2, Clock,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface EmailLog {
  id: string;
  function_name: string;
  recipient_email: string;
  subject: string;
  status: string;
  resend_id: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const FUNCTION_LABELS: Record<string, string> = {
  "send-clerk-invite": "Clerk Invitation",
  "notify-job-published": "Job Published",
  "notify-pre-inspection-ack": "Pre-Inspection Ack",
  "notify-invitation-accepted": "Invitation Accepted",
  "send-password-reset": "Password Reset",
};

const FUNCTION_COLORS: Record<string, string> = {
  "send-clerk-invite": "bg-blue-100 text-blue-800",
  "notify-job-published": "bg-primary/10 text-primary",
  "notify-pre-inspection-ack": "bg-success/10 text-success",
  "notify-invitation-accepted": "bg-accent/10 text-accent-foreground",
  "send-password-reset": "bg-warning/10 text-warning",
};

const EmailLogDashboard = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sending, setSending] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("function_name", filter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setLogs(data as EmailLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const testFunction = async (functionName: string) => {
    setSending(functionName);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Not authenticated", variant: "destructive" });
        return;
      }

      let body: Record<string, unknown> = {};
      let fnName = functionName;

      switch (functionName) {
        case "send-clerk-invite":
          body = {
            email: session.user.email || "test@example.com",
            providerName: "Test Provider",
            inviteToken: crypto.randomUUID(),
          };
          break;
        case "notify-job-published": {
          const { data: testJob } = await supabase
            .from("jobs")
            .select("id, inspection_type, scheduled_date, property:properties(address_line_1, city, postcode)")
            .limit(1)
            .maybeSingle();
          if (!testJob) {
            toast({ title: "No jobs found to test with", variant: "destructive" });
            setSending(null);
            return;
          }
          const prop = testJob.property as any;
          body = {
            jobId: testJob.id,
            propertyAddress: prop?.address_line_1 || "123 Test St",
            city: prop?.city || "London",
            postcode: prop?.postcode || "SW1A 1AA",
            inspectionType: testJob.inspection_type,
            scheduledDate: testJob.scheduled_date,
          };
          break;
        }
        case "notify-pre-inspection-ack": {
          const { data: testJob2 } = await supabase
            .from("jobs")
            .select("id, inspection_type, scheduled_date, property:properties(address_line_1, city, postcode)")
            .limit(1)
            .maybeSingle();
          if (!testJob2) {
            toast({ title: "No jobs found to test with", variant: "destructive" });
            setSending(null);
            return;
          }
          const prop2 = testJob2.property as any;
          body = {
            jobId: testJob2.id,
            propertyAddress: prop2?.address_line_1 || "123 Test St",
            city: prop2?.city || "London",
            postcode: prop2?.postcode || "SW1A 1AA",
            inspectionType: testJob2.inspection_type,
            scheduledDate: testJob2.scheduled_date,
            clientName: "Admin Test",
          };
          break;
        }
        case "send-password-reset":
          body = {
            email: session.user.email || "test@example.com",
            redirectUrl: window.location.origin + "/reset-password",
          };
          fnName = "send-password-reset";
          break;
        default:
          toast({ title: "Unknown function", variant: "destructive" });
          setSending(null);
          return;
      }

      const response = await supabase.functions.invoke(fnName, { body });

      if (response.error) {
        toast({
          title: "Test failed",
          description: response.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Test email sent!",
          description: `${FUNCTION_LABELS[functionName]} triggered successfully.`,
        });
        // Refresh logs after a short delay
        setTimeout(fetchLogs, 2000);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "sent") return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
    if (status === "failed") return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Test Triggers */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Send className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Test Email Triggers</h3>
            <p className="text-xs text-muted-foreground">
              Fire a test email for each notification function
            </p>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(FUNCTION_LABELS)
            .filter(([key]) => key !== "notify-invitation-accepted")
            .map(([key, label]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                disabled={sending === key}
                onClick={() => testFunction(key)}
              >
                {sending === key ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Mail className="w-3 h-3" />
                )}
                {sending === key ? "Sending..." : label}
              </Button>
            ))}
        </div>
      </div>

      {/* Email Log Table */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Email Log</h3>
            <p className="text-xs text-muted-foreground">
              All sent notifications and their delivery status
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Filter by function" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All functions</SelectItem>
                {Object.entries(FUNCTION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Status</TableHead>
              <TableHead>Function</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Resend ID</TableHead>
              <TableHead>Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                  <Mail className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  No emails logged yet. Use the test triggers above to send test emails.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {statusIcon(log.status)}
                      <span className="text-xs capitalize">{log.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium ${FUNCTION_COLORS[log.function_name] || "bg-muted text-muted-foreground"}`}>
                      {FUNCTION_LABELS[log.function_name] || log.function_name}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {log.recipient_email}
                  </TableCell>
                  <TableCell className="text-sm max-w-[250px] truncate text-muted-foreground">
                    {log.subject}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.resend_id ? log.resend_id.slice(0, 12) + "..." : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), "dd MMM yyyy HH:mm")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {logs.length > 0 && (
          <div className="px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {logs.length} most recent emails
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailLogDashboard;
