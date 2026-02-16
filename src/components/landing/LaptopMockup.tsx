import { BarChart3, Users, FileText, TrendingUp, CheckCircle2, Clock, Calendar } from "lucide-react";

const recentJobs = [
  { property: "14 Maple Road, SW1", type: "Check-In", clerk: "James O.", date: "04 Feb", status: "Completed", color: "bg-emerald-500" },
  { property: "82 Elm Street, E2", type: "Inventory", clerk: "Priya S.", date: "05 Feb", status: "In Progress", color: "bg-amber-500" },
  { property: "7 Oak Lane, N1", type: "Check-Out", clerk: "Adaeze O.", date: "06 Feb", status: "Scheduled", color: "bg-blue-500" },
  { property: "23 Pine Ave, W4", type: "Interim", clerk: "Marcus T.", date: "07 Feb", status: "Pending", color: "bg-muted-foreground" },
];

const LaptopMockup = () => (
  <div className="w-full max-w-2xl mx-auto">
    {/* Laptop body */}
    <div className="rounded-t-xl border-[3px] border-foreground/80 bg-card overflow-hidden shadow-2xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 border-b border-border">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-background rounded-md px-3 py-0.5 text-[8px] text-muted-foreground border border-border max-w-[200px]">
            app.listd.co.uk/dashboard
          </div>
        </div>
      </div>

      {/* App content */}
      <div className="flex min-h-[240px]">
        {/* Sidebar */}
        <div className="w-36 bg-primary p-3 space-y-3 shrink-0">
          <div className="text-primary-foreground font-bold text-xs tracking-tight mb-4">LISTD</div>
          {[
            { icon: BarChart3, label: "Dashboard", active: true },
            { icon: FileText, label: "Jobs", active: false },
            { icon: Users, label: "Properties", active: false },
            { icon: TrendingUp, label: "Reports", active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[9px] ${
                item.active
                  ? "bg-primary-foreground/15 text-primary-foreground font-medium"
                  : "text-primary-foreground/50"
              }`}
            >
              <item.icon className="w-3 h-3" />
              {item.label}
            </div>
          ))}
        </div>

        {/* Main area */}
        <div className="flex-1 p-4 space-y-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">Dashboard</p>
              <p className="text-[8px] text-muted-foreground">Welcome back, Sarah</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: CheckCircle2, label: "Completed", value: "84", color: "text-emerald-500" },
              { icon: Clock, label: "In Progress", value: "12", color: "text-amber-500" },
              { icon: Calendar, label: "Scheduled", value: "5", color: "text-blue-500" },
              { icon: TrendingUp, label: "This Month", value: "£4,280", color: "text-accent" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border p-2">
                <stat.icon className={`w-3 h-3 ${stat.color} mb-1`} />
                <p className="text-sm font-bold text-foreground">{stat.value}</p>
                <p className="text-[7px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-5 gap-1 px-2 py-1 bg-muted/40 text-[7px] font-semibold text-muted-foreground">
              <span>Property</span><span>Type</span><span>Clerk</span><span>Date</span><span>Status</span>
            </div>
            {recentJobs.map((job) => (
              <div key={job.property} className="grid grid-cols-5 gap-1 px-2 py-1.5 border-t border-border text-[8px] text-foreground">
                <span className="truncate">{job.property}</span>
                <span>{job.type}</span>
                <span>{job.clerk}</span>
                <span>{job.date}</span>
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${job.color}`} />
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Laptop base */}
    <div className="mx-auto w-[110%] -ml-[5%] h-3 bg-foreground/80 rounded-b-xl" />
    <div className="mx-auto w-[30%] h-1 bg-foreground/60 rounded-b-lg" />
  </div>
);

export default LaptopMockup;
