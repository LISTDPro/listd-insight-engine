import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Property, PropertyType, FurnishedStatus } from "@/types/database";

interface CreatePropertyInput {
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postcode: string;
  property_type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  kitchens: number;
  living_rooms: number;
  dining_areas: number;
  utility_rooms: number;
  storage_rooms: number;
  hallways_stairs: number;
  gardens: number;
  communal_areas: number;
  furnished_status: FurnishedStatus;
  heavily_furnished: boolean;
  notes?: string;
}

export const useProperties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("properties")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProperties(data as Property[]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, [user]);

  const createProperty = async (input: CreatePropertyInput) => {
    if (!user) return { error: new Error("Not authenticated"), data: null };

    const { data, error: insertError } = await supabase
      .from("properties")
      .insert({
        ...input,
        client_id: user.id,
      })
      .select()
      .single();

    if (!insertError) {
      await fetchProperties();
    }

    return { 
      error: insertError as Error | null, 
      data: data as Property | null 
    };
  };

  const updateProperty = async (id: string, input: Partial<CreatePropertyInput>) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error: updateError } = await supabase
      .from("properties")
      .update(input)
      .eq("id", id)
      .eq("client_id", user.id);

    if (!updateError) {
      await fetchProperties();
    }

    return { error: updateError as Error | null };
  };

  const deleteProperty = async (id: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error: deleteError } = await supabase
      .from("properties")
      .delete()
      .eq("id", id)
      .eq("client_id", user.id);

    if (!deleteError) {
      await fetchProperties();
    }

    return { error: deleteError as Error | null };
  };

  return {
    properties,
    loading,
    error,
    fetchProperties,
    createProperty,
    updateProperty,
    deleteProperty,
  };
};
