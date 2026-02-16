import { format } from "date-fns";
import { TimelineEvent } from "@/hooks/useJobDetail";
import { 
  PlusCircle, 
  ShieldCheck, 
  Building, 
  UserCheck, 
  PlayCircle,
  FileCheck,
  Eye,
  CheckCircle,
  ThumbsUp,
  BadgeCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "plus-circle": PlusCircle,
  "shield-check": ShieldCheck,
  "building": Building,
  "user-check": UserCheck,
  "play-circle": PlayCircle,
  "file-check": FileCheck,
  "eye": Eye,
  "check-circle": CheckCircle,
  "thumbs-up": ThumbsUp,
  "badge-check": BadgeCheck,
  "credit-card": CreditCard,
  "check-circle-2": CheckCircle2,
  "x-circle": XCircle,
  "message-circle": MessageCircle,
};

const typeStyles: Record<string, string> = {
  creation: "bg-primary/10 text-primary border-primary/30",
  acknowledgement: "bg-success/10 text-success border-success/30",
  assignment: "bg-accent/10 text-accent border-accent/30",
  status: "bg-warning/10 text-warning border-warning/30",
  communication: "bg-secondary text-secondary-foreground border-secondary",
};

interface JobTimelineProps {
  events: TimelineEvent[];
}

const JobTimeline = ({ events }: JobTimelineProps) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No timeline events yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-border" />

      <div className="space-y-4">
        {events.map((event, index) => {
          const IconComponent = iconMap[event.icon] || CheckCircle;
          const isFirst = index === 0;

          return (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon bubble */}
              <div 
                className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background",
                  typeStyles[event.type] || "bg-muted text-muted-foreground border-muted"
                )}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className={cn(
                "flex-1 pb-4",
                isFirst && "animate-fade-in"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-foreground">{event.title}</h4>
                    {event.actor && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {event.actor}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(event.timestamp), "MMM d, yyyy")}
                    <br />
                    {format(new Date(event.timestamp), "h:mm a")}
                  </time>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JobTimeline;
