import { Star, ExternalLink } from "lucide-react";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SocialProofBadge = () => {
  const { data: settings } = usePlatformSettings();

  const { data: completedCount } = useQuery({
    queryKey: ["completed_jobs_count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .in("status", ["completed", "paid"]);
      return count || 0;
    },
  });

  const rating = settings?.google_star_rating ? parseFloat(settings.google_star_rating) : null;
  const reviewLink = settings?.google_review_link || "";
  const overrideCount = settings?.tenancies_completed_override;
  const displayCount = overrideCount ? parseInt(overrideCount) : (completedCount || 0);

  if (!rating && displayCount === 0 && !reviewLink) return null;

  return (
    <div className="bg-card border border-border p-4 space-y-3">
      {/* Star Rating — only show if a real rating has been configured */}
      {rating !== null && rating > 0 ? (
        <a
          href={reviewLink || "#"}
          target={reviewLink ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="flex items-center gap-2 group"
        >
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted/30"}`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">on Google</span>
          {reviewLink && <ExternalLink className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary transition-colors ml-auto" />}
        </a>
      ) : reviewLink ? (
        <a
          href={reviewLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Leave us a Google review
        </a>
      ) : null}

      {/* Tenancies */}
      {displayCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span>Trusted by <strong className="text-foreground">{displayCount}+</strong> tenancies</span>
        </div>
      )}
    </div>
  );
};

export default SocialProofBadge;
