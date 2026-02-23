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

const PRICING_FIELDS = [
  "bedrooms", "bathrooms", "kitchens", "living_rooms", "dining_areas",
  "utility_rooms", "storage_rooms", "hallways_stairs", "gardens",
  "communal_areas", "property_type", "furnished_status", "heavily_furnished",
] as const;


export const useProperties = () => {
  const { user, organisationId } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    let query = supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });

    if (organisationId) {
      query = query.eq("organisation_id", organisationId);
    } else {
      query = query.eq("client_id", user.id);
    }

    const { data, error: fetchError } = await query;

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
        organisation_id: organisationId || undefined,
      } as any)
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

    // Find old property for diff
    const oldProperty = properties.find((p) => p.id === id);

    const { error: updateError } = await supabase
      .from("properties")
      .update(input)
      .eq("id", id)
      .eq("client_id", user.id);

    if (!updateError) {
      // Build change diff and log
      if (oldProperty) {
        await logPropertyChange(id, oldProperty, input);
      }
      await fetchProperties();
    }

    return { error: updateError as Error | null };
  };

  const logPropertyChange = async (
    propertyId: string,
    oldProperty: Property,
    newValues: Partial<CreatePropertyInput>
  ) => {
    if (!user) return;

    // Build changes diff
    const changes: Record<string, { old: any; new: any }> = {};
    let mayAffectPricing = false;

    for (const [key, newVal] of Object.entries(newValues)) {
      const oldVal = (oldProperty as any)[key];
      if (oldVal !== newVal && newVal !== undefined) {
        changes[key] = { old: oldVal, new: newVal };
        if ((PRICING_FIELDS as readonly string[]).includes(key)) {
          mayAffectPricing = true;
        }
      }
    }

    // No actual changes
    if (Object.keys(changes).length === 0) return;

    // Insert change log — a database trigger handles admin/clerk notifications
    await supabase.from("property_change_logs" as any).insert({
      property_id: propertyId,
      changed_by: user.id,
      changes,
      may_affect_pricing: mayAffectPricing,
    });
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
