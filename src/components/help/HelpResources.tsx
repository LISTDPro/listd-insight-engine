import { Button } from "@/components/ui/button";
import { Book, Video, HelpCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const resources = [
  { icon: Video, title: "Video Tutorials", description: "Step-by-step walkthroughs", action: "Watch Videos", link: "https://www.youtube.com/@listduk", external: true },
  { icon: HelpCircle, title: "FAQs", description: "Answers to common questions", action: "Browse FAQs", link: "/help/faqs", external: false },
  { icon: Book, title: "Getting Started", description: "Learn how to use the platform", action: "View Guide", link: "/help", external: false },
];

const HelpResources = () => (
  <div>
    <h2 className="text-sm font-semibold text-foreground mb-4">Resources</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {resources.map((r) => (
        <div key={r.title} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
            <r.icon className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">{r.description}</p>
          {r.external ? (
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => window.open(r.link, "_blank")}>
              {r.action} <ExternalLink className="w-3 h-3" />
            </Button>
          ) : (
            <Link to={r.link}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                {r.action}
              </Button>
            </Link>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default HelpResources;
