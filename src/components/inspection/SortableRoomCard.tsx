import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MapRoom } from "@/hooks/useConditionMapper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Trash2, ChevronRight, GripVertical } from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-warning/10 text-warning border-warning/30" },
  complete: { label: "Complete", className: "bg-success/10 text-success border-success/30" },
};

interface SortableRoomCardProps {
  room: MapRoom;
  status: 'not_started' | 'in_progress' | 'complete';
  ratedCount: number;
  totalItems: number;
  onSelect: (room: MapRoom) => void;
  onDelete: (roomId: string) => void;
}

export const SortableRoomCard = ({ room, status, ratedCount, totalItems, onSelect, onDelete }: SortableRoomCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: room.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`transition-colors ${isDragging ? 'shadow-lg border-primary/50' : 'hover:border-primary/30'}`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              {...attributes}
              {...listeners}
              className="touch-none p-1 -ml-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </button>
            {status === 'complete' ? (
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            ) : (
              <Circle className={`w-5 h-5 shrink-0 ${status === 'in_progress' ? 'text-warning' : 'text-muted-foreground'}`} />
            )}
            <button className="min-w-0 text-left" onClick={() => onSelect(room)}>
              <p className="font-medium truncate">{room.room_name}</p>
              <p className="text-xs text-muted-foreground">{ratedCount}/{totalItems} items rated</p>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${STATUS_BADGE[status].className}`}>
              {STATUS_BADGE[status].label}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); onDelete(room.id); }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <button onClick={() => onSelect(room)}>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
