import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/app/OnboardingWizard";
import { ClientApp, type AppData } from "@/components/app/ClientApp";

const T = {
  en: { notLinked: "You're signed in, but your account isn't linked to a client profile yet. Your coach will set this up after your consult.", signedInAs: "Signed in as" },
  es: { notLinked: "Iniciaste sesión, pero tu cuenta aún no está vinculada a un perfil de cliente. Tu coach lo configurará después de tu consulta.", signedInAs: "Sesión iniciada como" },
};
type Opt = { v: string; en: string; es: string };

export default async function AppHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const es = locale === "es";
  const t = T[es ? "es" : "en"];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/app/login`);

  const core = supabase.schema("core");
  const { data: clients } = await core.from("clients").select("id, tenant_id, display_name, email, status, membership_id").limit(1);
  const client = clients?.[0] as { id: string; tenant_id: string; display_name: string | null; email: string | null; status: string; membership_id: string | null } | undefined;

  const shell = (inner: ReactNode) => (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "'Inter', system-ui, sans-serif", color: "#11201C" }}>
      <p style={{ fontSize: 13, color: "#5C6B66" }}>{t.signedInAs} {user!.email}</p>
      {inner}
    </div>
  );
  if (!client) return shell(<p style={{ marginTop: 16, color: "#5C6B66" }}>{t.notLinked}</p>);

  const { data: subs } = await core.from("intake_submissions").select("id, status, profile").eq("client_id", client.id).order("created_at", { ascending: false }).limit(1);
  const sub = subs?.[0] as { id: string; status: string; profile: Record<string, unknown> | null } | undefined;

  // ---- Onboarding not complete -> wizard ----
  if (sub?.status !== "submitted") {
    const { data: tmpls } = await core.from("intake_templates").select("id, tenant_id").eq("active", true).limit(1);
    const template = tmpls?.[0] as { id: string; tenant_id: string } | undefined;
    if (!template) return shell(<p style={{ color: "#5C6B66" }}>{t.notLinked}</p>);
    const { data: medQ } = await core.from("intake_questions").select("id, options").eq("template_id", template.id).eq("code", "medical_conditions").single();
    const mq = medQ as { id: string; options: { value: string; en?: string; es?: string }[] } | null;
    if (!mq) return shell(<p style={{ color: "#5C6B66" }}>{t.notLinked}</p>);
    const conditionOptions: Opt[] = (mq.options ?? []).map((o) => ({ v: o.value, en: o.en ?? o.value, es: o.es ?? o.en ?? o.value }));
    return (
      <OnboardingWizard locale={locale} tenantId={template.tenant_id} clientId={client.id} templateId={template.id}
        existingSubmissionId={sub?.id ?? null} medicalQuestionId={mq.id} conditionOptions={conditionOptions}
        userEmail={user!.email ?? ""} displayName={client.display_name} />
    );
  }

  // ---- Onboarding complete -> the tracking app (SPA) ----
  const { data: defsRaw } = await core.from("metric_definitions").select("id, code");
  const defs = Object.fromEntries(((defsRaw ?? []) as { id: string; code: string }[]).map((d) => [d.code, d.id])) as Record<string, string>;
  const { data: entriesRaw } = await core.from("metric_entries").select("value, recorded_at, metric_def_id").eq("client_id", client.id).order("recorded_at", { ascending: true });
  const entries = (entriesRaw ?? []) as { value: number; recorded_at: string; metric_def_id: string }[];

  const series: Record<string, { t: number; v: number }[]> = {};
  for (const code of ["weight", "waist", "hip", "body_fat", "water", "sleep", "mood"]) {
    const id = defs[code];
    series[code] = entries.filter((e) => e.metric_def_id === id).map((e) => ({ t: Date.parse(e.recorded_at), v: Number(e.value) }));
  }
  const wpts = series.weight ?? [];
  const wCurrent = wpts.length ? wpts[wpts.length - 1].v : null;
  const wFirst = wpts.length ? wpts[0].v : null;
  const delta = wCurrent !== null && wFirst !== null ? Math.round((wCurrent - wFirst) * 10) / 10 : null;

  const profile = (sub?.profile ?? {}) as Record<string, unknown>;
  const goal = Number(profile.goalWeight) || null;
  const heightCm = Number(profile.height) || null;
  const goals = Array.isArray(profile.goals) ? (profile.goals as string[]) : [];

  const days = new Set(entries.map((e) => e.recorded_at.slice(0, 10)));
  let streak = 0;
  for (let i = 0; ; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (days.has(d.toISOString().slice(0, 10))) streak++; else break; }

  const { data: apptRaw } = await core.from("appointments").select("title, starts_at").eq("client_id", client.id).gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(1);
  const appt = apptRaw?.[0] as { title: string | null; starts_at: string } | undefined;

  let membership: string | null = client.status;
  if (client.membership_id) {
    const { data: mem } = await core.from("memberships").select("status").eq("id", client.membership_id).single();
    membership = (mem as { status: string } | null)?.status ?? client.status;
  }

  const fullName = client.display_name ?? (es ? "Cliente" : "Client");
  const initials = fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const todayLabel = (es ? "Hoy · " : "Today · ") + new Date().toLocaleDateString(locale, { weekday: "long" });

  const data: AppData = {
    tenantId: client.tenant_id, clientId: client.id,
    name: fullName.split(" ")[0], fullName, initials,
    email: client.email ?? user!.email ?? "",
    membership, goals, todayLabel, streak, goal, heightCm,
    weight: { current: wCurrent, delta },
    series, defs,
    nextAppt: appt ? { whenLabel: new Date(appt.starts_at).toLocaleString(locale, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) } : null,
  };

  return <ClientApp locale={locale} data={data} />;
}
