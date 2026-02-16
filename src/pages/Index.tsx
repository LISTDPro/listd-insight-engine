import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Differentiation from "@/components/landing/Differentiation";
import Footer from "@/components/landing/Footer";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <HowItWorks />
      <Differentiation />

      {/* For Clients */}
      <section id="for-clients" className="py-32 px-6 md:px-12 bg-card">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-display text-3xl md:text-[3rem] font-normal text-foreground mb-6">
            For Agencies & Landlords
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed mb-12">
            Scale fulfilment without sacrificing control.
            <br />
            Allocate jobs confidently through a structured, performance-tracked network.
          </p>
          <Link
            to="/auth"
            className="inline-block px-10 py-4 bg-primary text-primary-foreground font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
          >
            Create Client Account
          </Link>
        </div>
      </section>

      {/* For Clerks — Dark section */}
      <section id="for-clerks" className="py-32 px-6 md:px-12 bg-foreground text-background">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="font-display text-3xl md:text-[3rem] font-normal text-background mb-6">
            For Professional Clerks
          </h2>
          <p className="text-xl text-background/70 leading-relaxed mb-12">
            Join a structured allocation network.
            <br />
            Access consistent work. Progress through levels. Get paid securely.
          </p>
          <Link
            to="/auth"
            className="inline-block px-10 py-4 bg-background text-foreground font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-background/20"
          >
            Apply to Join
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
