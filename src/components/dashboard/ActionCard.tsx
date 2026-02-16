import { LucideIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionCardProps {
  title: string;
  description: string;
  count: number;
  icon: LucideIcon;
  actionLabel: string;
  variant?: "default" | "warning" | "success";
  onAction?: () => void;
}

const ActionCard = ({
  title,
  description,
  count,
  icon: Icon,
  actionLabel,
  variant = "default",
  onAction,
}: ActionCardProps) => {
  const variantStyles = {
    default: {
      border: "border-border",
      countBg: "bg-primary/10 text-primary",
      iconBg: "bg-muted",
    },
    warning: {
      border: "border-border",
      countBg: "bg-warning/10 text-warning",
      iconBg: "bg-warning/5",
    },
    success: {
      border: "border-border",
      countBg: "bg-success/10 text-success",
      iconBg: "bg-success/5",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`p-5 bg-card rounded-xl border ${styles.border} hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-foreground/70" />
        </div>
        {count > 0 && (
          <span className={`px-2.5 py-0.5 rounded-full ${styles.countBg} text-xs font-bold`}>
            {count}
          </span>
        )}
      </div>
      
      <h3 className="text-sm font-semibold text-foreground mb-0.5">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{description}</p>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full group text-xs" 
        onClick={onAction}
      >
        {actionLabel}
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Button>
    </div>
  );
};

export default ActionCard;
