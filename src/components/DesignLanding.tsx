import { LANDING_ES } from "@/landing/landing-es";
import { LANDING_EN } from "@/landing/landing-en";

// Renders the approved Claude Design landing (final version, Cal.com iframe embed).
export function DesignLanding({ locale }: { locale: string }) {
  const html = locale === "es" ? LANDING_ES : LANDING_EN;
  return <div className="dc-landing" dangerouslySetInnerHTML={{ __html: html }} />;
}
