import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

const TermsPage = () => (
  <div className="min-h-screen bg-background">
    <Helmet>
      <title>Terms of Service – LISTD</title>
      <meta name="description" content="LISTD Terms of Service. Read our platform rules, user obligations, payment terms, and dispute resolution procedures." />
      <link rel="canonical" href="https://listd.co.uk/terms" />
    </Helmet>
    <Header />

    <main className="pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-[820px] mx-auto">
        <h1 className="font-display text-4xl font-light text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: February 2026</p>

        <div className="prose prose-sm max-w-none space-y-10 text-foreground">

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. About LISTD</h2>
            <p className="text-muted-foreground leading-relaxed">
              LISTD ("we", "our", "the platform") is a property inventory management platform that connects clients (letting agents, landlords, and property managers) with verified inventory clerks. By registering or using LISTD, you agree to these Terms of Service in full. If you do not agree, you must not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. User Accounts & Eligibility</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>You must be at least 18 years old and able to form a legally binding contract.</li>
              <li>You must provide accurate, complete, and up-to-date information during registration.</li>
              <li>You are responsible for keeping your account credentials secure.</li>
              <li>LISTD reserves the right to suspend or terminate accounts that violate these terms.</li>
              <li>Clerks must complete identity verification and onboarding before accessing live jobs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Platform Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Circumvent the platform to engage in private arrangements with clerks or clients found through LISTD.</li>
              <li>Provide false information, impersonate others, or misrepresent qualifications.</li>
              <li>Use the platform for any unlawful purpose.</li>
              <li>Interfere with the platform's operation or security.</li>
              <li>Resell access or share your account with third parties.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Booking & Job Acceptance</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Clients submit job requests which are published to eligible clerks on the platform.</li>
              <li>Jobs are matched based on clerk tier, availability, and location.</li>
              <li>Once a clerk accepts a job, both parties are contractually obligated to fulfil it.</li>
              <li>LISTD reserves the right to reassign jobs in cases of clerk cancellation or non-performance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Payment & Escrow</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Clients pay the agreed job price upon booking confirmation.</li>
              <li>Funds are held in escrow by LISTD until the client accepts the delivered report.</li>
              <li>Clerk payouts are released within the timeframe stated in the platform after client sign-off.</li>
              <li>LISTD retains a platform service fee from each transaction.</li>
              <li>Cancellation fees may apply based on how close to the job date the cancellation occurs.</li>
              <li>Refunds are issued at LISTD's discretion following dispute resolution.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Service Tiers</h2>
            <p className="text-muted-foreground leading-relaxed">
              LISTD operates a tiered service structure (Flex, Pro, Elite) with corresponding quality standards and pricing. The service tier selected at booking determines the standards the assigned clerk must meet. Clients must select the appropriate tier for their property requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Clerk Conduct & Standards</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Clerks must hold appropriate qualifications and professional indemnity insurance.</li>
              <li>Clerks must attend jobs punctually and deliver inspection reports to the agreed standard.</li>
              <li>Clerks who fail to meet standards may receive strikes. Three active strikes may result in suspension.</li>
              <li>Clerks must sign a Non-Circumvention Agreement before accessing live jobs.</li>
              <li>Clerks progress through levels (1–5) based on jobs completed and client ratings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Disputes</h2>
            <p className="text-muted-foreground leading-relaxed">
              All disputes must be raised through the LISTD platform within 7 days of report delivery. LISTD will review evidence from all parties and issue a resolution. LISTD's decision on disputes is final unless the matter is escalated to a competent court of jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Non-Circumvention</h2>
            <p className="text-muted-foreground leading-relaxed">
              All users agree not to engage in direct commercial transactions with other users discovered through LISTD, outside of the platform, for a period of 24 months from the last platform-managed interaction. Breach of this agreement may result in account termination and legal action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All platform content, software, branding, and design is the intellectual property of LISTD. You may not copy, reproduce, or distribute any part of the platform without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              LISTD acts as an intermediary platform. To the fullest extent permitted by law, LISTD shall not be liable for indirect, consequential, or incidental damages arising from the use of the platform. Our total liability shall not exceed the fees paid by you in the preceding 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">12. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              LISTD reserves the right to suspend or terminate any account at its discretion for breach of these terms. Users may close their account at any time by contacting support. Outstanding jobs or payment obligations must be resolved before account closure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">14. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For queries about these Terms, contact us at{" "}
              <a href="mailto:support@listd.co.uk" className="text-primary hover:underline">support@listd.co.uk</a>.
            </p>
          </section>

        </div>
      </div>
    </main>

    <Footer />
  </div>
);

export default TermsPage;
