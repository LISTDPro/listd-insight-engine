import { useAuth } from "@/hooks/useAuth";
import ClientJobsList from "@/components/dashboard/ClientJobsList";
import ClerkJobsList from "@/components/dashboard/ClerkJobsList";
import ProviderJobsList from "@/components/dashboard/provider/ProviderJobsList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const JobsPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const getPageTitle = () => {
    switch (role) {
      case "client":
        return { title: "My Jobs", subtitle: "View and manage your inventory bookings" };
      case "clerk":
        return { title: "Available Work", subtitle: "View and accept inspection jobs" };
      case "provider":
        return { title: "Job Management", subtitle: "Manage incoming jobs and assign clerks" };
      default:
        return { title: "Jobs", subtitle: "View your jobs" };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {role === "client" && (
          <Button variant="accent" size="sm" onClick={() => navigate("/book")} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Book Inventory
          </Button>
        )}
      </div>

      {role === "client" && <ClientJobsList />}
      {role === "clerk" && <ClerkJobsList />}
      {role === "provider" && <ProviderJobsList />}
      
    </div>
  );
};

export default JobsPage;
