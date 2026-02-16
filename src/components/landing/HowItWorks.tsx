const steps = [
  {
    number: "01",
    title: "Clients Post",
    description: "Submit job details and select your service tier.",
  },
  {
    number: "02",
    title: "Verified Clerks Accept",
    description: "Only approved professionals with performance history access jobs.",
  },
  {
    number: "03",
    title: "Structured Delivery",
    description: "Tier-based documentation standards ensure consistency.",
  },
  {
    number: "04",
    title: "Secure Payment Flow",
    description: "Funds are protected and released upon confirmed delivery.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-32 px-6 md:px-12 bg-card">
      <h2 className="font-display text-3xl md:text-[3rem] font-normal text-center text-foreground mb-20">
        How LISTD Works
      </h2>

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className="text-center px-6 py-8 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="font-display text-[3rem] text-primary/20 font-light mb-6">
              {step.number}
            </div>
            <h3 className="font-body text-xl font-semibold text-foreground mb-4">
              {step.title}
            </h3>
            <p className="text-[0.95rem] text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
