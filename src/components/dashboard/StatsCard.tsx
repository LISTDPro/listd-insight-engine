import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon,
  iconColor = "bg-primary/10"
}: StatsCardProps) => {
  const changeColors = {
    positive: "text-success",
    negative: "text-accent",
    neutral: "text-muted-foreground",
  };

  return (
    <div className="p-5 bg-card rounded-xl border border-border hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="mt-1.5 text-2xl font-bold text-foreground tracking-tight">{value}</p>
          {change && (
            <p className={`mt-0.5 text-xs ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
