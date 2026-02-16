import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Building2, 
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  Shield
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import listdLogoWhite from "@/assets/listd-pro-green.png";

const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Briefcase, label: "Jobs", to: "/dashboard/jobs" },
  { icon: FileText, label: "Reports", to: "/dashboard/reports" },
  { icon: Building2, label: "Properties", to: "/dashboard/properties" },
  { icon: CreditCard, label: "Payments", to: "/dashboard/payments" },
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", to: "/dashboard/settings" },
  { icon: HelpCircle, label: "Help", to: "/dashboard/help" },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { signOut, role } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getFilteredNavItems = () => {
    if (role === "admin") {
      return [
        { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
        { icon: Shield, label: "Admin Panel", to: "/dashboard/admin" },
        { icon: Briefcase, label: "Jobs", to: "/dashboard/jobs" },
        { icon: FileText, label: "Reports", to: "/dashboard/reports" },
        { icon: CreditCard, label: "Payments", to: "/dashboard/payments" },
      ];
    }
    if (role === "clerk") {
      return mainNavItems
        .filter(item => ["Dashboard", "Jobs", "Reports", "Payments"].includes(item.label))
        .map(item => item.label === "Payments" ? { ...item, label: "Earnings" } : item);
    }
    // Provider role reserved for future SaaS expansion. Not active in Phase 1.
    return mainNavItems;
  };

  const filteredNavItems = getFilteredNavItems();

  return (
    <aside className={`${collapsed ? 'w-[72px]' : 'w-60'} h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 shrink-0`}>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center mx-auto">
            <span className="text-xs font-bold text-accent-foreground">L</span>
          </div>
        ) : (
          <img src={listdLogoWhite} alt="LISTD" className="h-5 w-auto" />
        )}
        {!collapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-sidebar-foreground/50 hover:bg-sidebar-accent h-7 w-7"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="px-2 pt-3 pb-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-full h-7 text-sidebar-foreground/50 hover:bg-sidebar-accent"
            onClick={() => setCollapsed(false)}
          >
            <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
          </Button>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-[13px] ${collapsed ? 'justify-center px-2' : ''}`}
            activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-[13px] ${collapsed ? 'justify-center px-2' : ''}`}
            activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
        <button 
          onClick={handleSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors text-[13px] ${collapsed ? 'justify-center px-2' : ''}`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
