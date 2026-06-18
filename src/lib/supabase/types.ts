export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Mirrors the live Supabase `public` schema. Core tables live in the `core`
// schema (not exposed via PostgREST); access them through public RPCs.
// Regenerate: supabase gen types typescript --project-id bmkimgvtfjctveopkcme
export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: { [_ in never]: never };
    Views: { [_ in never]: never };
    Functions: {
      capture_lead: {
        Args: {
          p_email: string;
          p_full_name: string;
          p_locale?: string;
          p_source?: string;
          p_tenant: string;
        };
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
