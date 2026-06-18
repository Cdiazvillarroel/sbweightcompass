import { setRequestLocale } from "next-intl/server";
import { DesignLanding } from "@/components/DesignLanding";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DesignLanding />;
}
