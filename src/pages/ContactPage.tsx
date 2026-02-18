import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MessageCircle, Calendar, CheckCircle2 } from "lucide-react";

const ContactPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-form", {
        body: form,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast({ title: "Failed to send", description: "Please try emailing us directly at support@listd.co.uk", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Contact LISTD – Get in Touch</title>
        <meta name="description" content="Contact the LISTD team. Chat with us live, send an email, or book a 15-minute walkthrough of the platform." />
        <link rel="canonical" href="https://listd.co.uk/contact" />
      </Helmet>
      <Header />

      <main className="pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl font-light text-foreground mb-4">
              Get in touch
            </h1>
            <p className="text-lg text-muted-foreground max-w-[480px] mx-auto">
              Whether you have questions, need a demo, or want to get started — we're here.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12">
            {/* Contact Options */}
            <div className="space-y-5">
              <a
                href="mailto:support@listd.co.uk"
                className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-0.5">Email Support</h3>
                  <p className="text-xs text-muted-foreground">support@listd.co.uk</p>
                  <p className="text-[11px] text-muted-foreground mt-1">24–48hr response</p>
                </div>
              </a>

              <a
                href="https://wa.me/447413065681"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card hover:border-[#25D366]/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-0.5">WhatsApp</h3>
                  <p className="text-xs text-muted-foreground">+44 7413 065681</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Business hours, Mon–Fri</p>
                </div>
              </a>

              <a
                href="tel:+447413065681"
                className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-0.5">Phone</h3>
                  <p className="text-xs text-muted-foreground">+44 7413 065681</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Business hours only</p>
                </div>
              </a>

              <a
                href="https://outlook.office365.com/book/listd"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm mb-0.5">Book a Walkthrough</h3>
                  <p className="text-xs text-muted-foreground">15-minute platform demo</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Free, no commitment</p>
                </div>
              </a>

              <div className="p-5 rounded-xl border border-border bg-muted/30">
                <p className="text-xs font-semibold text-foreground mb-1">Service Area</p>
                <p className="text-xs text-muted-foreground">Bristol, Bath, Swindon & surrounding areas. Expanding across the UK — contact us about your area.</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card border border-border rounded-xl p-8">
              {submitted ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-7 h-7 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-sm text-muted-foreground">We'll be in touch within 24–48 hours.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-foreground mb-6">Send us a message</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-xs font-medium">Name *</Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Your name"
                          className="mt-1.5"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-xs font-medium">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="your@email.com"
                          className="mt-1.5"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-xs font-medium">Company / Organisation</Label>
                      <Input
                        id="company"
                        value={form.company}
                        onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                        placeholder="Estate agency, landlord, etc."
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message" className="text-xs font-medium">Message *</Label>
                      <Textarea
                        id="message"
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        placeholder="Tell us how we can help..."
                        className="mt-1.5 min-h-[140px] resize-none"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send Message"}
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      By submitting this form you agree to our{" "}
                      <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
