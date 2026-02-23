import { useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

const TrustpilotReviews = () => {
  const { data: settings } = usePlatformSettings();
  const containerRef = useRef<HTMLDivElement>(null);

  const trustpilotEnabled = settings?.trustpilot_enabled === "true";
  const trustpilotEmbed = settings?.trustpilot_embed_code || "";
  const trustpilotLink = settings?.trustpilot_review_link || "";

  useEffect(() => {
    if (trustpilotEnabled && trustpilotEmbed && containerRef.current) {
      // Wait a tick for dangerouslySetInnerHTML to flush into the DOM
      const timer = setTimeout(() => {
        const widget = containerRef.current?.querySelector('.trustpilot-widget');
        const win = window as any;
        if (widget && win.Trustpilot) {
          win.Trustpilot.loadFromElement(widget, true);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [trustpilotEnabled, trustpilotEmbed]);

  if (!trustpilotEnabled) return null;

  return (
    <section className="py-20 px-6 md:px-12 bg-background border-t border-border">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="flex items-center gap-2">
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

        {/* Widget */}
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
    </section>
  );
};

export default TrustpilotReviews;
