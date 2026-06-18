import { createClient } from "@/lib/supabase/server";

const T = {
  en: { title: "Profile", account: "Account", name: "Name", email: "Email", goals: "Goals", goalWeight: "Goal weight", membership: "Membership", status: "Status", lang: "Language", switchTo: "Cambiar a Español", none: "—" },
  es: { title: "Perfil", account: "Cuenta", name: "Nombre", email: "Correo", goals: "Objetivos", goalWeight: "Peso meta", membership: "Membresía", status: "Estado", lang: "Idioma", switchTo: "Switch to English", none: "—" },
};
const card = { background: "#fff", border: "1px solid #E8ECEA", borderRadius: 20, padding: "22px 22px", boxShadow: "0 24px 50px -36px rgba(11,61,51,0.35)" } as const;
const eyebrow = { fontSize: 12.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#0EA672" } as const;
const row = { display: "flex", justifyContent: "space-between", gap: 16, padding: "11px 0", borderBottom: "1px solid #F0F4F2", fontSize: 15 } as const;

export default async function Perfil({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === "es" ? "es" : "en";
  const t = T[lang];
  const other = lang === "es" ? "en" : "es";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const core = supabase.schema("core");
  const { data: clients } = await core.from("clients").select("id, display_name, email, status, membership_id").limit(1);
  const client = clients?.[0] as { id: string; display_name: string | null; email: string | null; status: string; membership_id: string | null } | undefined;

  let memStatus: string | null = null;
  if (client?.membership_id) {
    const { data: mem } = await core.from("memberships").select("status").eq("id", client.membership_id).single();
    memStatus = (mem as { status: string } | null)?.status ?? null;
  }
  const { data: subsRaw } = await core.from("intake_submissions").select("profile").eq("client_id", client?.id ?? "").order("created_at", { ascending: false }).limit(1);
  const profile = ((subsRaw?.[0] as { profile?: Record<string, unknown> } | undefined)?.profile ?? {}) as Record<string, unknown>;
  const goalWeight = Number(profile.goalWeight) || null;
  const goals = Array.isArray(profile.goals) ? (profile.goals as string[]) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0B3D33", margin: 0, letterSpacing: "-0.02em" }}>{t.title}</h1>

      <div style={card}>
        <span style={eyebrow}>{t.account}</span>
        <div style={{ marginTop: 10 }}>
          <div style={row}><span style={{ color: "#5C6B66" }}>{t.name}</span><b style={{ color: "#0B3D33" }}>{client?.display_name ?? t.none}</b></div>
          <div style={row}><span style={{ color: "#5C6B66" }}>{t.email}</span><b style={{ color: "#0B3D33" }}>{client?.email ?? user?.email ?? t.none}</b></div>
          <div style={{ ...row, borderBottom: "none" }}><span style={{ color: "#5C6B66" }}>{t.lang}</span><a href={`/${other}/app/perfil`} style={{ color: "#0EA672", fontWeight: 700, textDecoration: "none" }}>{t.switchTo}</a></div>
        </div>
      </div>

      <div style={card}>
        <span style={eyebrow}>{t.goals}</span>
        <div style={{ marginTop: 10 }}>
          <div style={row}><span style={{ color: "#5C6B66" }}>{t.goalWeight}</span><b style={{ color: "#0B3D33" }}>{goalWeight !== null ? `${goalWeight} kg` : t.none}</b></div>
          <div style={{ ...row, borderBottom: "none", flexWrap: "wrap" }}>
            {goals.length ? goals.map((g) => <span key={g} style={{ fontSize: 13, fontWeight: 600, color: "#0B3D33", background: "#ECFBF4", border: "1px solid #A7E8CF", padding: "5px 11px", borderRadius: 999, marginRight: 8 }}>{g}</span>) : <span style={{ color: "#93A09B" }}>{t.none}</span>}
          </div>
        </div>
      </div>

      <div style={card}>
        <span style={eyebrow}>{t.membership}</span>
        <div style={{ marginTop: 10 }}>
          <div style={{ ...row, borderBottom: "none" }}><span style={{ color: "#5C6B66" }}>{t.status}</span><b style={{ color: "#0B3D33", textTransform: "capitalize" }}>{memStatus ?? client?.status ?? t.none}</b></div>
        </div>
      </div>
    </div>
  );
}
