import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ClipboardList, TrendingUp, CreditCard, Star, Shield, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: ClipboardList,
    title: "Structured Checklists",
    description: "Follow guided, room-by-room inspection flows with built-in item categories and condition ratings.",
  },
  {
    icon: TrendingUp,
    title: "Level Progression",
    description: "Start at Level 1 and progress through levels as you complete jobs and maintain high ratings.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Funds are held in escrow from the moment a job is accepted. Get paid reliably on every job.",
  },
  {
    icon: Star,
    title: "Build Your Reputation",
    description: "Earn ratings and reviews from clients. Higher ratings unlock access to better-paying priority jobs.",
  },
  {
    icon: Shield,
    title: "Professional Standards",
    description: "LISTD's tier system ensures clear expectations. Know exactly what's required before you start.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Tools",
    description: "Complete inspections on any device with photo capture, digital signatures, and offline-ready forms.",
  },
];

const levels = [
  { level: 1, name: "Trainee", jobs: "0–5", access: "Flex tier only, supervised jobs" },
  { level: 2, name: "Junior", jobs: "6–20", access: "Flex + Core tiers" },
  { level: 3, name: "Standard", jobs: "21–50", access: "All tiers, independent work" },
  { level: 4, name: "Senior", jobs: "51–100", access: "Priority jobs, mentoring access" },
  { level: 5, name: "Expert", jobs: "100+", access: "All tiers, tribunal-grade reports" },
];

const ForClerksPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 md:px-12 bg-primary text-primary-foreground">
        <div className="max-w-[900px] mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/50 mb-4 block font-body">
            For Inspection Professionals
          </span>
          <h1 className="font-display text-4xl md:text-[3.5rem] font-light leading-tight mb-6">
            Join a Structured Allocation Network
          </h1>
          <p className="text-xl text-primary-foreground/70 leading-relaxed max-w-[600px] mx-auto">
            Access consistent work. Progress through levels. Get paid securely on every job.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              className="p-8 bg-card border border-border animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-11 h-11 bg-primary/10 flex items-center justify-center mb-5">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {b.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Progression Levels */}
      <section className="py-20 px-6 md:px-12 bg-card border-t border-border">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-display text-3xl font-normal text-foreground text-center mb-4">
            Clerk Progression Levels
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Your performance determines your access. Complete jobs and maintain quality to advance.
          </p>
          <div className="space-y-3">
            {levels.map((l) => (
              <div
                key={l.level}
                className="flex items-center gap-4 p-4 border border-border bg-background"
              >
                <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center font-body text-sm font-bold shrink-0">
                  L{l.level}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-body font-semibold text-foreground">{l.name}</span>
                    <span className="text-xs text-muted-foreground">({l.jobs} jobs)</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{l.access}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 md:px-12 bg-primary text-primary-foreground">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="font-display text-3xl font-normal mb-4">
            Apply to join the network
          </h2>
          <p className="text-primary-foreground/70 mb-8">
            Verification takes 24–48 hours. Start accepting jobs as soon as you're approved.
          </p>
          <Link to="/auth">
            <Button className="bg-background text-foreground hover:bg-background/90 px-8 py-3 group">
              Apply to Join
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ForClerksPage;
