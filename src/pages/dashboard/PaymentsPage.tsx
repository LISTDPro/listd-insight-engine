import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useXeroInvoice } from "@/hooks/useXeroInvoice";
import { useXeroConnection } from "@/hooks/useXeroConnection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EscrowStatusCard from "@/components/dashboard/EscrowStatusCard";
import { calculatePayoutBreakdown } from "@/utils/escrow";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { 
  CreditCard, 
  MapPin, 
  Calendar, 
  CheckCircle2,
  Clock,
  Loader2,
  PoundSterling,
  AlertCircle,
  ArrowUpRight,
  Shield,
  TrendingUp,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { format } from "date-fns";

interface JobWithPayment {
  id: string;
  inspection_type: string;
  scheduled_date: string;
  status: string;
  quoted_price: number | null;
  final_price: number | null;
  client_report_accepted: boolean;
  provider_id: string | null;
  property: {
    address_line_1: string;
    city: string;
    postcode: string;
  };
}

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  new_inventory: "New Inventory",
  check_in: "Check-In",
  check_out: "Check-Out",
  mid_term: "Mid-Term",
  interim: "Interim",
};

const PaymentsPage = () => {
  const { user, role } = useAuth();
  const { createInvoice, creating: creatingInvoice } = useXeroInvoice();
  const { connected: xeroConnected } = useXeroConnection();
  const [jobs, setJobs] = useState<JobWithPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      
      let query = supabase
        .from("jobs")
        .select(`
          id,
          inspection_type,
          scheduled_date,
          status,
          quoted_price,
          final_price,
          client_report_accepted,
          provider_id,
          property:properties(
            address_line_1,
            city,
            postcode
          )
        `)
        .order("scheduled_date", { ascending: false });

      if (role === "client") {
        query = query.eq("client_id", user.id);
      } else if (role === "provider") {
        query = query.eq("provider_id", user.id);
      } else if (role === "clerk") {
        query = query.eq("clerk_id", user.id);
      }

      const { data, error } = await query;

      if (!error && data) {
        const validJobs = data.filter(
          (j) => j.property !== null
        ) as JobWithPayment[];
        setJobs(validJobs);
      }
      setLoading(false);
    };

    fetchPayments();
  }, [user, role]);

  // Calculate totals based on role
  const isClerk = role === "clerk";
  const isAdmin = role === "admin";
  
  const getAmount = (job: JobWithPayment) => {
    const gross = job.final_price || job.quoted_price || 0;
    if (isClerk) {
      // Use stored clerk payout if available, otherwise fallback to calculation
      return (job as any).clerk_final_payout || (job as any).clerk_payout || calculatePayoutBreakdown(gross, !!job.provider_id).clerkPayout;
    }
    return gross;
  };

  // Monthly earnings chart data (for clerks)
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    const completedJobs = jobs.filter(j => ["paid", "completed"].includes(j.status));
    completedJobs.forEach(j => {
      const key = format(new Date(j.scheduled_date), "MMM yyyy");
      months[key] = (months[key] || 0) + getAmount(j);
    });
    return Object.entries(months)
      .slice(-6)
      .map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 }));
  }, [jobs]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingPayment = jobs
    .filter(j => ['published', 'accepted', 'assigned', 'in_progress', 'submitted', 'reviewed', 'completed'].includes(j.status))
    .reduce((sum, j) => sum + getAmount(j), 0);
  
  const totalPaid = jobs
    .filter(j => j.status === "paid")
    .reduce((sum, j) => sum + getAmount(j), 0);

  const pendingJobs = jobs.filter(j => ['published', 'accepted', 'assigned', 'in_progress'].includes(j.status));
  const jobsReadyToPay = jobs.filter(j => ['submitted', 'reviewed', 'completed'].includes(j.status) && j.status !== "paid");
  const paidJobs = jobs.filter(j => j.status === "paid");

  const handleExportCSV = () => {
    const rows = jobs.map(j => ({
      Date: format(new Date(j.scheduled_date), "yyyy-MM-dd"),
      Property: j.property.address_line_1,
      City: j.property.city,
      Type: INSPECTION_TYPE_LABELS[j.inspection_type],
      Status: j.status,
      Amount: `£${getAmount(j).toFixed(2)}`,
    }));
    const csv = [Object.keys(rows[0]).join(","), ...rows.map(r => Object.values(r).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `listd-earnings-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPaymentStatus = (job: JobWithPayment) => {
    if (job.status === "paid") return { label: "Paid", color: "bg-success/10 text-success", icon: CheckCircle2 };
    if (job.status === "completed") return { label: isClerk ? "Payout Pending" : "Awaiting Payment", color: "bg-warning/10 text-warning", icon: Clock };
    if (job.client_report_accepted) return { label: isClerk ? "Releasing Soon" : "Ready to Pay", color: "bg-primary/10 text-primary", icon: PoundSterling };
    return { label: "Pending", color: "bg-muted text-muted-foreground", icon: AlertCircle };
  };

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {isClerk ? "Earnings" : "Payments"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isClerk
              ? "Track your earnings and payout history"
              : "Manage your invoices and payment history"}
          </p>
        </div>
        {jobs.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isClerk ? "Pending Earnings" : "Pending Payment"}
                </p>
                <p className="text-2xl font-bold text-foreground">£{pendingPayment.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isClerk ? "Awaiting Release" : "Ready to Release"}
                </p>
                <p className="text-2xl font-bold text-foreground">{jobsReadyToPay.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isClerk ? "Total Earned" : "Total Paid"}
                </p>
                <p className="text-2xl font-bold text-foreground">£{totalPaid.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart (clerks only) */}
      {isClerk && monthlyData.length > 0 && (
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v: number) => `£${v}`} />
                <Tooltip
                  formatter={(value: number) => [`£${value.toFixed(2)}`, "Earnings"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">
              {isClerk ? "No Earnings Yet" : "No Payment History"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isClerk
                ? "Complete inspections to start earning."
                : "Book a job to see payment information here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Ready to pay / Escrow held */}
          {jobsReadyToPay.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">
                  {isClerk ? "In Escrow" : "Ready for Payment"}
                </h3>
                <Badge variant="secondary">{jobsReadyToPay.length}</Badge>
              </div>
              <div className="space-y-3">
                {jobsReadyToPay.map((job) => {
                  const gross = job.final_price || job.quoted_price || 0;
                  const payout = calculatePayoutBreakdown(gross, !!job.provider_id);
                  const status = getPaymentStatus(job);
                  return (
                    <div key={job.id} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className={status.color}>
                                  {status.label}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {INSPECTION_TYPE_LABELS[job.inspection_type]}
                                </Badge>
                              </div>
                              <h4 className="font-medium text-foreground">
                                {job.property.address_line_1}
                              </h4>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5" />
                                {job.property.city}
                              </div>
                            </div>
                            {!isClerk && (
                              <div className="text-right space-y-2">
                                <p className="text-lg font-semibold text-foreground">
                                  £{gross.toFixed(2)}
                                </p>
                                <Button 
                                  size="sm" 
                                  className="gap-1 w-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Navigate to job detail for payment release
                                    window.location.href = `/dashboard/jobs/${job.id}`;
                                  }}
                                >
                                  Release Payment
                                  <ArrowUpRight className="w-3 h-3" />
                                </Button>
                                {xeroConnected && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 w-full"
                                    disabled={creatingInvoice}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      createInvoice(job.id);
                                    }}
                                  >
                                    <FileSpreadsheet className="w-3 h-3" />
                                    {creatingInvoice ? "Creating..." : "Xero Invoice"}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      <EscrowStatusCard
                        status="held"
                        payout={payout}
                        heldAt={new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()}
                        autoReleaseAt={new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString()}
                        showClerkPayout={isClerk}
                        showPlatformMargin={isAdmin}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Jobs */}
          {pendingJobs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-warning" />
                <h3 className="font-semibold text-foreground">
                  {isClerk ? "Active Jobs" : "Pending Jobs"}
                </h3>
                <Badge variant="secondary">{pendingJobs.length}</Badge>
              </div>
              <div className="space-y-3">
                {pendingJobs.map((job) => {
                  const status = getPaymentStatus(job);
                  const amount = getAmount(job);
                  return (
                    <Card key={job.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={status.color}>
                                {status.label}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {INSPECTION_TYPE_LABELS[job.inspection_type]}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-foreground">
                              {job.property.address_line_1}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {job.property.city}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(job.scheduled_date), "d MMM yyyy")}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-foreground">
                              £{amount.toFixed(2)}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {isClerk ? "net payout" : "quoted"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Paid / History */}
          {paidJobs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <h3 className="font-semibold text-foreground">
                  {isClerk ? "Earnings History" : "Payment History"}
                </h3>
                <Badge variant="secondary">{paidJobs.length}</Badge>
              </div>
              <div className="space-y-3">
                {paidJobs.map((job) => {
                  const amount = getAmount(job);
                  return (
                    <Card key={job.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-success/10 text-success">
                                {isClerk ? "Earned" : "Paid"}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {INSPECTION_TYPE_LABELS[job.inspection_type]}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-foreground">
                              {job.property.address_line_1}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {job.property.city}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(job.scheduled_date), "d MMM yyyy")}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-foreground">
                              £{amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
