"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { useTranslations } from "next-intl";

export function BookConsult() {
  const t = useTranslations("consult");

  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal("ui", { theme: "light", hideEventTypeDetails: false, layout: "month_view" });
    })();
  }, []);

  return (
    <div>
      <p className="px-3 pt-2 pb-3 text-sm font-medium text-[var(--ink-500)]">
        {t("bookDirect")}
      </p>
      <Cal
        calLink="sb-weight-00lr1t/30min"
        style={{ width: "100%", height: "560px", overflow: "scroll" }}
        config={{ layout: "month_view" }}
      />
    </div>
  );
}
