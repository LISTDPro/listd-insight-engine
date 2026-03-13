import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
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
import { Home, Briefcase, Calendar, User, LogOut, Loader2 } from "lucide-react";

const clerkNav = [
  { title: "Home", url: "/clerk/dashboard", icon: Home },
  { title: "My Jobs", url: "/clerk/jobs", icon: Briefcase },
  { title: "Schedule", url: "/clerk/schedule", icon: Calendar },
  { title: "Profile", url: "/clerk/profile", icon: User },
];

const ClerkLayout = () => {
  const { user, profile, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || role !== "clerk")) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, role, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || role !== "clerk") return null;

  const initials = (profile?.full_name || user.email || "C")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarContent className="flex flex-col h-full">
            {/* Clerk identity */}
            <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || "Clerk"}
                </p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Nav links */}
            <SidebarGroup className="flex-1">
              <SidebarGroupContent>
                <SidebarMenu>
                  {clerkNav.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/clerk/dashboard"}
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

            {/* Logout */}
            <div className="p-3 border-t border-sidebar-border group-data-[collapsible=icon]:px-2">
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
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border px-4 bg-card">
            <SidebarTrigger className="mr-3" />
            <span className="text-sm font-medium text-foreground">LISTD — Clerk Portal</span>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ClerkLayout;
