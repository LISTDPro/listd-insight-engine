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
      "Essential written notes",
      "Full room context photography",
      "Standard damage capture",
      "Overview exterior documentation",
      "Basic meter context capture",
      "36–72 hour turnaround",
      "Standard 7-day sign-off window",
    ],
    documentation: "Structured Compliance",
    external: "Overview exterior documentation",
    turnaround: "36–72 hours",
  },
  core: {
    bullets: [
      "Structured condition ratings per item",
      "Context + damage framing photography",
      "Finger-scale damage reference",
      "Landscape exterior coverage",
      "Structured meter location noted",
      "24–36 hour turnaround",
      "Reminder notifications within 7-day sign window",
    ],
    documentation: "Enhanced Professional",
    external: "Landscape exterior coverage",
    turnaround: "24–36 hours",
  },
  priority: {
    bullets: [
      "Detailed narrative alignment",
      "Context + macro-level detailing",
      "Finger-scale + macro close-up documentation",
      "Multi-angle exterior + close-up coverage",
      "Multi-angle + clear meter location documentation",
      "Same day turnaround",
      "Accelerated sign-off (same day where tenant details provided)",
    ],
    documentation: "High Accountability",
    external: "Multi-angle exterior + close-up coverage",
    turnaround: "Same day",
  },
};

const COMPARISON_ROWS = [
  {
    label: "Written condition detail",
    flex: "Essential written notes", core: "Structured condition ratings per item", priority: "Detailed narrative alignment",
  },
  {
    label: "Photo evidence density",
    flex: "Full room context photography", core: "Context + damage framing photography", priority: "Context + macro-level detailing",
  },
  {
    label: "Damage scale verification",
    flex: "Standard damage capture", core: "Finger-scale damage reference", priority: "Finger-scale + macro close-up documentation",
  },
  {
    label: "Exterior documentation",
    flex: "Overview exterior documentation", core: "Landscape exterior coverage", priority: "Multi-angle exterior + close-up coverage",
  },
  {
    label: "Meter location documentation",
    flex: "Basic meter context capture", core: "Structured meter location noted", priority: "Multi-angle + clear meter location documentation",
  },
];

const TURNAROUND_ROW = {
  flex: "36–72 hours",
  core: "24–36 hours",
  priority: "Same day",
};

const SIGNOFF_ROW = {
  flex: "Standard 7-day sign-off window",
  core: "Reminder notifications within 7-day sign window",
  priority: "Accelerated sign-off (same day where tenant details provided)",
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
                  <p className="text-[11px] font-semibold text-foreground col-span-1">{row.label}</p>
                  {(["flex", "core", "priority"] as ServiceTier[]).map((tier) => (
                    <p key={tier} className="text-[10px] text-center text-muted-foreground">
                      {row[tier]}
                    </p>
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
              {/* Sign-off row */}
              <div className="px-3 py-2.5 grid grid-cols-4 gap-2 items-center bg-background">
                <p className="text-[11px] font-semibold text-foreground col-span-1">Sign-off Window</p>
                {(["flex", "core", "priority"] as ServiceTier[]).map((tier) => (
                  <p key={tier} className="text-[10px] text-center text-muted-foreground">
                    {SIGNOFF_ROW[tier]}
                  </p>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground border-t pt-3">
              All tiers are tribunal-ready, digitally signed, audit-trailed, and legally defensible.
              Tier selection determines the scope and depth of documentation, not the inspection process itself.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TierSummaryPanel;
