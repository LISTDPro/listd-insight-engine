import { useParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useConditionMapper, MapRoom } from "@/hooks/useConditionMapper";
import { getDefaultItemsForRoom, CONDITION_LABELS, CONDITION_COLORS, ItemCondition } from "@/utils/conditionMapperDefaults";
import { generateConditionReportPDF } from "@/utils/generateConditionReport";
import { SortableRoomCard } from "@/components/inspection/SortableRoomCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Plus, Trash2, Camera, Loader2, X, Download
} from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";


const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-warning/10 text-warning border-warning/30" },
  complete: { label: "Complete", className: "bg-success/10 text-success border-success/30" },
};

const ConditionMapperPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const {
    rooms, loading,
    addRoom, addItem, updateItem, deleteItem, deleteRoom, reorderRooms,
    uploadPhoto, deletePhoto,
    getRoomItems, getItemPhotos, getRoomStatus,
  } = useConditionMapper(jobId);

  const [selectedRoom, setSelectedRoom] = useState<MapRoom | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [addingRoom, setAddingRoom] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadItemId, setActiveUploadItemId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [jobMeta, setJobMeta] = useState<{ inspectionType?: string; scheduledDate?: string; property?: any; clerkName?: string } | null>(null);

  // Fetch job metadata for PDF
  useEffect(() => {
    if (!jobId) return;
    (async () => {
      const { data: job } = await supabase
        .from("jobs")
        .select("inspection_type, scheduled_date, property_id, clerk_id")
        .eq("id", jobId)
        .single();
      if (!job) return;
      const [propRes, profileRes] = await Promise.all([
        supabase.from("properties").select("address_line_1, address_line_2, city, postcode").eq("id", job.property_id).single(),
        job.clerk_id ? supabase.from("profiles").select("full_name").eq("user_id", job.clerk_id).single() : Promise.resolve({ data: null }),
      ]);
      setJobMeta({
        inspectionType: job.inspection_type,
        scheduledDate: job.scheduled_date,
        property: propRes.data,
        clerkName: profileRes.data?.full_name || undefined,
      });
    })();
  }, [jobId]);

  const handleDownloadReport = async () => {
    if (!jobId || rooms.length === 0) {
      toast.error("Add rooms before generating a report");
      return;
    }
    setGenerating(true);
    try {
      const doc = await generateConditionReportPDF({
        jobId,
        inspectionType: jobMeta?.inspectionType,
        scheduledDate: jobMeta?.scheduledDate,
        property: jobMeta?.property,
        rooms,
        items,
        photos,
        clerkName: jobMeta?.clerkName,
      }, (pct) => {
        // Could show progress in future
      });
      const addr = jobMeta?.property?.address_line_1?.replace(/[^a-zA-Z0-9]/g, "_") || "property";
      doc.save(`LISTD_Condition_Report_${addr}.pdf`);
      toast.success("Report downloaded");
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rooms.findIndex(r => r.id === active.id);
    const newIndex = rooms.findIndex(r => r.id === over.id);
    const reordered = arrayMove(rooms, oldIndex, newIndex).map((r, i) => ({ ...r, room_order: i }));
    reorderRooms(reordered);
  };

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return;
    setAddingRoom(true);
    const room = await addRoom(newRoomName.trim());
    if (room) {
      const defaults = getDefaultItemsForRoom(newRoomName.trim());
      for (const itemName of defaults) {
        await addItem(room.id, itemName);
      }
      setNewRoomName("");
      toast.success(`${room.room_name} added with ${defaults.length} items`);
    }
    setAddingRoom(false);
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !selectedRoom) return;
    await addItem(selectedRoom.id, newItemName.trim());
    setNewItemName("");
  };

  const handlePhotoUpload = async (itemId: string, files: FileList | null) => {
    if (!files) return;
    const currentPhotos = getItemPhotos(itemId);
    const remaining = 4 - currentPhotos.length;
    if (remaining <= 0) { toast.error("Max 4 photos per item"); return; }
    setUploadingItemId(itemId);
    const toUpload = Array.from(files).slice(0, remaining);
    for (const file of toUpload) {
      await uploadPhoto(itemId, file);
    }
    setUploadingItemId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Room detail view
  if (selectedRoom) {
    const roomItems = getRoomItems(selectedRoom.id);
    const status = getRoomStatus(selectedRoom.id);

    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSelectedRoom(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">{selectedRoom.room_name}</h2>
              <Badge variant="outline" className={STATUS_BADGE[status].className}>
                {STATUS_BADGE[status].label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3 pb-24">
          {roomItems.map((item) => {
            const itemPhotos = getItemPhotos(item.id);
            return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground">{item.item_name}</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(CONDITION_LABELS) as ItemCondition[]).map((cond) => (
                      <button
                        key={cond}
                        onClick={() => updateItem(item.id, { condition: cond })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                          item.condition === cond
                            ? `${CONDITION_COLORS[cond]} text-white border-transparent`
                            : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
                        }`}
                      >
                        {CONDITION_LABELS[cond]}
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Add notes..."
                    value={item.notes || ""}
                    onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                    className="text-sm min-h-[60px] resize-none"
                  />
                  <div className="flex gap-2 flex-wrap items-center">
                    {itemPhotos.map((photo) => (
                      <div key={photo.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                        <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => deletePhoto(photo.id)} className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {itemPhotos.length < 4 && (
                      <button
                        onClick={() => { setActiveUploadItemId(item.id); fileInputRef.current?.click(); }}
                        className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                        disabled={uploadingItemId === item.id}
                      >
                        {uploadingItemId === item.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <div className="flex gap-2">
            <Input placeholder="Add custom item..." value={newItemName} onChange={(e) => setNewItemName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddItem()} className="flex-1" />
            <Button variant="outline" size="icon" onClick={handleAddItem} disabled={!newItemName.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (activeUploadItemId) { handlePhotoUpload(activeUploadItemId, e.target.files); e.target.value = ""; } }} />
      </div>
    );
  }

  // Room list view with drag-and-drop
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/jobs/${jobId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Condition Report</h1>
            <p className="text-sm text-muted-foreground">{rooms.length} rooms · drag to reorder</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 pb-24">
        {rooms.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-2 font-medium">No rooms added yet</p>
            <p className="text-sm">Add rooms below to start the condition report</p>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rooms.map(r => r.id)} strategy={verticalListSortingStrategy}>
            {rooms.map((room) => {
              const status = getRoomStatus(room.id);
              const roomItems = getRoomItems(room.id);
              const ratedCount = roomItems.filter(i => i.condition !== 'na').length;
              return (
                <SortableRoomCard
                  key={room.id}
                  room={room}
                  status={status}
                  ratedCount={ratedCount}
                  totalItems={roomItems.length}
                  onSelect={setSelectedRoom}
                  onDelete={deleteRoom}
                />
              );
            })}
          </SortableContext>
        </DndContext>

        <div className="flex gap-2">
          <Input placeholder="Add room (e.g. Bedroom 3)..." value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddRoom()} className="flex-1" />
          <Button variant="accent" onClick={handleAddRoom} disabled={!newRoomName.trim() || addingRoom}>
            {addingRoom ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConditionMapperPage;
