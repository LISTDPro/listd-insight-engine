import { useState } from "react";
import { Check, ExternalLink, Shield, Zap, Crown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SERVICE_TIERS, ServiceTier } from "@/components/booking/TierSelector";
import { cn } from "@/lib/utils";

// Detailed scope data per tier (UI layer only — no pricing)
const TIER_SCOPE: Record<ServiceTier, { bullets: string[]; documentation: string; external: string; turnaround: string }> = {
  flex: {
    bullets: [
      "Room-by-room checklist",
      "Timestamped photo evidence",
      "Digital sign-off & audit trail",
      "Standard turnaround",
      "Limited external documentation",
      "No close-up exterior photography",
    ],
    documentation: "Standard",
    external: "No outdoor or single overview only",
    turnaround: "Standard",
  },
  core: {
    bullets: [
      "Everything in Flex",
      "Condition ratings per item",
      "Exterior overview photo",
      "Expanded documentation",
      "Faster turnaround",
    ],
    documentation: "Enhanced",
    external: "One landscape image + description",
    turnaround: "Faster",
  },
  priority: {
    bullets: [
      "Everything in Core",
      "Full external documentation",
      "Close-up exterior photos",
      "Tribunal-grade documentation standard",
      "Priority turnaround",
    ],
    documentation: "Comprehensive",
    external: "Full external documentation + close-ups",
    turnaround: "Priority",
  },
};

const COMPARISON_ROWS = [
  {
    label: "Room-by-room checklist",
    flex: true, core: true, priority: true,
  },
  {
    label: "Timestamped photo evidence",
    flex: true, core: true, priority: true,
  },
  {
    label: "Digital sign-off & audit trail",
    flex: true, core: true, priority: true,
  },
  {
    label: "Condition ratings per item",
    flex: false, core: true, priority: true,
  },
  {
    label: "Exterior overview photo",
    flex: false, core: true, priority: true,
  },
  {
    label: "Expanded documentation",
    flex: false, core: true, priority: true,
  },
  {
    label: "Full external documentation",
    flex: false, core: false, priority: true,
  },
  {
    label: "Close-up exterior photos",
    flex: false, core: false, priority: true,
  },
  {
    label: "Tribunal-grade evidence standard",
    flex: false, core: false, priority: true,
  },
];

const TURNAROUND_ROW = {
  flex: "Standard",
  core: "Faster",
  priority: "Priority",
};

interface TierSummaryPanelProps {
  selectedTier: ServiceTier;
}

const TierSummaryPanel = ({ selectedTier }: TierSummaryPanelProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const tierConfig = SERVICE_TIERS.find((t) => t.value === selectedTier)!;
  const scope = TIER_SCOPE[selectedTier];
  const Icon = tierConfig.icon;

  const tierAccentClass: Record<ServiceTier, string> = {
    flex: "border-muted-foreground/20 bg-muted/30",
    core: "border-warning/30 bg-warning/5",
    priority: "border-accent/30 bg-accent/5",
  };

  const iconClass: Record<ServiceTier, string> = {
    flex: "bg-muted text-muted-foreground",
    core: "bg-warning/10 text-warning",
    priority: "bg-accent/10 text-accent",
  };

  return (
    <>
      <div className={cn("mt-4 rounded-lg border p-4 space-y-3", tierAccentClass[selectedTier])}>
        <div className="flex items-center gap-2">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", iconClass[selectedTier])}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">{tierConfig.label} — What's Included</p>
            <p className="text-[10px] text-muted-foreground">{tierConfig.tagline}</p>
          </div>
        </div>

        <ul className="space-y-1.5">
          {scope.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              {bullet}
            </li>
          ))}
        </ul>

        <Button
          variant="ghost"
          size="sm"
          className="text-[11px] h-7 px-2 gap-1 text-primary hover:text-primary"
          onClick={() => setModalOpen(true)}
        >
          <ExternalLink className="w-3 h-3" />
          View Full Tier Conditions
          <ChevronRight className="w-3 h-3" />
        </Button>
      </div>

      {/* Full Tier Comparison Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Full Tier Conditions — Coverage Comparison
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Tier headers */}
            <div className="grid grid-cols-4 gap-2">
              <div /> {/* empty label col */}
              {SERVICE_TIERS.map((tier) => {
                const TIcon = tier.icon;
                return (
                  <div
                    key={tier.value}
                    className={cn(
                      "rounded-lg p-3 text-center border",
                      tier.value === selectedTier
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/20"
                    )}
                  >
                    <TIcon className="w-4 h-4 mx-auto mb-1 text-primary" />
                    <p className="text-xs font-semibold text-foreground">{tier.label}</p>
                    <p className="text-[10px] text-muted-foreground">{tier.tagline}</p>
                    {tier.value === selectedTier && (
                      <span className="text-[9px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 mt-1 inline-block font-semibold">
                        Selected
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Scope rows */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 grid grid-cols-4 gap-2">
                <p className="text-[11px] font-semibold text-foreground col-span-1">Feature</p>
                <p className="text-[11px] font-semibold text-foreground text-center">Flex</p>
                <p className="text-[11px] font-semibold text-foreground text-center">Core</p>
                <p className="text-[11px] font-semibold text-foreground text-center">Priority</p>
              </div>
              {COMPARISON_ROWS.map((row, i) => (
                <div
                  key={row.label}
                  className={cn(
                    "px-3 py-2.5 grid grid-cols-4 gap-2 items-center",
                    i % 2 === 0 ? "bg-background" : "bg-muted/20"
                  )}
                >
                  <p className="text-[11px] text-foreground col-span-1">{row.label}</p>
                  {(["flex", "core", "priority"] as ServiceTier[]).map((tier) => (
                    <div key={tier} className="flex justify-center">
                      {row[tier] ? (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <span className="w-3.5 h-3.5 flex items-center justify-center">
                          <span className="text-muted-foreground/40 text-[10px]">—</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {/* Turnaround row */}
              <div className="px-3 py-2.5 grid grid-cols-4 gap-2 items-center bg-muted/30">
                <p className="text-[11px] font-semibold text-foreground col-span-1">Turnaround</p>
                {(["flex", "core", "priority"] as ServiceTier[]).map((tier) => (
                  <p key={tier} className="text-[11px] text-center font-medium text-foreground">
                    {TURNAROUND_ROW[tier]}
                  </p>
                ))}
              </div>
              {/* External coverage row */}
              <div className="px-3 py-2.5 grid grid-cols-4 gap-2 items-center bg-background">
                <p className="text-[11px] font-semibold text-foreground col-span-1">Outdoor Coverage</p>
                {SERVICE_TIERS.map((tier) => (
                  <p key={tier.value} className="text-[10px] text-center text-muted-foreground">
                    {tier.outdoorCoverage}
                  </p>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground border-t pt-3">
              All tiers include human-led inspections with timestamped, digitally signed reports. 
              Tier selection determines the scope and depth of documentation, not the inspection process itself.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TierSummaryPanel;
