import { Button } from "@/components/ui/button";
import { ClipboardList, FileCheck, ExternalLink } from "lucide-react";

const documents = [
  { icon: ClipboardList, title: "Work Order Form", description: "Manual inventory work order form for booking inspections", action: "Open Form", link: "https://forms.gle/7dz8Qy1RdRvC2X767", badge: null },
  { icon: FileCheck, title: "Terms of Business Agreement", description: "Client agreement form — required before first booking", action: "Sign Agreement", link: "https://forms.gle/oZZvtLZw4ztiy23j7", badge: "Mandatory" },
];

const HelpDocuments = () => (
  <div>
    <h2 className="text-sm font-semibold text-foreground mb-4">Documents & Forms</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {documents.map((d) => (
        <div key={d.title} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <d.icon className="w-5 h-5 text-accent" />
            </div>
            {d.badge && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                {d.badge}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-foreground">{d.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">{d.description}</p>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => window.open(d.link, "_blank")}>
            {d.action} <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  </div>
);

export default HelpDocuments;
