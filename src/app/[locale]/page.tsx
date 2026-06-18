import Image from "next/image";
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

  const services = [
    {
      key: "nutrition",
      icon: (
        <path d="M11 3C7 3 4 6 4 10c0 5 4 9 8 11 4-2 8-6 8-11 0-4-3-7-7-7-1.5 0-3 .6-4 1.6C8.9 3.6 8 3 11 3Z" />
      ),
    },
    { key: "movement", icon: <path d="M3 12h4l3 7 4-14 3 7h4" /> },
    {
      key: "habits",
      icon: (
        <path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21Z" />
      ),
    },
    {
      key: "support",
      icon: <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" />,
    },
  ] as const;

  return (
    <main className="min-h-screen bg-[var(--surface-0)] text-[var(--ink-900)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--line-200)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-3">
            <CompassMark size={36} />
            <span className="font-semibold tracking-tight">{t("common.brand")}</span>
          </a>
          <nav className="flex items-center gap-6 text-sm text-[var(--ink-500)]">
            <a className="hidden hover:text-[var(--ink-900)] md:inline" href="#services">{t("nav.services")}</a>
            <a className="hidden hover:text-[var(--ink-900)] md:inline" href="#about">{t("nav.about")}</a>
            <a className="hidden hover:text-[var(--ink-900)] md:inline" href="#how">{t("nav.how")}</a>
            <a className="hidden hover:text-[var(--ink-900)] md:inline" href="#faq">{t("nav.faq")}</a>
            <LocaleSwitcher locale={locale} />
            <a href="#consult" className="rounded-full bg-[var(--compass-green-600)] px-4 py-2 font-medium text-white transition hover:bg-[var(--compass-green-700)]">
              {t("common.bookConsult")}
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[var(--compass-green-200)] opacity-40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-20 top-32 h-80 w-80 rounded-full bg-[var(--wayfinding-amber)] opacity-20 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--compass-green-200)] bg-[var(--compass-green-50)] px-3 py-1 text-sm font-medium text-[var(--compass-green-700)]">
              <span className="h-2 w-2 rounded-full bg-[var(--compass-green-600)]" />
              {t("hero.eyebrow")}
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[var(--ink-500)]">{t("hero.subtitle")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href="#consult" className="rounded-full bg-[var(--compass-green-600)] px-6 py-3 font-medium text-white shadow-sm transition hover:bg-[var(--compass-green-700)]">
                {t("hero.ctaPrimary")}
              </a>
              <a href="#how" className="rounded-full border border-[var(--line-200)] px-6 py-3 font-medium text-[var(--ink-900)] transition hover:border-[var(--compass-green-600)]">
                {t("hero.ctaSecondary")}
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--ink-500)]">
              {(["trust1", "trust2", "trust3"] as const).map((k) => (
                <span key={k} className="inline-flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--compass-green-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  {t(`hero.${k}`)}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-[var(--line-200)]">
              <Image src="/img/hero-portrait.jpg" alt={t("about.name")} width={820} height={1040} priority className="h-auto w-full object-cover" />
            </div>
            <div className="absolute -bottom-5 -left-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-[var(--line-200)]">
              <CompassMark size={34} />
              <div>
                <p className="text-sm font-semibold leading-tight">{t("hero.badge")}</p>
                <p className="text-xs text-[var(--ink-500)]">{t("common.brand")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-[var(--line-200)] bg-[var(--compass-green-700)] text-white">
        <div className="mx-auto grid max-w-6xl gap-3 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
          {(["a", "b", "c", "d"] as const).map((k) => (
            <div key={k} className="flex items-center gap-2 text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--wayfinding-amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              <span className="text-[var(--compass-green-50)]">{t(`strip.${k}`)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--compass-green-600)]">{t("services.eyebrow")}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t("services.title")}</h2>
          <p className="mt-3 text-[var(--ink-500)]">{t("services.subtitle")}</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div key={s.key} className="rounded-2xl border border-[var(--line-200)] bg-white p-6 transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--compass-green-50)] text-[var(--compass-green-700)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
              </div>
              <h3 className="mt-4 font-semibold">{t(`services.${s.key}Title`)}</h3>
              <p className="mt-2 text-sm text-[var(--ink-500)]">{t(`services.${s.key}Body`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-[var(--compass-green-50)]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div className="order-2 overflow-hidden rounded-[2rem] shadow-lg ring-1 ring-[var(--line-200)] lg:order-1">
            <Image src="/img/about-sebastian.jpg" alt={t("about.name")} width={1040} height={800} className="h-auto w-full object-cover" />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--compass-green-600)]">{t("about.eyebrow")}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t("about.name")}</h2>
            <p className="text-[var(--compass-green-700)]">{t("about.role")}</p>
            <p className="mt-5 text-[var(--ink-500)]">{t("about.body1")}</p>
            <p className="mt-3 text-[var(--ink-500)]">{t("about.body2")}</p>
            <div className="mt-6 rounded-2xl border border-[var(--compass-green-200)] bg-white p-5">
              <p className="flex items-center gap-2 font-semibold text-[var(--compass-green-700)]">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--status-green)]" />
                {t("about.calloutTitle")}
              </p>
              <p className="mt-2 text-sm text-[var(--ink-500)]">{t("about.calloutBody")}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {(["chip1", "chip2", "chip3", "chip4"] as const).map((k) => (
                <span key={k} className="rounded-full bg-white px-3 py-1 text-sm text-[var(--ink-900)] ring-1 ring-[var(--line-200)]">{t(`about.${k}`)}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--compass-green-600)]">{t("how.eyebrow")}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t("how.title")}</h2>
          <p className="mt-3 text-[var(--ink-500)]">{t("how.subtitle")}</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="relative rounded-2xl border border-[var(--line-200)] bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--compass-green-600)] font-semibold text-white">{n}</div>
              <h3 className="mt-4 font-semibold">{t(`how.step${n}Title`)}</h3>
              <p className="mt-2 text-sm text-[var(--ink-500)]">{t(`how.step${n}Body`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[var(--compass-green-50)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--compass-green-600)]">{t("testimonials.eyebrow")}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{t("testimonials.title")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {([1, 2] as const).map((n) => (
              <figure key={n} className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-[var(--line-200)]">
                <div className="text-3xl leading-none text-[var(--compass-green-200)]">&ldquo;</div>
                <blockquote className="mt-2 text-lg text-[var(--ink-900)]">{t(`testimonials.q${n}`)}</blockquote>
                <figcaption className="mt-4 text-sm font-medium text-[var(--ink-500)]">{t(`testimonials.n${n}`)}</figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 text-xs text-[var(--ink-500)]">{t("testimonials.note")}</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight">{t("faq.title")}</h2>
        <div className="mt-8 divide-y divide-[var(--line-200)] border-y border-[var(--line-200)]">
          {([1, 2, 3, 4] as const).map((n) => (
            <details key={n} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {t(`faq.q${n}`)}
                <span className="text-[var(--compass-green-600)] transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[var(--ink-500)]">{t(`faq.a${n}`)}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Consult / booking */}
      <section id="consult" className="border-t border-[var(--line-200)] bg-[var(--compass-green-700)]">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--wayfinding-amber)]">{t("consult.eyebrow")}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">{t("consult.title")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-[var(--compass-green-50)]">{t("consult.subtitle")}</p>
          <div className="mt-8 overflow-hidden rounded-2xl bg-white p-2 text-left shadow-xl">
            <BookConsult />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--ink-900)] text-[var(--compass-green-50)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex items-center gap-3">
            <CompassMark size={34} />
            <span className="font-semibold text-white">{t("common.brand")}</span>
          </div>
          <p className="mt-5 max-w-3xl text-xs leading-relaxed text-white/60">{t("disclaimer.text")}</p>
          <p className="mt-6 text-xs text-white/50">© {new Date().getFullYear()} {t("common.brand")}. {t("footer.rights")}</p>
        </div>
      </footer>
    </main>
  );
}
