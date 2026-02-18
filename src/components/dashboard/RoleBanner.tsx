import { useAuth } from "@/hooks/useAuth";
import { Shield, User, Wrench } from "lucide-react";

const roleConfig = {
  client: {
    label: "Client",
    description: "Book and manage property inspections",
    icon: User,
    color: "bg-primary/10 text-primary border-primary/20",
  },
  clerk: {
    label: "Inventory Clerk",
    description: "View and accept assigned inspection jobs",
    icon: Wrench,
    color: "bg-accent/10 text-accent border-accent/20",
  },
  admin: {
    label: "Administrator",
    description: "Full platform management access",
    icon: Shield,
    color: "bg-warning/10 text-warning border-warning/20",
  },
};

const RoleBanner = () => {
  const { role } = useAuth();
  if (!role || !(role in roleConfig)) return null;

  const config = roleConfig[role as keyof typeof roleConfig];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      <span>Viewing as: {config.label}</span>
    </div>
  );
};

export default RoleBanner;
