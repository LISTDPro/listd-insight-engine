import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Adaeze Okonkwo",
    role: "Senior Property Manager",
    company: "Balfour Lettings, Birmingham",
    quote: "LISTD has transformed how we handle check-outs. The AI-assisted capture means fewer disputes and our clerks complete reports 40% faster.",
    initials: "AO",
  },
  {
    name: "Marcus Thompson",
    role: "Landlord",
    company: "12 Properties, Manchester",
    quote: "Having tribunal-ready reports gives me peace of mind. The digital sign-off process has saved countless hours of back-and-forth.",
    initials: "MT",
  },
  {
    name: "Priya Sharma",
    role: "Operations Director",
    company: "CityView Estates, London",
    quote: "We switched from paper inventories and the difference is night and day. Full audit trails, timestamped photos, and instant report generation.",
    initials: "PS",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">
            Testimonials
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl font-light text-foreground tracking-tight">
            Trusted by UK <span className="font-semibold">property professionals</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-md transition-shadow duration-300 flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-sm text-foreground/80 leading-relaxed flex-1 mb-6">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                  {testimonial.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  <div className="text-[10px] text-muted-foreground">{testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
