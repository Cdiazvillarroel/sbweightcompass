import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { DesignLanding } from "@/components/DesignLanding";

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { locale } = await params;
  const { code } = await searchParams;

  // Safety net: if a magic-link lands on the root with ?code=, complete sign-in.
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    redirect(`/${locale}/app`);
  }

  setRequestLocale(locale);
  return <DesignLanding locale={locale} />;
}
