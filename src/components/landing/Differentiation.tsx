const items = [
  {
    title: "Verified Network",
    description: "Every clerk is vetted before accessing work.",
  },
  {
    title: "Tier-Based Standards",
    description: "Clear documentation expectations from Flex to Priority.",
  },
  {
    title: "Escrow-Backed Protection",
    description: "Secure payment flow for both sides.",
  },
  {
    title: "Performance Accountability",
    description: "Ratings, strike system, structured progression.",
  },
];

const Differentiation = () => {
  return (
    <section className="py-32 px-6 md:px-12 bg-background">
      <div className="max-w-[1200px] mx-auto">
        <h2 className="font-display text-3xl md:text-[3rem] font-normal text-center text-foreground mb-16">
          Built for Control. Designed for Reliability.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 mt-16">
          {items.map((item, index) => (
            <div
              key={item.title}
              className={`relative p-12 transition-all duration-400 overflow-hidden group cursor-default
                ${index % 2 === 0 ? "border-r border-border md:border-r" : "md:border-r-0"}
                ${index < 2 ? "border-b border-border" : ""}
                hover:bg-card hover:translate-x-2.5
              `}
            >
              {/* Left accent bar on hover */}
              <div className="absolute top-0 left-0 w-[3px] h-0 bg-primary transition-all duration-400 group-hover:h-full" />

              <h3 className="font-body text-2xl font-semibold text-foreground mb-4">
                {item.title}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Differentiation;
