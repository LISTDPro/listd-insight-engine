import { Building2, ClipboardList, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import propertyHandover from "@/assets/property-handover.jpg";

const roles = [
  {
    icon: Building2,
    title: "Clients",
    subtitle: "Letting Agents & Landlords",
    benefits: ["Post jobs in seconds", "Track clerk assignments", "Review & accept deliveries", "Escrow-backed payments"],
  },
  {
    icon: ClipboardList,
    title: "Clerks",
    subtitle: "Inventory Professionals",
    benefits: ["Browse available jobs", "Accept work that fits your schedule", "Earn per job with transparent payouts", "Build your rating & tier"],
  },
];

const Roles = () => {
  return (
    <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Left — Screenshots / Image */}
          <div className="relative flex justify-center">
            <div className="w-full max-w-md aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl">
              <img
                src={propertyHandover}
                alt="Property professionals reviewing inventory report"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right — Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight leading-tight mb-4">
              One platform,{" "}
              <span className="font-semibold">two roles</span>
            </h2>
            <p className="text-primary-foreground/60 mb-10">
              Tailored dashboards and permissions for every stakeholder.
            </p>

            <div className="space-y-6">
              {roles.map((role, index) => (
                <div key={index}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                      <role.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">{role.title}</h3>
                      <p className="text-xs text-primary-foreground/50">{role.subtitle}</p>
                    </div>
                  </div>
                  <div className="ml-[52px] flex flex-wrap gap-x-4 gap-y-1.5">
                    {role.benefits.map((benefit, i) => (
                      <span key={i} className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Button variant="accent" size="default" className="rounded-full px-6">
                Talk to us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Roles;
