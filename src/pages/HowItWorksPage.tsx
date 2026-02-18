import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up as a client or clerk. Complete your profile with company details, qualifications, and verification documents.",
    details: [
      "Clients: Add your agency details and properties",
      "Clerks: Upload qualifications and pass verification",
      "Providers: Set up your team and coverage areas",
    ],
  },
  {
    number: "02",
    title: "Post or Accept Jobs",
    description: "Clients submit job details with property info and preferred tier. Verified clerks receive notifications and accept available work.",
    details: [
      "Select property, inspection type, and service tier",
      "Set preferred date and time slot",
      "Jobs are matched to qualified clerks in your area",
    ],
  },
  {
    number: "03",
    title: "Structured Inspection",
    description: "Clerks follow tier-specific checklists with guided photo capture, condition ratings, and room-by-room documentation.",
    details: [
      "Step-by-step room checklists with item categories",
      "Timestamped photo evidence for every item",
      "Condition ratings: Excellent → Damaged scale",
      "Meter readings, keys, and alarm checks",
    ],
  },
  {
    number: "04",
    title: "Report Review & Sign-off",
    description: "Clients review the completed report, add comments, and digitally sign off. The clerk acknowledges and the job moves to payment.",
    details: [
      "Full report preview with photos and condition notes",
      "Client comments and approval workflow",
      "Digital signatures from both parties",
    ],
  },
  {
    number: "05",
    title: "Secure Payment Release",
    description: "Funds held in escrow are released automatically upon confirmed delivery, protecting both parties throughout the process.",
    details: [
      "Escrow holds funds from job acceptance",
      "Auto-release after client sign-off",
      "Transparent fee breakdown for all parties",
    ],
  },
];

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>How LISTD Works – Book, Inspect, Report & Pay</title>
        <meta name="description" content="See how LISTD works: create an account, post or accept jobs, complete structured inspections, and receive tribunal-ready reports with secure escrow payments — all in one platform." />
        <meta property="og:title" content="How LISTD Works – Book, Inspect, Report & Pay" />
        <meta property="og:description" content="From booking to report delivery in a structured workflow. Verified clerks, digital checklists, timestamped evidence and escrow-secured payments." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://listd.co.uk/how-it-works" />
        <link rel="canonical" href="https://listd.co.uk/how-it-works" />
      </Helmet>
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 md:px-12 bg-primary text-primary-foreground">
        <div className="max-w-[900px] mx-auto text-center">
          <h1 className="font-display text-4xl md:text-[3.5rem] font-light leading-tight mb-6">
            How LISTD Works
          </h1>
          <p className="text-xl text-primary-foreground/70 leading-relaxed max-w-[600px] mx-auto">
            From posting a job to receiving a tribunal-ready report — every step is structured, tracked, and secure.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-[800px] mx-auto space-y-20">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-16 bottom-0 w-px bg-border hidden md:block" />
              )}
              <div className="flex gap-8">
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center font-display text-lg font-semibold">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-2xl md:text-3xl font-normal text-foreground mb-3">
                    {step.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-5">
                    {step.description}
                  </p>
                  <ul className="space-y-2">
                    {step.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 md:px-12 bg-card border-t border-border">
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="font-display text-3xl font-normal text-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-8">
            Create your account and post your first job in minutes.
          </p>
          <Link to="/auth">
            <Button className="bg-primary text-primary-foreground px-8 py-3 group">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorksPage;
