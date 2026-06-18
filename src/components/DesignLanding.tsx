"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";
import { LANDING_ES } from "@/landing/landing-es";
import { LANDING_EN } from "@/landing/landing-en";

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

    // Close the mobile menu after tapping a link
    const toggle = document.getElementById("dc-nav-toggle") as HTMLInputElement | null;
    const links = document.querySelectorAll<HTMLAnchorElement>(".dc-mobile-menu a");
    const close = () => { if (toggle) toggle.checked = false; };
    links.forEach((a) => a.addEventListener("click", close));
    return () => links.forEach((a) => a.removeEventListener("click", close));
  }, []);

  const html = locale === "es" ? LANDING_ES : LANDING_EN;
  return <div className="dc-landing" dangerouslySetInnerHTML={{ __html: html }} />;
}
