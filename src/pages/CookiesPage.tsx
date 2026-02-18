import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const CookiesPage = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Cookie Policy – LISTD</title>
      <meta name="description" content="LISTD Cookie Policy. Learn about the cookies we use and how to manage your preferences." />
      <link rel="canonical" href="https://listd.co.uk/cookies" />
    </Helmet>
    <Header />

    <main className="pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-[820px] mx-auto">
        <h1 className="font-display text-4xl font-light text-foreground mb-2">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: February 2026</p>

        <div className="space-y-10 text-foreground">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. What Are Cookies?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files placed on your device when you visit a website. They help websites remember your preferences, keep you logged in, and understand how you use the site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Cookies We Use</h2>
            <div className="space-y-6">
              <div className="border border-border rounded-lg p-5">
                <h3 className="font-semibold text-foreground mb-2">Essential Cookies</h3>
                <p className="text-sm text-muted-foreground mb-3">Required for the platform to function. Cannot be disabled.</p>
                <div className="space-y-2">
                  {[
                    { name: "sb-auth-token", purpose: "Keeps you logged in to your LISTD account", duration: "Session" },
                    { name: "sb-refresh-token", purpose: "Refreshes your authentication session automatically", duration: "7 days" },
                  ].map((c) => (
                    <div key={c.name} className="grid grid-cols-[1fr_2fr_auto] gap-4 text-xs text-muted-foreground border-t border-border pt-2">
                      <code className="text-foreground font-mono">{c.name}</code>
                      <span>{c.purpose}</span>
                      <span>{c.duration}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-border rounded-lg p-5">
                <h3 className="font-semibold text-foreground mb-2">Analytics Cookies</h3>
                <p className="text-sm text-muted-foreground mb-3">Help us understand how visitors use the platform (anonymised). You can opt out.</p>
                <div className="space-y-2">
                  {[
                    { name: "_ga", purpose: "Google Analytics — tracks page views and sessions", duration: "2 years" },
                    { name: "_ga_*", purpose: "Google Analytics — session identifier", duration: "2 years" },
                  ].map((c) => (
                    <div key={c.name} className="grid grid-cols-[1fr_2fr_auto] gap-4 text-xs text-muted-foreground border-t border-border pt-2">
                      <code className="text-foreground font-mono">{c.name}</code>
                      <span>{c.purpose}</span>
                      <span>{c.duration}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-border rounded-lg p-5">
                <h3 className="font-semibold text-foreground mb-2">Functional Cookies</h3>
                <p className="text-sm text-muted-foreground mb-3">Remember your preferences and settings.</p>
                <div className="space-y-2">
                  {[
                    { name: "ui-theme", purpose: "Stores your light/dark mode preference", duration: "1 year" },
                  ].map((c) => (
                    <div key={c.name} className="grid grid-cols-[1fr_2fr_auto] gap-4 text-xs text-muted-foreground border-t border-border pt-2">
                      <code className="text-foreground font-mono">{c.name}</code>
                      <span>{c.purpose}</span>
                      <span>{c.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Managing Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You can control and delete cookies through your browser settings. Note that disabling essential cookies will prevent you from logging in or using core platform features.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              For browser-specific instructions, visit:{" "}
              <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">aboutcookies.org</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Third-Party Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Some features may load content from third parties (e.g. Google Maps, embedded widgets). These third parties may set their own cookies governed by their privacy policies. LISTD does not control these cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Updates</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Cookie Policy as our platform evolves. Check this page periodically for changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about our cookie use? Email <a href="mailto:support@listd.co.uk" className="text-primary hover:underline">support@listd.co.uk</a>.
            </p>
          </section>

        </div>
      </div>
    </main>

    <Footer />
  </div>
);

export default CookiesPage;
