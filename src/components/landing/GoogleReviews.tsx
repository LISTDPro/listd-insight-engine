import { useEffect, useRef } from "react";
import { Star, ExternalLink } from "lucide-react";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
      />
    ))}
  </div>
);

const GoogleReviews = () => {
  const { data: settings } = usePlatformSettings();

  const rating = parseFloat(settings?.google_star_rating || "0");
  const reviewCount = parseInt(settings?.google_review_count || "0");
  const reviewLink = settings?.google_review_link || "";
  const embedCode = settings?.google_reviews_embed_code || "";
  const displayEnabled = settings?.google_reviews_enabled !== "false";

  if (!displayEnabled) return null;

  return (
    <section className="py-20 px-6 md:px-12 bg-background border-t border-border">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {/* Google G icon */}
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-sm font-medium text-muted-foreground">Google Reviews</span>
            </div>

            {rating > 0 ? (
              <div className="flex items-baseline gap-3">
                <span className="font-display text-4xl font-semibold text-foreground">{rating.toFixed(1)}</span>
                <div>
                  <StarRating rating={Math.round(rating)} />
                  {reviewCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{reviewCount} verified reviews</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">Reviews coming soon</p>
            )}
          </div>

          {reviewLink && (
            <a
              href={reviewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Leave a review
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Embed widget OR empty state */}
        {embedCode ? (
          <div
            className="w-full"
            dangerouslySetInnerHTML={{ __html: embedCode }}
          />
        ) : (
          <div className="border border-dashed border-border rounded-lg p-12 text-center">
            <div className="flex justify-center mb-3">
              <svg viewBox="0 0 24 24" className="w-8 h-8 opacity-30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No reviews yet — we'd love your feedback.</p>
            {reviewLink ? (
              <a
                href={reviewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-2"
              >
                Be the first to leave a review
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                An admin can add a Google Reviews widget embed code in the Settings panel.
              </p>
            )}
          </div>
        )}

        {/* Trustpilot Section */}
        <TrustpilotSection settings={settings} />
      </div>
    </section>
  );
};

const TrustpilotSection = ({ settings }: { settings: any }) => {
  const trustpilotEnabled = settings?.trustpilot_enabled === "true";
  const trustpilotEmbed = settings?.trustpilot_embed_code || "";
  const trustpilotLink = settings?.trustpilot_review_link || "";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trustpilotEnabled && trustpilotEmbed && containerRef.current) {
      const widget = containerRef.current.querySelector('.trustpilot-widget');
      const win = window as any;
      if (widget && win.Trustpilot) {
        win.Trustpilot.loadFromElement(widget, true);
      }
    }
  }, [trustpilotEnabled, trustpilotEmbed]);

  if (!trustpilotEnabled) return null;

  return (
    <div className="mt-16 pt-12 border-t border-border">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div className="flex items-center gap-2">
          {/* Trustpilot star icon */}
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6 5.7 21l2.3-7.2-6-4.4h7.6L12 2z" fill="#00B67A"/>
          </svg>
          <span className="text-sm font-medium text-muted-foreground">Trustpilot</span>
        </div>

        {trustpilotLink && (
          <a
            href={trustpilotLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            Leave a review on Trustpilot
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {trustpilotEmbed ? (
        <div
          ref={containerRef}
          className="w-full"
          dangerouslySetInnerHTML={{ __html: trustpilotEmbed }}
        />
      ) : (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <p className="text-sm font-medium text-foreground mb-1">Trustpilot widget enabled but no embed code provided.</p>
          <p className="text-xs text-muted-foreground mt-1">
            An admin can add a Trustpilot widget embed code in the Settings panel.
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleReviews;
