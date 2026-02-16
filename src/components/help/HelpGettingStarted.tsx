const steps = [
  { num: "1", title: "Complete your profile", description: "Add your details and company information" },
  { num: "2", title: "Add your first property", description: "Register a property to book inspections" },
  { num: "3", title: "Book your first inventory", description: "Schedule an inspection and we'll handle the rest" },
];

const HelpGettingStarted = () => (
  <div className="rounded-xl border border-border bg-card p-6">
    <h2 className="text-sm font-semibold text-foreground mb-1">Getting Started Guide</h2>
    <p className="text-xs text-muted-foreground mb-5">New to LISTD? Follow these steps to get set up</p>

    <div className="space-y-4">
      {steps.map((s) => (
        <div key={s.num} className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
            {s.num}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{s.title}</p>
            <p className="text-xs text-muted-foreground">{s.description}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default HelpGettingStarted;
