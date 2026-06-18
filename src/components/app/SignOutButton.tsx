"use client";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ locale, label }: { locale: string; label: string }) {
  async function out() {
    await createClient().auth.signOut();
    window.location.href = `/${locale}`;
  }
  return (
    <button type="button" onClick={out} style={{
      background: "transparent", border: "1px solid #E3E8E6", color: "#5C6B66",
      fontSize: 13, fontWeight: 600, padding: "7px 13px", borderRadius: 999, cursor: "pointer",
    }}>{label}</button>
  );
}
