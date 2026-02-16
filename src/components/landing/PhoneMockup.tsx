import { CheckCircle2, Home, ClipboardList, FileText, CreditCard, Bell, ChevronRight } from "lucide-react";

const jobs = [
  { address: "14 Maple Road, SW1", type: "Check-In", status: "Completed", statusColor: "bg-emerald-500" },
  { address: "82 Elm Street, E2", type: "Inventory", status: "In Progress", statusColor: "bg-amber-500" },
  { address: "7 Oak Lane, N1", type: "Check-Out", status: "Scheduled", statusColor: "bg-blue-500" },
];

const PhoneMockup = () => (
  <div className="w-[220px] md:w-[260px] rounded-[2rem] border-[6px] border-foreground/90 bg-card shadow-2xl overflow-hidden">
    {/* Notch */}
    <div className="relative bg-foreground/90 h-6 flex items-center justify-center">
      <div className="w-16 h-3 bg-foreground rounded-b-xl" />
    </div>

    {/* Screen content */}
    <div className="p-3 space-y-3 min-h-[380px] md:min-h-[440px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">Good morning</p>
          <p className="text-xs font-bold text-foreground">Sarah Johnson</p>
        </div>
        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
          <Bell className="w-3 h-3 text-accent-foreground" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Active", value: "12" },
          { label: "Pending", value: "5" },
          { label: "Done", value: "84" },
        ].map((s) => (
          <div key={s.label} className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-foreground">{s.value}</p>
            <p className="text-[8px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        {[
          { icon: Home, label: "Properties" },
          { icon: ClipboardList, label: "Jobs" },
          { icon: FileText, label: "Reports" },
          { icon: CreditCard, label: "Payments" },
        ].map((a) => (
          <div key={a.label} className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg bg-accent/10">
            <a.icon className="w-3.5 h-3.5 text-accent" />
            <span className="text-[7px] text-muted-foreground">{a.label}</span>
          </div>
        ))}
      </div>

      {/* Jobs list */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-semibold text-foreground">Recent Jobs</p>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          {jobs.map((j) => (
            <div key={j.address} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background">
              <div className={`w-1.5 h-8 rounded-full ${j.statusColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-medium text-foreground truncate">{j.address}</p>
                <p className="text-[8px] text-muted-foreground">{j.type}</p>
              </div>
              <span className="text-[7px] font-medium text-muted-foreground shrink-0">{j.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Home indicator */}
    <div className="flex justify-center pb-1.5 pt-1">
      <div className="w-20 h-1 rounded-full bg-foreground/20" />
    </div>
  </div>
);

export default PhoneMockup;
