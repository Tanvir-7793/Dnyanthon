import type { ServiceTypeKey } from "@/lib/types/supabase";

export const DEFAULT_EVENT_SLUG = "dnyanothon-2026";

export const SERVICE_LABELS: Record<ServiceTypeKey, string> = {
  entry: "Entry Pass",
  breakfast: "Breakfast Coupon",
  lunch: "Lunch Coupon",
  snacks: "Snacks Coupon",
  dinner: "Dinner Coupon",
  kit: "Kit Collection",
  certificate: "Certificate Access",
};
