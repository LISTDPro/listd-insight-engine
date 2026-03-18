import { useAuth } from "@/hooks/useAuth";
import ClientJobsList from "@/components/dashboard/ClientJobsList";
import ClerkJobsList from "@/components/dashboard/ClerkJobsList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const JobsPage = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const isClient = role === "client";

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {isClient ? "My Jobs" : "Available Work"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isClient ? "View and manage your inventory bookings" : "View and accept inspection jobs"}
          </p>
        </div>
        {isClient && (
          <Button variant="accent" size="sm" onClick={() => navigate("/book")} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Book Inventory
          </Button>
        )}
      </div>

      {isClient && <ClientJobsList />}
      {role === "clerk" && <ClerkJobsList />}
    </div>
  );
};

export default JobsPage;
