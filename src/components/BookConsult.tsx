"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";

export function BookConsult() {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal("ui", { theme: "light" });
    })();
  }, []);

  return (
    <Cal
      calLink="sb-weight-00lr1t/30min"
      style={{ width: "100%", height: "630px", overflow: "scroll" }}
      config={{ layout: "month_view" }}
    />
  );
}
