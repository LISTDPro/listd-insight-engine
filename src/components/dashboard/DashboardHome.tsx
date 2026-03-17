import { useNavigate } from "react-router-dom";
import ClerkDashboardContent from "@/components/dashboard/ClerkDashboardContent";
import ClientDashboardContent from "@/components/dashboard/ClientDashboardContent";
import TermsAgreementModal from "@/components/dashboard/TermsAgreementModal";
import RoleBanner from "@/components/dashboard/RoleBanner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Briefcase, 
  Plus,
  Search,
} from "lucide-react";

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user, profile, role, signOut, refreshProfile } = useAuth();
  const { clientStats, clerkStats, loading: statsLoading } = useDashboardStats();

  const showTermsBanner = role === "client" && !profile?.terms_agreed_at;

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const getRoleLabel = () => {
    switch (role) {
      case "client": return "Client";
      case "clerk": return "Inventory Clerk";
      case "admin": return "Administrator";
      default: return "User";
    }
  };

  const getWelcomeMessage = () => {
    switch (role) {
      case "client": return "Here's what's happening with your inventories.";
      case "clerk": return "Your assigned inspections and tasks.";
      case "admin": return "Platform overview and management.";
      default: return "Welcome to your dashboard.";
    }
  };

  const getPrimaryAction = () => {
    switch (role) {
      case "client": return { label: "Book Inventory", icon: Plus, action: () => navigate("/book") };
      case "clerk": return { label: "Today's Jobs", icon: Briefcase, action: () => navigate("/dashboard/jobs") };
      case "admin": return { label: "Admin Panel", icon: Briefcase, action: () => navigate("/dashboard/admin") };
      default: return { label: "Get Started", icon: Plus, action: () => {} };
    }
  };

  const primaryAction = getPrimaryAction();

  return (
    <>
      {/* Top Bar */}
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search jobs, properties..."
              className="w-64 h-9 pl-9 pr-4 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RoleBanner />
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-[10px] font-semibold text-accent-foreground">{initials}</span>
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs font-medium text-foreground">{profile?.full_name}</div>
              <div className="text-[10px] text-muted-foreground">{getRoleLabel()}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 max-w-6xl mx-auto">
        {showTermsBanner && user && (
          <TermsAgreementModal userId={user.id} onAgreed={refreshProfile} />
        )}

        {/* Welcome */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Welcome back, {firstName}</h1>
            <p className="text-sm text-muted-foreground">
              {getWelcomeMessage()}
              {role === "clerk" && clerkStats.monthJobs > 0 && (
                <span className="ml-2 text-foreground font-medium">
                  This month: {clerkStats.monthJobs} jobs · £{clerkStats.monthEarnings.toFixed(0)} earned
                </span>
              )}
            </p>
          </div>
          <Button variant="accent" size="sm" className="gap-1.5" onClick={primaryAction.action}>
            <primaryAction.icon className="w-3.5 h-3.5" />
            {primaryAction.label}
          </Button>
        </div>

        {/* Role-specific content */}
        {role === "clerk" ? (
          <ClerkDashboardContent
            clerkStats={clerkStats}
            profile={profile}
            user={user}
            refreshProfile={refreshProfile}
          />
        ) : role === "admin" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/admin")}>
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                  <Briefcase className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Daily Checklist</h3>
                <p className="text-[11px] text-muted-foreground">Review pending jobs, deliveries, and payments</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/admin")}>
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Users & Verification</h3>
                <p className="text-[11px] text-muted-foreground">Manage users, approve clerks, handle disputes</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/dashboard/payments")}>
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mb-3">
                  <Plus className="w-5 h-5 text-success" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Payments</h3>
                <p className="text-[11px] text-muted-foreground">View escrow, release payments, export reports</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <ClientDashboardContent clientStats={clientStats} />
        )}
      </div>
    </>
  );
};

export default DashboardHome;
