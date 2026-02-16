import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, Phone } from "lucide-react";

const contacts = [
  { icon: MessageCircle, title: "Live Chat", description: "Chat with our support team", availability: "Mon–Fri, 9am–6pm", action: "Start Chat", onClick: () => window.open("https://listd.co.uk/chat", "_blank") },
  { icon: Mail, title: "Email Support", description: "support@listd.co.uk", availability: "24–48hr response", action: "Send Email", onClick: () => { window.location.href = "mailto:support@listd.co.uk"; } },
  { icon: Phone, title: "Phone Support", description: "Speak directly with our team", availability: "Business hours only", action: "Call Us", onClick: () => { window.location.href = "tel:+441234567890"; } },
];

const HelpContact = () => (
  <div>
    <h2 className="text-sm font-semibold text-foreground mb-4">Contact Support</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
  </div>
);

export default HelpContact;
