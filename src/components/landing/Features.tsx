import { ClipboardCheck, Layers, FileCheck, Lock, Camera, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import illustrationJobBoard from "@/assets/illustration-job-board.jpg";
import illustrationDashboard from "@/assets/illustration-dashboard-lifecycle.jpg";

const Features = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-6 space-y-32">
        {/* Block 1 — Left text, right rounded image */}
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div>
            <h2 className="text-3xl md:text-4xl font-light text-foreground tracking-tight leading-tight mb-4">
              Effortless usage from{" "}
              <br className="hidden md:block" />
              <span className="font-semibold">browser to mobile app</span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed max-w-md">
              Built for property professionals who work on-site. Enjoy a consistent user experience across phone, tablet and desktop devices.
            </p>
            <div className="flex flex-wrap gap-3">
              {["App screens", "Tablet screens", "Desktop screens"].map((label) => (
                <Button key={label} variant="outline" size="sm" className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="w-full max-w-md aspect-square rounded-[2rem] overflow-hidden shadow-elevated">
              <img
                src={illustrationJobBoard}
                alt="LISTD job board showing clerk assignments and status badges"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Block 2 — Left rounded image, right text */}
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className="relative flex justify-center order-2 lg:order-1">
            <div className="w-full max-w-md aspect-[4/3] rounded-[2rem] overflow-hidden shadow-elevated">
              <img
                src={illustrationDashboard}
                alt="LISTD dashboard showing job lifecycle tracking and clerk performance"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-light text-foreground tracking-tight leading-tight mb-4">
              Full visibility across{" "}
              <br className="hidden md:block" />
              <span className="font-semibold">every job lifecycle</span>
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed max-w-md">
              Track job status from posting to delivery. See clerk assignments, payment status, and delivery timelines — all from one dashboard.
            </p>
            <Button variant="accent" size="default" className="rounded-full px-6">
              Book a Demo
            </Button>
          </div>
        </div>

        {/* Feature grid */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              Why LISTD
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl font-light text-foreground tracking-tight">
              Built to reduce risk, <span className="font-semibold">not add complexity</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: ClipboardCheck, title: "Post & Match", description: "Submit job details and get matched with a verified clerk suited to the property and tier." },
              { icon: Layers, title: "Tiered Standards", description: "Choose your protection level — Flex, Core, or Priority — each with clear delivery expectations." },
              { icon: FileCheck, title: "Delivery Confirmation", description: "Reports delivered via InventoryBase. Clients review, accept, and sign off in-app." },
              { icon: Lock, title: "Escrow Payments", description: "Funds locked at booking, released on sign-off. No invoicing, no chasing." },
              { icon: Camera, title: "Performance Tracking", description: "Clerk ratings, strike system, and tier progression ensure consistent quality." },
              { icon: Smartphone, title: "Works Everywhere", description: "Manage jobs, review deliveries, and communicate with clerks from any device." },
            ].map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
