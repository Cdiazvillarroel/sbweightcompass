import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

// `/` is normally handled by the next-intl middleware; this is a safety net.
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
