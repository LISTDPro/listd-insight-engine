import { INSPECTION_TYPE_LABELS } from "@/types/database";
import { Separator } from "@/components/ui/separator";

interface PayoutLineItem {
  label: string;
  amount: number;
  indent?: boolean;
}

interface PayoutBreakdownProps {
  breakdown: any;
  fallbackTotal: number;
}

function parsePayoutBreakdownLines(breakdown: any): { lines: PayoutLineItem[]; total: number } | null {
  if (!breakdown || typeof breakdown !== "object") return null;

  // Bundle shape
  if (breakdown.bundle === true && Array.isArray(breakdown.services)) {
    const lines: PayoutLineItem[] = [];
    for (const svc of breakdown.services) {
      const label = INSPECTION_TYPE_LABELS[svc.type as keyof typeof INSPECTION_TYPE_LABELS] || svc.type?.replace(/_/g, " ") || "Service";
      lines.push({ label, amount: svc.total ?? svc.base ?? 0 });

      if (Array.isArray(svc.addOns) && svc.addOns.length > 0) {
        for (const addon of svc.addOns) {
          const qty = addon.quantity ?? 1;
          const addonLabel = qty > 1 ? `${addon.label} ×${qty}` : addon.label;
          lines.push({ label: addonLabel, amount: addon.total ?? 0, indent: true });
        }
      }
    }
    return { lines, total: breakdown.grandTotal ?? lines.reduce((s, l) => s + l.amount, 0) };
  }

  // Single service shape
  if (breakdown.base != null) {
    const hasAddOns = Array.isArray(breakdown.addOns) && breakdown.addOns.length > 0;
    if (!hasAddOns && !breakdown.addOnsTotal) return null; // No breakdown needed — show simple

    const lines: PayoutLineItem[] = [];
    const label = INSPECTION_TYPE_LABELS[breakdown.inspectionType as keyof typeof INSPECTION_TYPE_LABELS] || "Base";
    lines.push({ label, amount: breakdown.base });

    if (hasAddOns) {
      for (const addon of breakdown.addOns) {
        const qty = addon.quantity ?? 1;
        const addonLabel = qty > 1 ? `${addon.label} ×${qty}` : addon.label;
        lines.push({ label: addonLabel, amount: addon.total ?? 0, indent: true });
      }
    }

    return { lines, total: breakdown.total ?? breakdown.base };
  }

  return null;
}

const PayoutBreakdown = ({ breakdown, fallbackTotal }: PayoutBreakdownProps) => {
  const parsed = parsePayoutBreakdownLines(breakdown);

  // Fallback: simple display
  if (!parsed) {
    return (
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 flex items-center justify-between mt-3">
        <span className="text-xs text-muted-foreground font-medium">Your Payout</span>
        <span className="text-lg font-bold text-accent">£{fallbackTotal.toFixed(2)}</span>
      </div>
    );
  }

  return (
    <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mt-3 space-y-1.5">
      <span className="text-xs text-muted-foreground font-medium block mb-2">Your Payout</span>
      {parsed.lines.map((line, i) => (
        <div
          key={i}
          className={`flex items-center justify-between text-sm ${
            line.indent ? "pl-4 text-muted-foreground" : "text-foreground font-medium"
          }`}
        >
          <span>{line.label}</span>
          <span>£{line.amount.toFixed(2)}</span>
        </div>
      ))}
      <Separator className="my-1.5" />
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Total</span>
        <span className="text-lg font-bold text-accent">£{parsed.total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default PayoutBreakdown;
