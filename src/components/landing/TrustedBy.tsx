const partners = [
  {
    name: "Andrews",
    subtitle: "Property Group",
    type: "client" as const,
  },
  {
    name: "Inventory Hive",
    subtitle: "",
    type: "integration" as const,
  },
  {
    name: "InventoryBase",
    subtitle: "",
    type: "integration" as const,
  },
];

const TrustedBy = () => {
  return (
    <section className="py-10 border-b border-border bg-background">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Trusted by leading UK property professionals
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="flex flex-col items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity duration-300"
              >
                <span className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                  {partner.name}
                </span>
                {partner.subtitle && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {partner.subtitle}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
