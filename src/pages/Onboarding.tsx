import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ClipboardCheck, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import listdLogo from "@/assets/listd-pro-green.png";

type RoleOption = "client" | "clerk";

interface RoleCardProps {
  role: RoleOption;
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}

const RoleCard = ({ role, title, description, features, icon, selected, onSelect }: RoleCardProps) => (
  <button
    type="button"
    onClick={onSelect}
    className={`relative w-full text-left p-6 rounded-xl border-2 transition-all duration-200 ${
      selected
        ? "border-accent bg-accent/10 shadow-lg"
        : "border-border bg-card hover:border-accent/50 hover:shadow-md"
    }`}
  >
    {selected && (
      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
        <Check className="w-4 h-4 text-accent-foreground" />
      </div>
    )}
    
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
      selected ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
    }`}>
      {icon}
    </div>
    
    <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground mb-4">{description}</p>
    
    <ul className="space-y-2">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2 text-sm text-foreground">
          <Check className={`w-4 h-4 ${selected ? "text-accent" : "text-muted-foreground"}`} />
          {feature}
        </li>
      ))}
    </ul>
  </button>
);

const roles: { role: RoleOption; title: string; description: string; features: string[]; icon: React.ReactNode }[] = [
  {
    role: "client",
    title: "Client",
    description: "Letting agents, landlords, and property managers who need inventory services.",
    features: [
      "Book inventory jobs",
      "Approve reports & release payment",
      "Track all your properties",
      "Access tribunal-ready documentation",
    ],
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    role: "clerk",
    title: "Inventory Clerk",
    description: "Professionals who conduct property inspections and create reports.",
    features: [
      "View assigned jobs",
      "Mobile-first inspection tools",
      "AI-assisted photo capture",
      "Submit detailed reports",
    ],
    icon: <ClipboardCheck className="w-6 h-6" />,
  },
];

const Onboarding = () => {
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, profile, loading, setRole, completeOnboarding, refreshProfile } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    // If already has role and completed onboarding, go to dashboard
    if (!loading && role && profile?.onboarding_completed) {
      navigate("/dashboard");
    }
    // If has role but hasn't completed onboarding, pre-select the role
    if (role && !profile?.onboarding_completed) {
      setSelectedRole(role as RoleOption);
    }
  }, [user, role, profile, loading, navigate]);

  const handleContinue = async () => {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description: "Choose how you'll use LISTD to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Set role if not already set
    if (!role) {
      const { error: roleError } = await setRole(selectedRole);
      if (roleError) {
        toast({
          title: "Error setting role",
          description: roleError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    // Complete onboarding
    const { error: onboardingError } = await completeOnboarding();
    if (onboardingError) {
      toast({
        title: "Error completing setup",
        description: onboardingError.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Refresh profile to ensure auth context is up-to-date before navigating
    await refreshProfile();

    toast({
      title: "Welcome to LISTD!",
      description: `Your ${selectedRole} account is ready.`,
    });

    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-primary-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <img src={listdLogo} alt="LISTD" className="h-10 mx-auto mb-8" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            How will you use LISTD?
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-xl mx-auto">
            Select your role to personalise your experience. You can change this later in settings.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-2xl mx-auto">
          {roles.map((roleOption) => (
            <RoleCard
              key={roleOption.role}
              {...roleOption}
              selected={selectedRole === roleOption.role}
              onSelect={() => setSelectedRole(roleOption.role)}
            />
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            variant="hero"
            size="lg"
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            className="min-w-[200px]"
          >
            {isLoading ? (
              "Setting up..."
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
