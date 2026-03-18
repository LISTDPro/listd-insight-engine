import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import DashboardHome from "@/components/dashboard/DashboardHome";
import PropertiesPage from "@/pages/dashboard/PropertiesPage";
import JobsPage from "@/pages/dashboard/JobsPage";
import JobDetailPage from "@/pages/dashboard/JobDetailPage";
import ReportsPage from "@/pages/dashboard/ReportsPage";
import ReportReviewPage from "@/pages/dashboard/ReportReviewPage";
import PaymentsPage from "@/pages/dashboard/PaymentsPage";
import SettingsPage from "@/pages/dashboard/SettingsPage";
import HelpPage from "@/pages/dashboard/HelpPage";
import AdminPage from "@/pages/dashboard/AdminPage";
import TeamPage from "@/pages/dashboard/TeamPage";
import NotificationDropdown from "@/components/dashboard/NotificationDropdown";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, role, loading, signOut } = useAuth();

  // Redirect if not authenticated or onboarding not complete
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (!role || !profile?.onboarding_completed) {
        navigate("/onboarding");
      } else if (role === "clerk") {
        navigate("/clerk/dashboard", { replace: true });
      }
    }
  }, [user, role, profile, loading, navigate]);

  // Show nothing during loading to prevent flash - Auth page handles the loading UI
  if (loading || !user || !role || !profile?.onboarding_completed) {
    return null;
  }

  // Determine which sub-page to render
  const getContent = () => {
    const path = location.pathname;

    if (path === "/dashboard/admin" || path.startsWith("/dashboard/admin/")) {
      return <AdminPage />;
    }
    if (path === "/dashboard/properties") {
      return <PropertiesPage />;
    }
    if (path === "/dashboard/jobs") {
      return <JobsPage />;
    }
    // Job detail page with dynamic ID
    if (path.startsWith("/dashboard/jobs/")) {
      return <JobDetailPage />;
    }
    if (path === "/dashboard/reports") {
      return <ReportsPage />;
    }
    if (path.startsWith("/dashboard/reports/")) {
      return <ReportReviewPage />;
    }
    if (path === "/dashboard/payments") {
      return <PaymentsPage />;
    }
    if (path === "/dashboard/team") {
      return <TeamPage />;
    }
    if (path === "/dashboard/settings") {
      return <SettingsPage />;
    }
    if (path === "/dashboard/help") {
      return <HelpPage />;
    }
    
    // Default: Dashboard home
    return <DashboardHome />;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Dashboard header with notification bell */}
        <header className="h-12 flex items-center justify-end border-b border-border px-4 bg-card shrink-0">
          <NotificationDropdown />
        </header>
        <main className="flex-1 overflow-auto">
          {getContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
