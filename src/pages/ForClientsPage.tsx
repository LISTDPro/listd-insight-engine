import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Building2, Clock, Shield, Eye, FileText, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Clock,
    title: "Book in Seconds",
    description: "Submit property details, select your tier, and post a job — all in under two minutes.",
  },
  {
    icon: Shield,
    title: "Verified Professionals",
    description: "Every clerk is verified, performance-tracked, and held to tier-specific quality standards.",
  },
  {
    icon: Eye,
    title: "Full Visibility",
    description: "Track every job from posting to payment. See real-time status updates and timeline events.",
  },
  {
    icon: FileText,
    title: "Structured Reports",
    description: "Receive consistent, audit-ready reports with timestamped photos and condition ratings.",
  },
  {
    icon: CreditCard,
    title: "Escrow Protection",
    description: "Funds are held securely and only released when you approve the completed report.",
  },
  {
    icon: Building2,
    title: "Portfolio Management",
    description: "Manage all your properties in one place. Re-book inspections with a single click.",
  },
];

const ForClientsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 md:px-12 bg-primary text-primary-foreground">
        <div className="max-w-[900px] mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/50 mb-4 block font-body">
            For Agencies & Landlords
          </span>
          <h1 className="font-display text-4xl md:text-[3.5rem] font-light leading-tight mb-6">
            Scale Fulfilment Without Sacrificing Control
          </h1>
          <p className="text-xl text-primary-foreground/70 leading-relaxed max-w-[600px] mx-auto">
            Allocate jobs confidently through a structured, performance-tracked network of verified inventory professionals.
          </p>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <div
                key={benefit.title}
                className="p-8 bg-card border border-border animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-11 h-11 bg-primary/10 flex items-center justify-center mb-5">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works for clients */}
      <section className="py-20 px-6 md:px-12 bg-card border-t border-border">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display text-3xl font-normal text-foreground text-center mb-12">
            Your Workflow
          </h2>
          <div className="space-y-6">
            {[
              "Add your properties with room counts and furnishing details",
              "Select an inspection type and service tier",
              "A verified clerk accepts and completes the inspection",
              "Review the report, add comments, and digitally sign off",
              "Payment is released from escrow automatically",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-body text-sm font-semibold">
                  {i + 1}
                </div>
                <p className="text-foreground pt-1">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 md:px-12 bg-primary text-primary-foreground">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="font-display text-3xl font-normal mb-4">
            Start posting jobs today
          </h2>
          <p className="text-primary-foreground/70 mb-8">
            No subscription. Pay per inspection. Full control.
          </p>
          <Link to="/auth">
            <Button className="bg-background text-foreground hover:bg-background/90 px-8 py-3 group">
              Create Client Account
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ForClientsPage;
