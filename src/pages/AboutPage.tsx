import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Shield, Users, Lock, Scale, AlertTriangle, CheckCircle2, Eye } from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "Verified Professionals",
    description: "Every clerk passes identity verification, qualification checks, and a probationary period before accessing live jobs.",
  },
  {
    icon: Lock,
    title: "Escrow-Secured Payments",
    description: "Client funds are held in escrow from job acceptance. Clerks are guaranteed payment on approved delivery.",
  },
  {
    icon: Scale,
    title: "Fair Dispute Resolution",
    description: "Structured dispute process with admin oversight. Every party is heard, evidence is reviewed, and resolutions are documented.",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description: "Every action is timestamped and tracked. Clients, clerks, and providers have complete visibility into job progress.",
  },
  {
    icon: AlertTriangle,
    title: "Strike & Accountability System",
    description: "Clerks who fall below standards receive strikes with clear severity levels. Persistent issues lead to temporary or permanent suspension.",
  },
  {
    icon: Users,
    title: "Non-Circumvention Agreement",
    description: "All parties agree to operate within the platform, protecting the network and ensuring fair compensation for everyone.",
  },
];

const safety = [
  "Identity verification for all users",
  "DBS check documentation for clerks",
  "Professional indemnity insurance requirements",
  "Performance-based level progression",
  "Client review and rating system",
  "Admin-managed dispute resolution",
  "Automated escrow payment protection",
  "Non-circumvention agreements",
  "Real-time job status tracking",
  "Audit trail on every action",
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About LISTD – Our Mission & Values</title>
        <meta name="description" content="LISTD is building the UK's most trusted property inspection platform — verified clerks, escrow-secured payments, and full audit trails to protect landlords, tenants and agents." />
        <meta property="og:title" content="About LISTD – Our Mission & Values" />
        <meta property="og:description" content="Learn about LISTD's mission to bring transparency, accountability and trust to the UK property inspection industry." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://listd.co.uk/about" />
        <link rel="canonical" href="https://listd.co.uk/about" />
      </Helmet>
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 md:px-12 bg-primary text-primary-foreground">
        <div className="max-w-[900px] mx-auto text-center">
          <h1 className="font-display text-4xl md:text-[3.5rem] font-light leading-tight mb-6">
            About LISTD
          </h1>
          <p className="text-xl text-primary-foreground/70 leading-relaxed max-w-[650px] mx-auto">
            Professional infrastructure for the UK property inventory sector. Structured processes, verified professionals, and secure payments — replacing fragmented workflows with controlled delivery.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-[700px] mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block font-body">
            Our Mission
          </span>
          <h2 className="font-display text-3xl font-normal text-foreground mb-6">
            Controlled infrastructure, not gig-economy chaos
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            LISTD exists to bring professional standards to property inventory services. We connect letting agents and landlords with verified inspection professionals through a structured, tier-based system that ensures consistent quality, fair pricing, and secure payment flows.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6 md:px-12 bg-card border-t border-border">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="font-display text-3xl font-normal text-foreground text-center mb-14">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div
                key={v.title}
                className="p-8 bg-background border border-border animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-11 h-11 bg-primary/10 flex items-center justify-center mb-5">
                  <v.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {v.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-display text-3xl font-normal text-foreground text-center mb-4">
            Trust & Safety
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Every layer of LISTD is designed to protect all parties.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {safety.map((item) => (
              <div key={item} className="flex items-start gap-3 p-3">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
