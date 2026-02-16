-- Add acknowledgement fields to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS client_pre_inspection_ack boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS client_pre_inspection_ack_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS client_report_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS client_report_accepted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS client_report_comments text;

-- Add provider acknowledgement for job completion
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS provider_job_completed_ack boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS provider_job_completed_ack_at timestamp with time zone;

-- Add clerk acknowledgement for report submission
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS clerk_report_submitted_ack boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS clerk_report_submitted_ack_at timestamp with time zone;