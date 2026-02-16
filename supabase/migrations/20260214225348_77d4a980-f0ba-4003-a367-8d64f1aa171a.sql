
-- Reviews table for post-job ratings
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  clerk_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, reviewer_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews they're involved in"
ON public.reviews FOR SELECT
USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

CREATE POLICY "Reviewers can insert their own reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewees can update clerk_response only"
ON public.reviews FOR UPDATE
USING (auth.uid() = reviewee_id);

CREATE POLICY "Admins can manage all reviews"
ON public.reviews FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Make reviews publicly readable for clerk profiles
CREATE POLICY "Anyone authenticated can view reviews"
ON public.reviews FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Messages table for in-app communication
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  attachment_url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark messages as read"
ON public.messages FOR UPDATE
USING (auth.uid() = recipient_id);

CREATE POLICY "Admins can view all messages"
ON public.messages FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add indexes for performance
CREATE INDEX idx_reviews_job_id ON public.reviews(job_id);
CREATE INDEX idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX idx_messages_job_id ON public.messages(job_id);
CREATE INDEX idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_strikes_clerk_id ON public.strikes(clerk_id);
CREATE INDEX idx_disputes_job_id ON public.disputes(job_id);
