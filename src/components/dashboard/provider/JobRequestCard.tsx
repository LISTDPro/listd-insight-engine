import { format } from "date-fns";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Home, 
  Bed, 
  Bath,
  Check,
  X,
  User,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TierBadge from "@/components/ui/tier-badge";
import { INSPECTION_TYPE_LABELS, PROPERTY_TYPE_LABELS, JobStatus } from "@/types/database";

interface JobWithProperty {
  id: string;
  inspection_type: string;
  scheduled_date: string;
  preferred_time_slot?: string | null;
  special_instructions?: string | null;
  status: JobStatus;
  quoted_price?: number | null;
  clerk_id?: string | null;
  service_tier?: string | null;
  property?: {
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    postcode: string;
    bedrooms: number;
    bathrooms: number;
    property_type: string;
    furnished_status: string;
  };
}

interface JobRequestCardProps {
  job: JobWithProperty;
  onAccept?: (jobId: string) => void;
  onDecline?: (jobId: string) => void;
  onAssignClerk?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
  isAccepting?: boolean;
  clerkName?: string | null;
}

const STATUS_COLORS: Record<JobStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-muted text-muted-foreground",
  published: "bg-accent text-accent-foreground",
  accepted: "bg-warning text-warning-foreground",
  assigned: "bg-primary text-primary-foreground",
  in_progress: "bg-primary text-primary-foreground",
  submitted: "bg-success/80 text-success-foreground",
  reviewed: "bg-success text-success-foreground",
  signed: "bg-success text-success-foreground",
  completed: "bg-success text-success-foreground",
  paid: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

const STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  published: "Available",
  accepted: "Accepted",
  assigned: "Assigned",
  in_progress: "In Progress",
  submitted: "Submitted",
  reviewed: "Under Review",
  signed: "Signed",
  completed: "Completed",
  paid: "Paid",
  cancelled: "Cancelled",
};

const JobRequestCard = ({
  job,
  onAccept,
  onDecline,
  onAssignClerk,
  onViewDetails,
  isAccepting = false,
  clerkName,
}: JobRequestCardProps) => {
  const property = job.property;
  const inspectionLabel = INSPECTION_TYPE_LABELS[job.inspection_type as keyof typeof INSPECTION_TYPE_LABELS] || job.inspection_type;
  const propertyTypeLabel = property ? PROPERTY_TYPE_LABELS[property.property_type as keyof typeof PROPERTY_TYPE_LABELS] || property.property_type : "";
  const scheduledDate = new Date(job.scheduled_date);
  const isPublished = job.status === "published";
  const needsClerkAssignment = job.status === "accepted" && !job.clerk_id;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={STATUS_COLORS[job.status]}>
                  {STATUS_LABELS[job.status]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {inspectionLabel}
                </Badge>
                <TierBadge tier={job.service_tier} size="sm" />
              </div>
              {property && (
                <h3 className="font-semibold text-foreground truncate">
                  {property.address_line_1}
                </h3>
              )}
            </div>
            {job.quoted_price && (
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-foreground">
                  £{job.quoted_price}
                </div>
              </div>
            )}
          </div>

          {/* Property Details */}
          {property && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {property.city}, {property.postcode}
              </span>
              <span className="flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                {propertyTypeLabel}
              </span>
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5" />
                {property.bedrooms}
              </span>
              <span className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5" />
                {property.bathrooms}
              </span>
            </div>
          )}

          {/* Schedule */}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <Calendar className="w-4 h-4 text-primary" />
              {format(scheduledDate, "EEE, d MMM yyyy")}
            </span>
            {job.preferred_time_slot && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" />
                {job.preferred_time_slot}
              </span>
            )}
          </div>

          {/* Assigned Clerk */}
          {job.clerk_id && clerkName && (
            <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
              <User className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Assigned to:</span>
              <span className="font-medium text-foreground">{clerkName}</span>
            </div>
          )}

          {/* Special Instructions */}
          {job.special_instructions && (
            <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 line-clamp-2">
              {job.special_instructions}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          {isPublished && onAccept && onDecline ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => onDecline(job.id)}
              >
                <X className="w-4 h-4 mr-1" />
                Decline
              </Button>
              <Button
                variant="accent"
                size="sm"
                className="flex-1"
                onClick={() => onAccept(job.id)}
                disabled={isAccepting}
              >
                <Check className="w-4 h-4 mr-1" />
                {isAccepting ? "Accepting..." : "Accept"}
              </Button>
            </div>
          ) : needsClerkAssignment && onAssignClerk ? (
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => onAssignClerk(job.id)}
            >
              <User className="w-4 h-4 mr-2" />
              Assign Clerk
            </Button>
          ) : onViewDetails ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => onViewDetails(job.id)}
            >
              View Details
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobRequestCard;
