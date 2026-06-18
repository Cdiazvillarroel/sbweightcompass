"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher({ locale }: { locale: string }) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  const other = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: other })}
      className="rounded-full border border-[var(--line-200)] px-3 py-1 text-sm font-medium text-[var(--ink-500)] transition hover:border-[var(--compass-green-600)] hover:text-[var(--compass-green-700)]"
    >
      {t("switchTo")}
    </button>
  );
}
