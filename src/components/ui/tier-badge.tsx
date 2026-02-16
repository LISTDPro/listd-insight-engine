import { Shield, Zap, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ServiceTier = "flex" | "core" | "priority";

const TIER_CONFIG: Record<ServiceTier, { label: string; icon: typeof Shield; className: string }> = {
  flex: {
    label: "Flex",
    icon: Shield,
    className: "bg-muted text-muted-foreground border-border",
  },
  core: {
    label: "Core",
    icon: Zap,
    className: "bg-warning/10 text-warning border-warning/30",
  },
  priority: {
    label: "Priority",
    icon: Crown,
    className: "bg-accent/10 text-accent border-accent/30",
  },
};

// Legacy mapping for old tier names
const LEGACY_MAP: Record<string, ServiceTier> = {
  standard: "flex",
  premium: "priority",
};

interface TierBadgeProps {
  tier: string | null | undefined;
  size?: "sm" | "default";
  className?: string;
}

const TierBadge = ({ tier, size = "default", className }: TierBadgeProps) => {
  const mapped = tier && LEGACY_MAP[tier] ? LEGACY_MAP[tier] : tier;
  const validTier = (mapped && mapped in TIER_CONFIG ? mapped : "flex") as ServiceTier;
  const config = TIER_CONFIG[validTier];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        size === "sm" ? "text-[10px] px-1.5 py-0 gap-0.5" : "text-[11px] gap-1",
        className
      )}
    >
      <Icon className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {config.label}
    </Badge>
  );
};

export default TierBadge;
