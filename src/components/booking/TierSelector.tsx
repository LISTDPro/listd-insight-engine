import { Shield, Zap, Crown, Check, TreePine } from "lucide-react";
import { cn } from "@/lib/utils";

export type ServiceTier = "flex" | "core" | "priority";

export interface TierConfig {
  value: ServiceTier;
  label: string;
  tagline: string;
  icon: typeof Shield;
  popular?: boolean;
  startingPrice: number;
  outcomes: string[];
  outdoorCoverage: string;
}

export const SERVICE_TIERS: TierConfig[] = [
  {
    value: "flex",
    label: "Flex",
    tagline: "Structured Compliance",
    icon: Shield,
    startingPrice: 60,
    outcomes: [
      "Essential written notes",
      "Full room context photography",
      "Standard damage capture",
      "36–72 hour turnaround",
    ],
    outdoorCoverage: "Overview exterior documentation",
  },
  {
    value: "core",
    label: "Core",
    tagline: "Enhanced Professional",
    icon: Zap,
    popular: true,
    startingPrice: 70,
    outcomes: [
      "Structured condition ratings per item",
      "Context + damage framing photography",
      "Finger-scale damage reference",
      "24–36 hour turnaround",
    ],
    outdoorCoverage: "Landscape exterior coverage",
  },
  {
    value: "priority",
    label: "Priority",
    tagline: "High Accountability",
    icon: Crown,
    startingPrice: 90,
    outcomes: [
      "Detailed narrative alignment",
      "Context + macro-level detailing",
      "Finger-scale + macro close-up documentation",
      "Same day turnaround",
    ],
    outdoorCoverage: "Multi-angle exterior + close-up coverage",
  },
];

export const TIER_LABELS: Record<ServiceTier, string> = {
  flex: "Flex",
  core: "Core",
  priority: "Priority",
};

interface TierSelectorProps {
  selectedTier: ServiceTier;
  onSelect: (tier: ServiceTier) => void;
}

const TierSelector = ({ selectedTier, onSelect }: TierSelectorProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Choose Service Level</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select the level of coverage and turnaround you need.
        </p>
      </div>

      <div className="space-y-2">
        {SERVICE_TIERS.map((tier) => {
          const Icon = tier.icon;
          const isSelected = selectedTier === tier.value;

          return (
            <div
              key={tier.value}
              onClick={() => onSelect(tier.value)}
              className={cn(
                "relative p-4 rounded-lg border cursor-pointer transition-all",
                isSelected
                   ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                   : "border-border hover:border-primary/30 bg-card",
                 tier.popular && !isSelected && "border-primary/20"
              )}
            >
              {tier.popular && (
                <span className="absolute -top-2 right-3 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  Popular
                </span>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                     isSelected
                       ? "bg-primary text-primary-foreground"
                       : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-semibold text-foreground">{tier.label}</h4>
                    <span className="text-[10px] text-muted-foreground">— {tier.tagline}</span>
                    <span className="text-[10px] font-semibold text-primary ml-auto">from £{tier.startingPrice}/job</span>
                  </div>

                  <ul className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {tier.outcomes.map((outcome) => (
                      <li key={outcome} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Check className="w-2.5 h-2.5 text-primary shrink-0" />
                        {outcome}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    <TreePine className="w-3 h-3 shrink-0" />
                    <span>Outdoor: {tier.outdoorCoverage}</span>
                  </div>
                </div>

                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                    isSelected
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-accent-foreground" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TierSelector;
