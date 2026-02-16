import { Check, Shield, Zap, Crown, ArrowRight, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Tier {
  name: string;
  tagline: string;
  startingPrice: number;
  icon: typeof Shield;
  popular?: boolean;
  outcomes: string[];
  description: string;
  outdoorCoverage: string;
}

const tiers: Tier[] = [
  {
    name: "Flex",
    tagline: "Audit-ready reporting",
    startingPrice: 55,
    icon: Shield,
    description: "Human-led inspections with structured condition reports. Ideal for routine, low-risk properties.",
    outcomes: [
      "Audit-ready inventory reports",
      "Standard turnaround window",
      "Timestamped photo evidence",
      "Digital sign-off & audit trail",
    ],
    outdoorCoverage: "No outdoor or single overview only",
  },
  {
    name: "Core",
    tagline: "Complete property coverage",
    startingPrice: 70,
    icon: Zap,
    popular: true,
    description: "Full interior and exterior coverage with faster delivery for time-sensitive move-ins and move-outs.",
    outcomes: [
      "Everything in Flex",
      "One landscape exterior image",
      "Exterior description included",
      "Faster delivery window",
    ],
    outdoorCoverage: "One landscape image + description",
  },
  {
    name: "Priority",
    tagline: "Dispute-proof certainty",
    startingPrice: 100,
    icon: Crown,
    description: "Tribunal-grade reporting with full external documentation for high-risk properties.",
    outcomes: [
      "Everything in Core",
      "Full external documentation",
      "Close-up exterior photos",
      "Tribunal-grade evidence",
    ],
    outdoorCoverage: "Full external documentation + close-ups",
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-lg mx-auto mb-4">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">
            Inventory Packs
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-light text-foreground tracking-tight">
            Choose Your Level of <span className="font-semibold">Protection</span>
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pay for certainty, not rework. Clear scope, no grey areas.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mb-12 max-w-md mx-auto">
          Studio starting prices. Every tier scales by property size, furnishing, and additional areas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-14">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 ${
                tier.popular
                  ? "border-accent shadow-lg bg-card scale-[1.02]"
                  : "border-border bg-card hover:shadow-md"
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-accent" />
              )}

              <div className="p-7 flex-1 flex flex-col">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                  tier.popular ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                }`}>
                  <tier.icon className="w-5 h-5" />
                </div>

                <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{tier.tagline}</p>

                <div className="mt-5 mb-1">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">from</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-bold text-foreground">£{tier.startingPrice}</span>
                    <span className="text-xs text-muted-foreground">/ inspection</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mt-2 mb-4">
                  {tier.description}
                </p>

                <ul className="space-y-2.5 flex-1">
                  {tier.outcomes.map((outcome) => (
                    <li key={outcome} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="text-foreground">{outcome}</span>
                    </li>
                  ))}
                </ul>

                {/* Outdoor coverage */}
                <div className="mt-4 flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 rounded px-2.5 py-1.5">
                  <TreePine className="w-3 h-3 shrink-0" />
                  <span>Outdoor: {tier.outdoorCoverage}</span>
                </div>

                <Link to="/book" className="mt-6 block">
                  <Button
                    variant={tier.popular ? "accent" : "outline"}
                    size="default"
                    className="w-full group"
                  >
                    Get Started
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Need a bespoke quote for a large portfolio?{" "}
            <button className="text-primary font-medium hover:underline">Request a custom quote</button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
