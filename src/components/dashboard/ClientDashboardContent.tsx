import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Briefcase, PoundSterling, TrendingUp, Clock,
  ClipboardList, CheckCircle2, ArrowRight,
} from "lucide-react";
import SocialProofBadge from "./SocialProofBadge";

interface ClientDashboardProps {
  clientStats: {
    activeJobs: number;
    pendingApproval: number;
    reportsToReview: number;
    upcomingInspections: number;
    readyForPayment: number;
    totalSpend: number;
    totalJobs: number;
    monthSpend: number;
    monthJobs: number;
    avgJobCost: number;
    monthlyData: { month: string; jobs: number; earnings: number }[];
    inspectionTypeBreakdown: { type: string; count: number }[];
    statusBreakdown: { status: string; count: number }[];
  };
}

const PIE_COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--primary))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
];

const ClientDashboardContent = ({ clientStats }: ClientDashboardProps) => {
  const navigate = useNavigate();

  const stats = [
    { label: "Total Spend", value: `£${clientStats.totalSpend.toFixed(0)}`, sub: `${clientStats.totalJobs} jobs total`, icon: PoundSterling, color: "text-primary" },
    { label: "This Month", value: `£${clientStats.monthSpend.toFixed(0)}`, sub: `${clientStats.monthJobs} jobs this month`, icon: TrendingUp, color: "text-accent" },
    { label: "Avg Job Cost", value: `£${clientStats.avgJobCost.toFixed(0)}`, sub: "Per inspection", icon: Briefcase, color: "text-success" },
    { label: "Pending Actions", value: String(clientStats.pendingApproval + clientStats.reportsToReview + clientStats.readyForPayment), sub: "Need attention", icon: Clock, color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      {/* Social Proof */}
      <SocialProofBadge />

      {/* Stats — matching clerk portal card style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-border bg-card text-center">
            <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Spending Overview</CardTitle>
            <p className="text-[11px] text-muted-foreground">Last 6 months spend & job volume</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientStats.monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number, name: string) => [name === "earnings" ? `£${value}` : value, name === "earnings" ? "Spend" : "Jobs"]}
                  />
                  <Bar dataKey="earnings" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} maxBarSize={32} name="earnings" />
                  <Bar dataKey="jobs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={32} name="jobs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Inspection Types</CardTitle>
            <p className="text-[11px] text-muted-foreground">Breakdown by category</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px]">
              {clientStats.inspectionTypeBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={clientStats.inspectionTypeBreakdown} dataKey="count" nameKey="type" cx="50%" cy="45%" outerRadius={60} innerRadius={30} paddingAngle={3} strokeWidth={0}>
                      {clientStats.inspectionTypeBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" iconSize={8} iconType="circle" formatter={(value) => <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>{value}</span>} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[11px] text-muted-foreground">No inspection data yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate("/book")}>
          <CardContent className="p-4">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
              <Briefcase className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-0.5">Book New Inspection</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Schedule an inventory, check-in, or check-out</p>
            <Button variant="outline" size="sm" className="w-full text-xs group">
              Book Now
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/jobs")}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-warning" />
              </div>
              {clientStats.upcomingInspections > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-bold">
                  {clientStats.upcomingInspections}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-0.5">Upcoming Jobs</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Inspections scheduled or in progress</p>
            <Button variant="outline" size="sm" className="w-full text-xs group">
              View Jobs
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/reports")}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              {clientStats.reportsToReview > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-bold">
                  {clientStats.reportsToReview}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-0.5">Reports to Review</h3>
            <p className="text-[11px] text-muted-foreground mb-3">Inspection reports awaiting your sign-off</p>
            <Button variant="outline" size="sm" className="w-full text-xs group">
              View Reports
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboardContent;
