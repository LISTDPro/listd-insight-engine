import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const PrivacyPage = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Privacy Policy – LISTD</title>
      <meta name="description" content="LISTD Privacy Policy. Learn how we collect, use, and protect your personal data in compliance with UK GDPR." />
      <link rel="canonical" href="https://listd.co.uk/privacy" />
    </Helmet>
    <Header />

    <main className="pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-[820px] mx-auto">
        <h1 className="font-display text-4xl font-light text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: February 2026</p>

        <div className="space-y-10 text-foreground">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Who We Are</h2>
            <p className="text-muted-foreground leading-relaxed">
              LISTD operates the property inventory platform at listd.co.uk. For the purposes of UK GDPR, LISTD is the data controller for personal information collected through this platform. Contact us at <a href="mailto:support@listd.co.uk" className="text-primary hover:underline">support@listd.co.uk</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Account data:</strong> Name, email address, phone number, company name.</li>
              <li><strong className="text-foreground">Professional data (clerks):</strong> Qualifications, verification documents, DBS information, professional indemnity insurance details.</li>
              <li><strong className="text-foreground">Property data:</strong> Property addresses, room counts, inspection details.</li>
              <li><strong className="text-foreground">Transaction data:</strong> Payment amounts, job history, payout records.</li>
              <li><strong className="text-foreground">Usage data:</strong> Log data, IP addresses, device information, page views.</li>
              <li><strong className="text-foreground">Communications:</strong> Messages exchanged on the platform, support enquiries.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>To provide and operate the LISTD platform.</li>
              <li>To verify clerk identity and professional qualifications.</li>
              <li>To process payments and manage escrow.</li>
              <li>To facilitate job matching, communication, and report delivery.</li>
              <li>To send service updates, notifications, and support responses.</li>
              <li>To comply with legal obligations.</li>
              <li>To improve our platform based on usage patterns (anonymised).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Legal Basis for Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We process your data on the following legal bases: (a) contract performance — to deliver the services you have signed up for; (b) legitimate interests — to operate and improve our platform; (c) legal obligation — where required by law; and (d) consent — where you have explicitly opted in.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We do not sell your data. We share data only where necessary:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Clerks:</strong> Property address and client instructions for assigned jobs.</li>
              <li><strong className="text-foreground">Clients:</strong> Assigned clerk name and contact information for booked jobs.</li>
              <li><strong className="text-foreground">Payment processors:</strong> For transaction processing only.</li>
              <li><strong className="text-foreground">Legal authorities:</strong> Where required by law or court order.</li>
              <li><strong className="text-foreground">Service providers:</strong> Hosting, email delivery, and support tools under data processing agreements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain personal data for as long as your account is active and for up to 7 years thereafter to comply with legal and financial obligations. Inspection reports may be retained for up to 10 years in line with property tenancy dispute requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">Under UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Access a copy of your personal data.</li>
              <li>Correct inaccurate data we hold about you.</li>
              <li>Request deletion of your data (subject to legal obligations).</li>
              <li>Object to processing or request restriction of processing.</li>
              <li>Data portability in a machine-readable format.</li>
              <li>Withdraw consent at any time where processing is based on consent.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise any of these rights, contact <a href="mailto:support@listd.co.uk" className="text-primary hover:underline">support@listd.co.uk</a>. You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies to operate the platform (session management, authentication). We may use analytics cookies to understand usage. See our <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a> for full details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organisational security measures to protect your data, including encryption in transit and at rest, access controls, and regular security reviews.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify registered users of material changes by email. Continued use of the platform after changes are published constitutes acceptance.
            </p>
          </section>

        </div>
      </div>
    </main>

    <Footer />
  </div>
);

export default PrivacyPage;
