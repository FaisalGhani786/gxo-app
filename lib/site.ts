import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/lib/types";

const FALLBACK: SiteSettings = {
  editor_email: "hello@gxoeditz.com",
  whatsapp_number: "",
  youtube_url: "https://www.youtube.com/@gxoeditz",
  tiktok_url: "",
  instagram_url: "",
  timezone: "Europe/London",
  first_slot_hour: 10,
  last_slot_hour: 20,
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle<SiteSettings>();
  return data ?? FALLBACK;
});
