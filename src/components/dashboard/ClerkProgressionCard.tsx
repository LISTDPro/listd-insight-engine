import { Shield, Star, TrendingUp, Lock, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CLERK_LEVELS,
  getClerkLevel,
  getNextLevelRequirements,
  getProgressToNextLevel,
} from "@/utils/clerkProgression";

interface ClerkProgressionCardProps {
  jobsCompleted: number;
  rating: number;
  currentLevel: number;
}

const ClerkProgressionCard = ({
  jobsCompleted,
  rating,
  currentLevel,
}: ClerkProgressionCardProps) => {
  const levelConfig = getClerkLevel(jobsCompleted, rating);
  const nextLevel = getNextLevelRequirements(levelConfig.level);
  const progress = getProgressToNextLevel(levelConfig.level, jobsCompleted, rating);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Current Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-lg">
              {levelConfig.badge}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {levelConfig.title}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Level {levelConfig.level} • {levelConfig.description}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">
            Lvl {levelConfig.level}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
              <TrendingUp className="w-3 h-3" />
              Jobs Completed
            </div>
            <p className="text-lg font-bold text-foreground">{jobsCompleted}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
              <Star className="w-3 h-3" />
              Rating
            </div>
            <p className="text-lg font-bold text-foreground">
              {rating > 0 ? rating.toFixed(1) : "—"}
            </p>
          </div>
        </div>

        {/* Tier Access */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground mb-2">
            Tier Access
          </p>
          <div className="flex gap-2">
            {CLERK_LEVELS[CLERK_LEVELS.length - 1].tierAccess.map((tier) => {
              const hasAccess = levelConfig.tierAccess.includes(tier);
              return (
                <div
                  key={tier}
                  className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border ${
                    hasAccess
                      ? "bg-accent/10 text-accent border-accent/20"
                      : "bg-muted/30 text-muted-foreground/40 border-border"
                  }`}
                >
                  {hasAccess ? (
                    <Shield className="w-3 h-3" />
                  ) : (
                    <Lock className="w-3 h-3" />
                  )}
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress to next level */}
        {nextLevel && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-muted-foreground">
                Progress to {nextLevel.title}
              </p>
              <span className="text-[10px] text-accent font-medium">
                {progress.overall}%
              </span>
            </div>
            <Progress value={progress.overall} className="h-1.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>
                {jobsCompleted}/{nextLevel.minJobsCompleted} jobs
              </span>
              <span>
                {rating.toFixed(1)}/{nextLevel.minRating} rating
              </span>
            </div>
          </div>
        )}

        {!nextLevel && (
          <div className="text-center py-2">
            <p className="text-[11px] text-accent font-medium">
              🎉 Maximum level reached
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClerkProgressionCard;
