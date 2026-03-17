import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import BookJob from "./pages/BookJob";
import AcceptInvite from "./pages/AcceptInvite";
import ResetPassword from "./pages/ResetPassword";
import HowItWorksPage from "./pages/HowItWorksPage";
import ForClientsPage from "./pages/ForClientsPage";
import ForClerksPage from "./pages/ForClerksPage";
import ServiceTiersPage from "./pages/ServiceTiersPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import CookiesPage from "./pages/CookiesPage";
import NotFound from "./pages/NotFound";
import XeroCallback from "./pages/XeroCallback";
import EarlyAccessPage from "./pages/EarlyAccessPage";
import ConditionMapperPage from "./pages/inspection/ConditionMapperPage";
import ConditionReportPage from "./pages/inspection/ConditionReportPage";
import ClerkLayout from "./pages/clerk/ClerkLayout";
import ClerkHome from "./pages/clerk/ClerkHome";
import ClerkJobs from "./pages/clerk/ClerkJobs";
import ClerkSchedule from "./pages/clerk/ClerkSchedule";
import ClerkProfile from "./pages/clerk/ClerkProfile";
import TenantLayout from "./pages/tenant/TenantLayout";
import TenantHome from "./pages/tenant/TenantHome";
import TenantReport from "./pages/tenant/TenantReport";
import TenantDocuments from "./pages/tenant/TenantDocuments";
import BackToTop from "./components/ui/BackToTop";
import WhatsAppButton from "./components/ui/WhatsAppButton";
import SuperAdminLayout from "./pages/super-admin/SuperAdminLayout";
import SuperAdminOverview from "./pages/super-admin/SuperAdminOverview";
import SuperAdminOrganisations from "./pages/super-admin/SuperAdminOrganisations";
import SuperAdminClerks from "./pages/super-admin/SuperAdminClerks";
import SuperAdminJobs from "./pages/super-admin/SuperAdminJobs";
import SuperAdminSettings from "./pages/super-admin/SuperAdminSettings";
import OrgDashboard from "./pages/org/OrgDashboard";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/for-clients" element={<ForClientsPage />} />
              <Route path="/for-clerks" element={<ForClerksPage />} />
              <Route path="/service-tiers" element={<ServiceTiersPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiesPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/jobs/:jobId" element={<Dashboard />} />
              <Route path="/dashboard/reports/:jobId" element={<Dashboard />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/book" element={<BookJob />} />
              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/xero/callback" element={<XeroCallback />} />
              <Route path="/early-access" element={<EarlyAccessPage />} />
              <Route path="/inspection/:jobId/mapper" element={<ConditionMapperPage />} />
              <Route path="/inspection/:jobId/report" element={<ConditionReportPage />} />
              <Route path="/clerk" element={<ClerkLayout />}>
                <Route path="dashboard" element={<ClerkHome />} />
                <Route path="jobs" element={<ClerkJobs />} />
                <Route path="schedule" element={<ClerkSchedule />} />
                <Route path="profile" element={<ClerkProfile />} />
              </Route>
              <Route path="/tenant/portal" element={<TenantLayout />}>
                <Route index element={<TenantHome />} />
                <Route path="report/:reportId" element={<TenantReport />} />
                <Route path="documents" element={<TenantDocuments />} />
              </Route>
              <Route path="/org/dashboard" element={<OrgDashboard />} />
              <Route path="/admin/super" element={<SuperAdminLayout />}>
                <Route index element={<SuperAdminOverview />} />
                <Route path="organisations" element={<SuperAdminOrganisations />} />
                <Route path="clerks" element={<SuperAdminClerks />} />
                <Route path="jobs" element={<SuperAdminJobs />} />
                <Route path="settings" element={<SuperAdminSettings />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BackToTop />
            <WhatsAppButton />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

