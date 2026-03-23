import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformSettings {
  google_review_link: string;
  google_star_rating: string;
  google_review_count: string;
  google_reviews_embed_code: string;
  google_reviews_enabled: string;
  trustpilot_enabled: string;
  trustpilot_embed_code: string;
  trustpilot_review_link: string;
  instagram_url: string;
  facebook_url: string;
  review_email_enabled: string;
  tenancies_completed_override: string;
  business_phone: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  google_review_link: "",
  google_star_rating: "",
  google_review_count: "",
  google_reviews_embed_code: "",
  google_reviews_enabled: "true",
  trustpilot_enabled: "false",
  trustpilot_embed_code: "",
  trustpilot_review_link: "",
  instagram_url: "https://www.instagram.com/thee_inventory_guy?igsh=MTllc2tvNTNqbG95aQ%3D%3D&utm_source=qr",
  facebook_url: "https://www.facebook.com/share/1Cj3tD4Zre/?mibextid=wwXIfr",
  review_email_enabled: "true",
  tenancies_completed_override: "",
};

export const usePlatformSettings = () => {
  return useQuery({
    queryKey: ["platform_settings"],
    queryFn: async (): Promise<PlatformSettings> => {
      const { data, error } = await supabase
        .from("platform_settings" as any)
        .select("key, value");

      if (error) {
        console.warn("Could not fetch platform settings:", error);
        return DEFAULT_SETTINGS;
      }

      const settings = { ...DEFAULT_SETTINGS };
      if (data) {
        for (const row of (data as unknown) as { key: string; value: string | null }[]) {
          if (row.key in settings) {
            (settings as any)[row.key] = row.value ?? "";
          }
        }
      }
      return settings;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdatePlatformSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("platform_settings" as any)
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform_settings"] });
    },
  });
};
