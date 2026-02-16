import { Clock, PoundSterling, Shield, ArrowRight, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ESCROW_STATUS_LABELS,
  ESCROW_STATUS_COLORS,
  AUTO_RELEASE_HOURS,
  type EscrowStatus,
  type PayoutBreakdown,
} from "@/utils/escrow";

interface EscrowStatusCardProps {
  status: EscrowStatus;
  payout: PayoutBreakdown;
  heldAt?: string | null;
  autoReleaseAt?: string | null;
  releasedAt?: string | null;
  /** Only show platform margin to admins */
  showPlatformMargin?: boolean;
  /** Show net payout (for clerks) */
  showClerkPayout?: boolean;
}

const EscrowStatusCard = ({
  status,
  payout,
  heldAt,
  autoReleaseAt,
  releasedAt,
  showPlatformMargin = false,
  showClerkPayout = false,
}: EscrowStatusCardProps) => {
  // Calculate timer progress
  const getTimerProgress = () => {
    if (!heldAt || !autoReleaseAt) return 0;
    const start = new Date(heldAt).getTime();
    const end = new Date(autoReleaseAt).getTime();
    const now = Date.now();
    const elapsed = now - start;
    const total = end - start;
    return Math.min(Math.round((elapsed / total) * 100), 100);
  };

  const getTimeRemaining = () => {
    if (!autoReleaseAt) return null;
    const end = new Date(autoReleaseAt).getTime();
    const remaining = end - Date.now();
    if (remaining <= 0) return "Auto-releasing...";
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const timerProgress = getTimerProgress();
  const timeRemaining = getTimeRemaining();

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Payment Status</h3>
          </div>
          <Badge
            variant="outline"
            className={ESCROW_STATUS_COLORS[status] || ""}
          >
            {ESCROW_STATUS_LABELS[status]}
          </Badge>
        </div>

        {/* Amount display — hide gross from clerks */}
        {!showClerkPayout && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Total Amount</span>
              <div className="flex items-center gap-1 text-foreground">
                <PoundSterling className="w-4 h-4" />
                <span className="text-lg font-bold">
                  {payout.grossAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payout breakdown */}
        <div className="space-y-1.5">
          {showClerkPayout && (
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Your Payout (net)</span>
              <span className="font-semibold text-primary">
                £{payout.clerkPayout.toFixed(2)}
              </span>
            </div>
          )}
          {payout.providerFee > 0 && (
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Provider Fee</span>
              <span className="text-foreground">
                £{payout.providerFee.toFixed(2)}
              </span>
            </div>
          )}
          {showPlatformMargin && (
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Platform Fee (15%)</span>
              <span className="text-foreground">
                £{payout.platformFee.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Auto-Release Timer — admin only */}
        {status === "held" && autoReleaseAt && showPlatformMargin && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Timer className="w-3 h-3" />
                {AUTO_RELEASE_HOURS}h Auto-Release Timer
              </div>
              <span className="text-[10px] font-medium text-warning">
                {timeRemaining}
              </span>
            </div>
            <Progress value={timerProgress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              Funds auto-release to the clerk after {AUTO_RELEASE_HOURS} hours if
              no dispute is raised.
            </p>
          </div>
        )}

        {/* Non-admin payment note */}
        {status === "held" && !showPlatformMargin && (
          <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
            Payment is processed upon report approval in line with LISTD terms.
          </p>
        )}

        {status === "released" && releasedAt && (
          <div className="flex items-center gap-2 text-[11px] text-success pt-2 border-t border-border">
            <ArrowRight className="w-3 h-3" />
            Released on {new Date(releasedAt).toLocaleDateString("en-GB", { 
              day: "numeric", month: "short", year: "numeric" 
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EscrowStatusCard;
