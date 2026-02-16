import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  clerkId: string;
  clerkName: string;
  onSuccess?: () => void;
}

const RatingDialog = ({ open, onOpenChange, jobId, clerkId, clerkName, onSuccess }: RatingDialogProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating || !user) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("reviews")
      .insert({
        job_id: jobId,
        reviewer_id: user.id,
        reviewee_id: clerkId,
        rating,
        review_text: reviewText || null,
      });

    if (error) {
      if (error.code === "23505") {
        toast.error("You've already rated this job");
      } else {
        toast.error("Failed to submit rating");
      }
      setLoading(false);
      return;
    }

    // Update clerk's average rating
    const { data: allReviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", clerkId);

    if (allReviews && allReviews.length > 0) {
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await supabase
        .from("profiles")
        .update({
          clerk_rating: Math.round(avg * 10) / 10,
          clerk_jobs_completed: allReviews.length,
        } as any)
        .eq("user_id", clerkId);
    }

    setLoading(false);
    toast.success("Thank you for your review!");
    setRating(0);
    setReviewText("");
    onOpenChange(false);
    onSuccess?.();
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Clerk</DialogTitle>
          <DialogDescription>
            How was your experience with <strong>{clerkName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Star rating */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= displayRating
                        ? "fill-warning text-warning"
                        : "text-border"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <p className="text-sm text-muted-foreground">
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][displayRating]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Review (optional)</Label>
            <Textarea
              placeholder="Share your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !rating}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;
