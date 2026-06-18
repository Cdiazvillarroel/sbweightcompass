"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitLead, type LeadState } from "@/app/[locale]/actions";

const initial: LeadState = { ok: false };

export function LeadForm({ locale }: { locale: string }) {
  const t = useTranslations("consult.form");
  const [state, action, pending] = useActionState(submitLead, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-[var(--compass-green-200)] bg-white p-6 font-medium text-[var(--compass-green-700)]">
        {t("success")}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label htmlFor="lead-name" className="block text-sm font-medium text-[var(--ink-900)]">
          {t("name")}
        </label>
        <input
          id="lead-name"
          name="fullName"
          type="text"
          autoComplete="name"
          className="mt-1 w-full rounded-xl border border-[var(--line-200)] bg-white px-4 py-3 outline-none transition focus:border-[var(--compass-green-600)]"
        />
      </div>
      <div>
        <label htmlFor="lead-email" className="block text-sm font-medium text-[var(--ink-900)]">
          {t("email")}
        </label>
        <input
          id="lead-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-[var(--line-200)] bg-white px-4 py-3 outline-none transition focus:border-[var(--compass-green-600)]"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-[var(--status-red)]">{t("error")}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--compass-green-600)] px-6 py-3 font-medium text-white transition hover:bg-[var(--compass-green-700)] disabled:opacity-60"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
