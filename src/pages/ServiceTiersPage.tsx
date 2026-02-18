import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Link } from "react-router-dom";
import { Check, X, Shield, Zap, Crown, ArrowRight, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers = [
  { key: "flex", name: "Flex", icon: Shield, price: 55 },
  { key: "core", name: "Core", icon: Zap, price: 70, popular: true },
  { key: "priority", name: "Priority", icon: Crown, price: 100 },
];

type FeatureRow = { label: string; flex: boolean | string; core: boolean | string; priority: boolean | string };

const features: FeatureRow[] = [
  { label: "Room-by-room checklist", flex: true, core: true, priority: true },
  { label: "Timestamped photo evidence", flex: true, core: true, priority: true },
  { label: "Condition ratings per item", flex: true, core: true, priority: true },
  { label: "Digital sign-off & audit trail", flex: true, core: true, priority: true },
  { label: "Meter readings & keys", flex: true, core: true, priority: true },
  { label: "Exterior overview photo", flex: false, core: true, priority: true },
  { label: "Exterior description", flex: false, core: true, priority: true },
  { label: "Full external documentation", flex: false, core: false, priority: true },
  { label: "Close-up exterior photos", flex: false, core: false, priority: true },
  { label: "Tribunal-grade evidence", flex: false, core: false, priority: true },
  { label: "Turnaround", flex: "Standard", core: "Faster", priority: "Priority" },
  { label: "Outdoor coverage", flex: "None / single", core: "1 landscape", priority: "Full + close-ups" },
];

const renderCell = (val: boolean | string) => {
  if (val === true) return <Check className="w-4 h-4 text-primary mx-auto" />;
  if (val === false) return <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-xs text-foreground">{val}</span>;
};

const ServiceTiersPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Inspection Service Tiers – Flex, Core & Priority | LISTD</title>
        <meta name="description" content="Compare LISTD service tiers — Flex, Core and Priority. Every tier includes room-by-room checklists, timestamped photo evidence and digital sign-off. Choose the right level for your portfolio." />
        <meta property="og:title" content="Inspection Service Tiers – Flex, Core & Priority | LISTD" />
        <meta property="og:description" content="Choose from Flex, Core or Priority inspection tiers. All plans include verified clerks, digital reports and secure escrow payments." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://listd.co.uk/service-tiers" />
        <link rel="canonical" href="https://listd.co.uk/service-tiers" />
      </Helmet>
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 md:px-12 bg-primary text-primary-foreground">
        <div className="max-w-[900px] mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/50 mb-4 block font-body">
            Inventory Packs
          </span>
          <h1 className="font-display text-4xl md:text-[3.5rem] font-light leading-tight mb-6">
            Choose Your Level of Protection
          </h1>
          <p className="text-xl text-primary-foreground/70 leading-relaxed max-w-[600px] mx-auto">
            Pay for certainty, not rework. Clear scope, no grey areas. Every tier scales by property size and furnishing.
          </p>
        </div>
      </section>

      {/* Tier Cards */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {tiers.map((tier) => (
            <div
              key={tier.key}
              className={`relative flex flex-col p-8 border bg-card transition-shadow ${
                tier.popular ? "border-accent shadow-card-hover" : "border-border hover:shadow-card-hover"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1">
                  Most Popular
                </span>
              )}
              <div className={`w-11 h-11 flex items-center justify-center mb-4 ${
                tier.popular ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              }`}>
                <tier.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-foreground">{tier.name}</h3>
              <div className="mt-3 mb-6">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">from</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-3xl font-bold text-foreground font-body">£{tier.price}</span>
                  <span className="text-xs text-muted-foreground">/ inspection</span>
                </div>
              </div>
              <Link to="/book" className="mt-auto">
                <Button
                  variant={tier.popular ? "default" : "outline"}
                  className="w-full group"
                >
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-display text-2xl font-normal text-foreground text-center mb-8">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 font-body font-semibold text-foreground">Feature</th>
                  {tiers.map((t) => (
                    <th key={t.key} className="text-center py-3 px-4 font-body font-semibold text-foreground w-[120px]">
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((row) => (
                  <tr key={row.label} className="border-b border-border/50">
                    <td className="py-3 pr-4 text-muted-foreground">{row.label}</td>
                    <td className="py-3 px-4 text-center">{renderCell(row.flex)}</td>
                    <td className="py-3 px-4 text-center">{renderCell(row.core)}</td>
                    <td className="py-3 px-4 text-center">{renderCell(row.priority)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-8">
            Studio starting prices shown. Every tier scales by property size, furnishing level, and additional areas.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServiceTiersPage;
