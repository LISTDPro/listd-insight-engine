import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light text-foreground tracking-tight mb-4">
            Ready to simplify <span className="font-semibold">clerk allocation?</span>
          </h2>
          
          <p className="text-muted-foreground mb-10 max-w-md mx-auto">
            Join property professionals across the UK who trust LISTD for reliable, accountable inventory fulfilment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth">
              <Button variant="accent" size="lg" className="group rounded-full px-8 shadow-md font-semibold">
                Start Your Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="rounded-full px-8 border-foreground/20">
              Book a Demo
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">No card details required</p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
