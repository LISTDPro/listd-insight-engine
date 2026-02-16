import { Link } from "react-router-dom";
import dashboardScreenshot from "@/assets/dashboard-screenshot.png";

const Hero = () => {
  return (
    <section className="relative mt-[72px] min-h-[85vh] flex items-center py-24 px-6 md:px-12 overflow-hidden">
      {/* Decorative gradient circle */}
      <div
        className="absolute -top-1/2 -right-[20%] w-[800px] h-[800px] rounded-full animate-pulse pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(163 37% 27% / 0.03) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-[1400px] mx-auto w-full grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-24 items-center relative z-10">
        {/* Left — Text */}
        <div className="animate-fade-in">
          <h1 className="font-display text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] font-light leading-[1.15] text-foreground tracking-[-0.02em] mb-8">
            The clerk allocation
            <br />
            <strong className="font-semibold block">platform.</strong>
            Book. Assign. Deliver.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-12 max-w-[540px]">
            Post inventory jobs and get matched with verified, tier-rated clerks.
            Escrow-backed payments. Performance accountability. Zero chasing.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/auth"
              className="inline-block px-10 py-4 bg-primary text-primary-foreground font-medium text-base transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 relative overflow-hidden group"
            >
              <span className="relative z-10">Post a Job</span>
              <span className="absolute inset-0 bg-primary-foreground/10 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full" />
            </Link>
            <Link
              to="/auth"
              className="inline-block px-10 py-4 border-[1.5px] border-border text-foreground font-medium text-base transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              Apply as a Clerk
            </Link>
          </div>
        </div>

        {/* Right — Laptop with Dashboard Screenshot */}
        <div className="animate-fade-in [animation-delay:200ms]">
          <div className="w-full max-w-2xl mx-auto">
            {/* Laptop body */}
            <div className="rounded-t-xl border-[3px] border-foreground/80 bg-foreground/90 overflow-hidden shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 border-b border-border">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-md px-3 py-0.5 text-[8px] text-muted-foreground border border-border max-w-[200px]">
                    app.listd.co.uk/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard screenshot */}
              <img
                src={dashboardScreenshot}
                alt="LISTD Pro clerk dashboard showing earnings, charts, and job management"
                className="w-full h-auto block"
              />
            </div>

            {/* Laptop base */}
            <div className="mx-auto w-[110%] -ml-[5%] h-3 bg-foreground/80 rounded-b-xl" />
            <div className="mx-auto w-[30%] h-1 bg-foreground/60 rounded-b-lg" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
