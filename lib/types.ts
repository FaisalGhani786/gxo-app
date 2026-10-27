export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  discord_username: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Package = {
  id: string;
  slug: string;
  kind: "course" | "mentoring";
  title: string;
  tagline: string;
  description: string;
  price_pence: number;
  currency: string;
  features: string[];
  duration_minutes: number | null;
  sessions: number;
  includes_discord: boolean;
  bundles: string[];
  highlight: boolean;
  sort: number;
  active: boolean;
};

export type Lesson = {
  id: string;
  package_id: string;
  section: string;
  title: string;
  summary: string;
  video_url: string | null;
  duration_minutes: number | null;
  is_preview: boolean;
  sort: number;
};

export type BookingStatus = "requested" | "confirmed" | "completed" | "cancelled";

export type Booking = {
  id: string;
  user_id: string;
  package_id: string;
  starts_at: string;
  ends_at: string;
  notes: string;
  status: BookingStatus;
  paid: boolean;
  meeting_link: string | null;
  created_at: string;
};

export type OrderStatus = "pending" | "paid" | "cancelled" | "refunded";

export type Order = {
  id: string;
  user_id: string;
  package_id: string;
  booking_id: string | null;
  amount_pence: number;
  currency: string;
  status: OrderStatus;
  provider: "manual" | "stripe";
  provider_ref: string | null;
  created_at: string;
  paid_at: string | null;
};

export type Application = {
  id: string;
  user_id: string;
  portfolio_url: string;
  discord_username: string;
  uses_premiere: boolean;
  uses_capcut: boolean;
  experience: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type ShowcaseItem = {
  id: string;
  title: string;
  url: string;
  sort: number;
  active: boolean;
};

export type SiteSettings = {
  editor_email: string;
  whatsapp_number: string;
  youtube_url: string;
  tiktok_url: string;
  instagram_url: string;
  timezone: string;
  first_slot_hour: number;
  last_slot_hour: number;
};

/** Result shape for server actions driven by useActionState. */
export type ActionState = { error?: string; ok?: string } | undefined;
