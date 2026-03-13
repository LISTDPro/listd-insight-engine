import { useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  Settings,
  ArrowLeft,
  Shield,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { title: "Overview", path: "/admin/super", icon: LayoutDashboard },
  { title: "Organisations", path: "/admin/super/organisations", icon: Building2 },
  { title: "Clerks", path: "/admin/super/clerks", icon: Users },
  { title: "Jobs", path: "/admin/super/jobs", icon: Briefcase },
  { title: "Settings", path: "/admin/super/settings", icon: Settings },
];

const SuperAdminLayout = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || !profile?.is_super_admin)) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  if (loading || !profile?.is_super_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-destructive" />
            <span className="text-sm font-bold tracking-wider text-destructive uppercase">
              Super Admin
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {profile?.full_name || user?.email}
          </p>
        </div>

        <Separator />

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.path === "/admin/super"
                ? location.pathname === "/admin/super"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default SuperAdminLayout;
