import { Star, ExternalLink } from "lucide-react";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

// Static curated reviews — can be replaced with live API feed later
const STATIC_REVIEWS = [
  {
    author: "Sarah M.",
    rating: 5,
    date: "2 weeks ago",
    text: "Excellent service from start to finish. The clerk was professional, thorough, and the report was delivered promptly. Highly recommend LISTD for all property inspections.",
    avatar: "SM",
  },
  {
    author: "James T.",
    rating: 5,
    date: "1 month ago",
    text: "Really impressed with how organised the whole process was. Clear communication, a detailed report, and the escrow payment system gave us real peace of mind.",
    avatar: "JT",
  },
  {
    author: "Priya K.",
    rating: 5,
    date: "1 month ago",
    text: "Used LISTD for a check-out inspection and it went smoothly. The platform is intuitive and the clerk was punctual and meticulous. Would use again.",
    avatar: "PK",
  },
  {
    author: "Daniel W.",
    rating: 5,
    date: "6 weeks ago",
    text: "As a letting agent, we needed a reliable clerk network. LISTD delivered — verified professionals, structured reports, and a seamless booking process.",
    avatar: "DW",
  },
];

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
  const rating = parseFloat(settings?.google_star_rating || "5.0");
  const reviewCount = parseInt(settings?.google_review_count || "24");
  const reviewLink = settings?.google_review_link || "https://g.page/r/CfNpNpoSIt-1EAI/review";

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
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-semibold text-foreground">{rating.toFixed(1)}</span>
              <div>
                <StarRating rating={Math.round(rating)} />
                <p className="text-xs text-muted-foreground mt-1">{reviewCount} verified reviews</p>
              </div>
            </div>
          </div>
          <a
            href={reviewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            Leave a review
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATIC_REVIEWS.map((review, i) => (
            <div key={i} className="bg-card border border-border p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {review.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground leading-none">{review.author}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{review.date}</p>
                </div>
              </div>
              <StarRating rating={review.rating} />
              <p className="text-[13px] text-muted-foreground leading-relaxed flex-1">
                "{review.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GoogleReviews;
