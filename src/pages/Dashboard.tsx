import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Home,
  Briefcase,
  FileText,
  Building2,
  CreditCard,
  Users,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
  Loader2,
} from "lucide-react";
import NotificationDropdown from "@/components/dashboard/NotificationDropdown";
import RoleBanner from "@/components/dashboard/RoleBanner";
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
import listdLogo from "@/assets/listd-pro-green.png";

const clientNav = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Jobs", url: "/dashboard/jobs", icon: Briefcase },
  { title: "Reports", url: "/dashboard/reports", icon: FileText },
  { title: "Properties", url: "/dashboard/properties", icon: Building2 },
  { title: "Payments", url: "/dashboard/payments", icon: CreditCard },
];

const adminNav = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Admin Panel", url: "/dashboard/admin", icon: Shield },
  { title: "Jobs", url: "/dashboard/jobs", icon: Briefcase },
  { title: "Reports", url: "/dashboard/reports", icon: FileText },
  { title: "Payments", url: "/dashboard/payments", icon: CreditCard },
];

const bottomNav = [
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
  { title: "Help", url: "/dashboard/help", icon: HelpCircle },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, role, loading, signOut, orgRole } = useAuth();

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

  if (loading || !user || !role || !profile?.onboarding_completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const initials = (profile?.full_name || user.email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Build nav items based on role
  const getNavItems = () => {
    if (role === "admin") return adminNav;
    // Client
    const items = [...clientNav];
    if (orgRole === "owner" || orgRole === "admin") {
      const propsIdx = items.findIndex((i) => i.title === "Properties");
      items.splice(propsIdx + 1, 0, { title: "Team", url: "/dashboard/team", icon: Users });
      items.push({ title: "Team View", url: "/org/dashboard", icon: Building2 });
    }
    if (orgRole === "staff") {
      return items.filter((i) => i.title !== "Payments");
    }
    return items;
  };

  const navItems = getNavItems();

  const getContent = () => {
    const path = location.pathname;
    if (path === "/dashboard/admin" || path.startsWith("/dashboard/admin/")) return <AdminPage />;
    if (path === "/dashboard/properties") return <PropertiesPage />;
    if (path === "/dashboard/jobs") return <JobsPage />;
    if (path.startsWith("/dashboard/jobs/")) return <JobDetailPage />;
    if (path === "/dashboard/reports") return <ReportsPage />;
    if (path.startsWith("/dashboard/reports/")) return <ReportReviewPage />;
    if (path === "/dashboard/payments") return <PaymentsPage />;
    if (path === "/dashboard/team") return <TeamPage />;
    if (path === "/dashboard/settings") return <SettingsPage />;
    if (path === "/dashboard/help") return <HelpPage />;
    return <DashboardHome />;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarContent className="flex flex-col h-full">
            {/* Identity block */}
            <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Main nav */}
            <SidebarGroup className="flex-1">
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/dashboard"}
                          className="hover:bg-sidebar-accent/50"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Bottom nav */}
            <div className="border-t border-sidebar-border">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {bottomNav.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            className="hover:bg-sidebar-accent/50"
                            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                          >
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <div className="p-3 group-data-[collapsible=icon]:px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                </Button>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-border px-4 bg-card">
            <div className="flex items-center">
              <SidebarTrigger className="mr-3" />
              <img src={listdLogo} alt="LISTD" className="h-4 w-auto" />
            </div>
            <div className="flex items-center gap-3">
              <RoleBanner />
              <NotificationDropdown />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto bg-muted/30">
            {getContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
