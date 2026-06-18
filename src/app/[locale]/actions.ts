"use server";

import { createClient } from "@/lib/supabase/server";
import { SB_TENANT_ID } from "@/lib/tenant";

export type LeadState = { ok: boolean; error?: string };

export async function submitLead(
  _prev: LeadState,
  formData: FormData,
): Promise<LeadState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const locale = String(formData.get("locale") ?? "en");

  if (!email || !email.includes("@")) {
    return { ok: false, error: "invalid_email" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("capture_lead", {
    p_tenant: SB_TENANT_ID,
    p_full_name: fullName,
    p_email: email,
    p_locale: locale,
    p_source: "website",
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
