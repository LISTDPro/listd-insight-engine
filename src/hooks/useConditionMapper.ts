import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ItemCondition } from "@/utils/conditionMapperDefaults";

export interface MapRoom {
  id: string;
  job_id: string;
  room_name: string;
  room_order: number;
  created_at: string;
}

export interface MapItem {
  id: string;
  room_id: string;
  job_id: string;
  item_name: string;
  condition: ItemCondition;
  notes: string | null;
  created_at: string;
}

export interface MapPhoto {
  id: string;
  item_id: string;
  job_id: string;
  photo_url: string;
  created_at: string;
}

export function useConditionMapper(jobId: string | undefined) {
  const [rooms, setRooms] = useState<MapRoom[]>([]);
  const [items, setItems] = useState<MapItem[]>([]);
  const [photos, setPhotos] = useState<MapPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const [roomsRes, itemsRes, photosRes] = await Promise.all([
        supabase.from("inspection_rooms_map" as any).select("*").eq("job_id", jobId).order("room_order"),
        supabase.from("inspection_items_map" as any).select("*").eq("job_id", jobId),
        supabase.from("inspection_item_photos" as any).select("*").eq("job_id", jobId),
      ]);
      setRooms((roomsRes.data as any[]) || []);
      setItems((itemsRes.data as any[]) || []);
      setPhotos((photosRes.data as any[]) || []);
    } catch (e) {
      console.error("Failed to fetch condition mapper data", e);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addRoom = async (roomName: string) => {
    if (!jobId) return;
    const order = rooms.length;
    const { data, error } = await supabase
      .from("inspection_rooms_map" as any)
      .insert({ job_id: jobId, room_name: roomName, room_order: order } as any)
      .select()
      .single();
    if (error) { toast.error("Failed to add room"); return null; }
    const newRoom = data as any as MapRoom;
    setRooms(prev => [...prev, newRoom]);
    return newRoom;
  };

  const addItem = async (roomId: string, itemName: string) => {
    if (!jobId) return;
    const { data, error } = await supabase
      .from("inspection_items_map" as any)
      .insert({ room_id: roomId, job_id: jobId, item_name: itemName } as any)
      .select()
      .single();
    if (error) { toast.error("Failed to add item"); return null; }
    const newItem = data as any as MapItem;
    setItems(prev => [...prev, newItem]);
    return newItem;
  };

  const updateItem = async (itemId: string, updates: Partial<Pick<MapItem, 'condition' | 'notes'>>) => {
    const { error } = await supabase
      .from("inspection_items_map" as any)
      .update(updates as any)
      .eq("id", itemId);
    if (error) { toast.error("Failed to update item"); return; }
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from("inspection_items_map" as any)
      .delete()
      .eq("id", itemId);
    if (error) { toast.error("Failed to delete item"); return; }
    setItems(prev => prev.filter(i => i.id !== itemId));
    setPhotos(prev => prev.filter(p => p.item_id !== itemId));
  };

  const deleteRoom = async (roomId: string) => {
    const { error } = await supabase
      .from("inspection_rooms_map" as any)
      .delete()
      .eq("id", roomId);
    if (error) { toast.error("Failed to delete room"); return; }
    setRooms(prev => prev.filter(r => r.id !== roomId));
    setItems(prev => prev.filter(i => i.room_id !== roomId));
  };

  const reorderRooms = async (reorderedRooms: MapRoom[]) => {
    setRooms(reorderedRooms);
    // Update room_order for each room in parallel
    const updates = reorderedRooms.map((room, index) =>
      supabase
        .from("inspection_rooms_map" as any)
        .update({ room_order: index } as any)
        .eq("id", room.id)
    );
    const results = await Promise.all(updates);
    if (results.some(r => r.error)) {
      toast.error("Failed to save room order");
      fetchAll(); // Revert on error
    }
  };

  const uploadPhoto = async (itemId: string, file: File) => {
    if (!jobId) return;
    // Compress image
    const compressed = await compressImage(file, 1200, 0.7);
    const filePath = `${jobId}/${itemId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("condition-photos")
      .upload(filePath, compressed, { contentType: compressed.type });
    if (uploadError) { toast.error("Upload failed"); return; }
    const { data: urlData } = supabase.storage.from("condition-photos").getPublicUrl(filePath);
    const photoUrl = urlData.publicUrl;
    const { data, error } = await supabase
      .from("inspection_item_photos" as any)
      .insert({ item_id: itemId, job_id: jobId, photo_url: photoUrl } as any)
      .select()
      .single();
    if (error) { toast.error("Failed to save photo record"); return; }
    setPhotos(prev => [...prev, data as any as MapPhoto]);
    return data;
  };

  const deletePhoto = async (photoId: string) => {
    const { error } = await supabase
      .from("inspection_item_photos" as any)
      .delete()
      .eq("id", photoId);
    if (error) { toast.error("Failed to delete photo"); return; }
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const getRoomItems = (roomId: string) => items.filter(i => i.room_id === roomId);
  const getItemPhotos = (itemId: string) => photos.filter(p => p.item_id === itemId);

  const getRoomStatus = (roomId: string): 'not_started' | 'in_progress' | 'complete' => {
    const roomItems = getRoomItems(roomId);
    if (roomItems.length === 0) return 'not_started';
    const rated = roomItems.filter(i => i.condition !== 'na');
    if (rated.length === 0) return 'not_started';
    if (rated.length === roomItems.length) return 'complete';
    return 'in_progress';
  };

  return {
    rooms, items, photos, loading,
    addRoom, addItem, updateItem, deleteItem, deleteRoom, reorderRooms,
    uploadPhoto, deletePhoto,
    getRoomItems, getItemPhotos, getRoomStatus,
    refetch: fetchAll,
  };
}

/** Compress an image file to a target max dimension and quality */
async function compressImage(file: File, maxDim: number, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = (height / width) * maxDim; width = maxDim; }
        else { width = (width / height) * maxDim; height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob || file),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}
