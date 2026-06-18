import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/app/OnboardingWizard";

const T = {
  en: { hi: "Welcome", notLinked: "You're signed in, but your account isn't linked to a client profile yet. Your coach will set this up after your consult.", done: "Thanks — your onboarding is complete. Your coach is preparing your plan.", signedInAs: "Signed in as" },
  es: { hi: "Bienvenido/a", notLinked: "Iniciaste sesión, pero tu cuenta aún no está vinculada a un perfil de cliente. Tu coach lo configurará después de tu consulta.", done: "Gracias — completaste tu onboarding. Tu coach está preparando tu plan.", signedInAs: "Sesión iniciada como" },
};

type Opt = { v: string; en: string; es: string };

export default async function AppHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = T[locale === "es" ? "es" : "en"];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/app/login`);

  const core = supabase.schema("core");
  const { data: clients } = await core.from("clients").select("id, display_name, status").limit(1);
  const client = clients?.[0] as { id: string; display_name: string | null; status: string } | undefined;

  const shell = (inner: ReactNode) => (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "'Inter', system-ui, sans-serif", color: "#11201C" }}>
      <p style={{ fontSize: 13, color: "#5C6B66" }}>{t.signedInAs} {user!.email}</p>
      {inner}
    </div>
  );

  if (!client) return shell(<p style={{ marginTop: 16, color: "#5C6B66" }}>{t.notLinked}</p>);

  const { data: subs } = await core
    .from("intake_submissions")
    .select("id, status, template_id")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false })
    .limit(1);
  const sub = subs?.[0] as { id: string; status: string; template_id: string } | undefined;

  if (sub?.status === "submitted") {
    return shell(
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0B3D33" }}>{t.hi}{client.display_name ? `, ${client.display_name}` : ""}</h1>
        <p style={{ marginTop: 12, padding: 16, borderRadius: 14, background: "#ECFBF4", color: "#0B3D33", fontWeight: 600 }}>{t.done}</p>
      </div>,
    );
  }

  const { data: tmpls } = await core.from("intake_templates").select("id, tenant_id").eq("active", true).limit(1);
  const template = tmpls?.[0] as { id: string; tenant_id: string } | undefined;
  if (!template) return shell(<p style={{ color: "#5C6B66" }}>{t.notLinked}</p>);

  // The screening step is driven by the DB question so risk flags stay in sync.
  const { data: medQ } = await core
    .from("intake_questions")
    .select("id, options")
    .eq("template_id", template.id)
    .eq("code", "medical_conditions")
    .single();
  const mq = medQ as { id: string; options: { value: string; en?: string; es?: string }[] } | null;
  if (!mq) return shell(<p style={{ color: "#5C6B66" }}>{t.notLinked}</p>);

  const conditionOptions: Opt[] = (mq.options ?? []).map((o) => ({ v: o.value, en: o.en ?? o.value, es: o.es ?? o.en ?? o.value }));

  return (
    <OnboardingWizard
      locale={locale}
      tenantId={template.tenant_id}
      clientId={client.id}
      templateId={template.id}
      existingSubmissionId={sub?.id ?? null}
      medicalQuestionId={mq.id}
      conditionOptions={conditionOptions}
      userEmail={user!.email ?? ""}
      displayName={client.display_name}
    />
  );
}
