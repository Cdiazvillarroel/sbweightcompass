"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";
import { LANDING_ES } from "@/landing/landing-es";

// Renders the approved Claude Design landing and mounts the Cal.com inline
// booking widget into the #cal-inline slot inside the "agenda" section.
export function DesignLanding() {
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

  return <div dangerouslySetInnerHTML={{ __html: LANDING_ES }} />;
}
