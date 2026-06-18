import { defineRouting } from "next-intl/routing";

// Bilingual from the schema up: English and Spanish are first-class.
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
