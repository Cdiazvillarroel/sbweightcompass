import { setRequestLocale, getTranslations } from "next-intl/server";
import { CompassMark } from "@/components/CompassMark";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { BookConsult } from "@/components/BookConsult";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="min-h-screen bg-[var(--surface-0)] text-[var(--ink-900)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <CompassMark size={40} />
          <span className="font-semibold tracking-tight">{t("common.brand")}</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-[var(--ink-500)]">
          <a className="hidden hover:text-[var(--ink-900)] sm:inline" href="#how">
            {t("nav.how")}
          </a>
          <a className="hidden hover:text-[var(--ink-900)] sm:inline" href="#approach">
            {t("nav.approach")}
          </a>
          <LocaleSwitcher locale={locale} />
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 sm:pt-20">
        <p className="mb-4 text-sm font-medium uppercase tracking-wide text-[var(--compass-green-600)]">
          {t("hero.eyebrow")}
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--ink-500)]">{t("hero.subtitle")}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#consult"
            className="rounded-full bg-[var(--compass-green-600)] px-6 py-3 font-medium text-white transition hover:bg-[var(--compass-green-700)]"
          >
            {t("hero.cta")}
          </a>
          <a
            href="#how"
            className="rounded-full border border-[var(--line-200)] px-6 py-3 font-medium text-[var(--ink-900)] transition hover:border-[var(--compass-green-600)]"
          >
            {t("hero.secondary")}
          </a>
        </div>
      </section>

      <section id="how" className="border-t border-[var(--line-200)] bg-[var(--compass-green-50)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">{t("how.title")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {([1, 2, 3] as const).map((n) => (
              <div key={n} className="rounded-2xl border border-[var(--line-200)] bg-white p-6">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--compass-green-600)] font-semibold text-white">
                  {n}
                </div>
                <h3 className="font-semibold">{t(`how.step${n}Title`)}</h3>
                <p className="mt-2 text-sm text-[var(--ink-500)]">{t(`how.step${n}Body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="approach" className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-[var(--line-200)] p-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--compass-green-50)] px-3 py-1 text-sm font-medium text-[var(--compass-green-700)]">
            <span className="h-2 w-2 rounded-full bg-[var(--status-green)]" />
            {t("approach.title")}
          </span>
          <p className="mt-4 max-w-2xl text-[var(--ink-500)]">{t("approach.body")}</p>
        </div>
      </section>

      <section id="consult" className="border-t border-[var(--line-200)] bg-[var(--compass-green-50)]">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">{t("consult.title")}</h2>
          <p className="mt-2 text-[var(--ink-500)]">{t("consult.subtitle")}</p>
          <div className="mt-6 rounded-2xl border border-[var(--line-200)] bg-white p-2">
            <BookConsult />
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--line-200)]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="max-w-3xl text-xs leading-relaxed text-[var(--ink-500)]">
            {t("disclaimer.text")}
          </p>
          <p className="mt-4 text-xs text-[var(--ink-500)]">
            © {new Date().getFullYear()} {t("common.brand")}. {t("footer.rights")}
          </p>
        </div>
      </footer>
    </main>
  );
}
