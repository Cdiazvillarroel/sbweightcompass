"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";
import { LANDING_ES } from "@/landing/landing-es";
import { LANDING_EN } from "@/landing/landing-en";

// Renders the approved Claude Design landing (EN/ES) and mounts the Cal.com
// inline booking widget into the #cal-inline slot. The `dc-landing` class scopes
// the mobile-responsive overrides in globals.css.
export function DesignLanding({ locale }: { locale: string }) {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal("ui", { theme: "light" });
      cal("inline", {
        elementOrSelector: "#cal-inline",
        calLink: "sb-weight-00lr1t/30min",
        config: { layout: "month_view", theme: "light" },
      });
    })();
  }, []);

  const html = locale === "es" ? LANDING_ES : LANDING_EN;
  return <div className="dc-landing" dangerouslySetInnerHTML={{ __html: html }} />;
}
