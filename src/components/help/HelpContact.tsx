import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, Phone, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const contacts = [
  { icon: Mail, title: "Email Support", description: "support@listd.co.uk", availability: "24–48hr response", action: "Send Email", onClick: () => { window.location.href = "mailto:support@listd.co.uk"; } },
  { icon: MessageCircle, title: "WhatsApp", description: "+44 7413 065681", availability: "Business hours, Mon–Fri", action: "Chat Now", onClick: () => window.open("https://wa.me/447413065681", "_blank") },
  { icon: Phone, title: "Phone", description: "+44 7413 065681", availability: "Business hours only", action: "Call Us", onClick: () => { window.location.href = "tel:+447413065681"; } },
  { icon: Calendar, title: "Book a Walkthrough", description: "15-minute platform demo", availability: "Free, no commitment", action: "Book Now", onClick: () => window.open("https://outlook.office365.com/book/listd", "_blank") },
];

const HelpContact = () => (
  <div>
    <h2 className="text-sm font-semibold text-foreground mb-4">Contact Support</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {contacts.map((c) => (
        <div key={c.title} className="rounded-xl border border-border bg-card p-5">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
            <c.icon className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 mb-4">{c.availability}</p>
          <Button variant="outline" size="sm" className="text-xs" onClick={c.onClick}>
            {c.action}
          </Button>
        </div>
      ))}
    </div>
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground mb-2">Want to send a detailed message?</p>
      <Link to="/contact">
        <Button variant="accent" size="sm" className="text-xs">Open Contact Form</Button>
      </Link>
    </div>
  </div>
);

export default HelpContact;

