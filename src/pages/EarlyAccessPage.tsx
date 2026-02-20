import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, Lock } from "lucide-react";
import listdLogo from "@/assets/listd-logo-dark.png";

const PORTFOLIO_SIZES = [
  "1–10 units",
  "11–50 units",
  "51–100 units",
  "101–250 units",
  "250+ units",
];

const MONTHLY_VOLUMES = [
  "1–5 inspections",
  "6–15 inspections",
  "16–30 inspections",
  "31–60 inspections",
  "60+ inspections",
];

const EarlyAccessPage = () => {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [portfolioSize, setPortfolioSize] = useState("");
  const [monthlyVolume, setMonthlyVolume] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !companyName.trim() || !email.trim() || !role) {
      setError("Please fill in all required fields.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    const { error: insertError } = await (supabase as any).from("waitlist_leads").insert({
      full_name: fullName.trim().slice(0, 100),
      company_name: companyName.trim().slice(0, 150),
      email: email.trim().toLowerCase().slice(0, 255),
      phone: phone.trim().slice(0, 30) || null,
      role,
      portfolio_size: portfolioSize || null,
      monthly_volume: monthlyVolume || null,
    });

    setSubmitting(false);

    if (insertError) {
      setError("Something went wrong. Please try again.");
      console.error("Waitlist insert error:", insertError);
    } else {
      setSubmitted(true);

      // Send confirmation email via edge function (fire and forget)
      try {
        await supabase.functions.invoke("send-contact-form", {
          body: {
            name: fullName.trim(),
            email: email.trim(),
            subject: "Early Access Request – LISTD",
            message: `Thank you for your interest in LISTD early access. We will be in touch shortly.\n\nCompany: ${companyName}\nRole: ${role}`,
          },
        });
      } catch (_) {
        // Non-critical
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Private Rollout – Early Access | LISTD</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Request early access to the LISTD platform." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <img src={listdLogo} alt="LISTD" className="h-7" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
              <Lock className="w-3 h-3" />
              Private Access Only
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-start justify-center px-4 py-12">
          <div className="w-full max-w-lg">
            {submitted ? (
              <div className="text-center space-y-4 py-12">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Request Received</h2>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                  Thank you for your interest. We will be in touch shortly to discuss your onboarding.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Header */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <Lock className="w-2.5 h-2.5" />
                    Private Rollout
                  </div>
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">Early Access</h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    We are currently onboarding a limited number of agencies while refining the platform.
                    Request early access below.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="full_name" className="text-xs font-medium">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="full_name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Smith"
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="company_name" className="text-xs font-medium">
                        Company Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="company_name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Acme Lettings Ltd"
                        maxLength={150}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-medium">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@company.com"
                        maxLength={255}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-medium">
                        Phone <span className="text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+44 7700 000000"
                        maxLength={30}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Role <span className="text-destructive">*</span>
                    </Label>
                    <Select value={role} onValueChange={setRole} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Agent">Agent</SelectItem>
                        <SelectItem value="Landlord">Landlord</SelectItem>
                        <SelectItem value="Block Manager">Block Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Portfolio Size</Label>
                      <Select value={portfolioSize} onValueChange={setPortfolioSize}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select range..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PORTFOLIO_SIZES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Monthly Inspection Volume</Label>
                      <Select value={monthlyVolume} onValueChange={setMonthlyVolume}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select range..." />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHLY_VOLUMES.map((v) => (
                            <SelectItem key={v} value={v}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Request Early Access"
                    )}
                  </Button>
                </form>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  No account or dashboard access is created by submitting this form.
                  Your details are used solely for onboarding purposes.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default EarlyAccessPage;
