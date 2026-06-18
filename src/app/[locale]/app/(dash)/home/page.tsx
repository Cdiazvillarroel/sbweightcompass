import { createClient } from "@/lib/supabase/server";
import { Sparkline } from "@/components/app/Sparkline";

const T = {
  en: { hi: "Hi", today: "Here's your progress so far.", weight: "Weight", logFirst: "Log your first weight to start your curve.", toGoal: (n: number) => `${n} kg to your goal`, atGoal: "You're at your goal 🎉", goal: "Goal", next: "Next session", none: "No upcoming session booked.", book: "Book a session", logNow: "Log today", open: "Open" },
  es: { hi: "Hola", today: "Tu progreso hasta ahora.", weight: "Peso", logFirst: "Registra tu primer peso para iniciar tu curva.", toGoal: (n: number) => `${n} kg para tu meta`, atGoal: "¡Llegaste a tu meta! 🎉", goal: "Meta", next: "Próxima sesión", none: "No tienes sesiones agendadas.", book: "Agendar sesión", logNow: "Registrar hoy", open: "Abrir" },
};
const card = { background: "#fff", border: "1px solid #E8ECEA", borderRadius: 20, padding: "22px 22px", boxShadow: "0 24px 50px -36px rgba(11,61,51,0.35)" } as const;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === "es" ? "es" : "en";
  const t = T[lang];
  const supabase = await createClient();
  const core = supabase.schema("core");
  const { data: clients } = await core.from("clients").select("id, display_name").limit(1);
  const client = clients?.[0] as { id: string; display_name: string | null } | undefined;
  if (!client) return null;

  const { data: defsRaw } = await core.from("metric_definitions").select("id, code, unit");
  const defs = (defsRaw ?? []) as { id: string; code: string; unit: string }[];
  const weightDef = defs.find((d) => d.code === "weight");
  const { data: entriesRaw } = await core.from("metric_entries").select("value, recorded_at, metric_def_id").eq("client_id", client.id).order("recorded_at", { ascending: true });
  const entries = (entriesRaw ?? []) as { value: number; recorded_at: string; metric_def_id: string }[];
  const wpts = entries.filter((e) => e.metric_def_id === weightDef?.id).map((e) => ({ t: Date.parse(e.recorded_at), v: Number(e.value) }));
  const last = wpts.length ? wpts[wpts.length - 1].v : null;

  const { data: subsRaw } = await core.from("intake_submissions").select("profile").eq("client_id", client.id).order("created_at", { ascending: false }).limit(1);
  const profile = ((subsRaw?.[0] as { profile?: Record<string, unknown> } | undefined)?.profile ?? {}) as Record<string, unknown>;
  const goal = Number(profile.goalWeight) || null;

  const { data: apptRaw } = await core.from("appointments").select("title, starts_at, status").eq("client_id", client.id).gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(1);
  const appt = apptRaw?.[0] as { title: string | null; starts_at: string; status: string } | undefined;

  const name = client.display_name ? `, ${client.display_name.split(" ")[0]}` : "";
  const delta = last !== null && goal !== null ? Math.round((last - goal) * 10) / 10 : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 27, fontWeight: 800, color: "#0B3D33", margin: 0, letterSpacing: "-0.02em" }}>{t.hi}{name}</h1>
        <p style={{ margin: "6px 0 0", color: "#5C6B66", fontSize: 15.5 }}>{t.today}</p>
      </div>

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#0EA672" }}>{t.weight}</span>
          {goal !== null && <span style={{ fontSize: 13, color: "#5C6B66" }}>{t.goal}: <b style={{ color: "#0B3D33" }}>{goal} kg</b></span>}
        </div>
        {last === null ? (
          <p style={{ margin: "14px 0 0", color: "#5C6B66" }}>{t.logFirst}</p>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "8px 0 6px" }}>
              <span style={{ fontSize: 38, fontWeight: 800, color: "#0B3D33", lineHeight: 1 }}>{last}<span style={{ fontSize: 18, color: "#5C6B66", fontWeight: 600 }}> kg</span></span>
              {delta !== null && <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0B3D33", background: "#ECFBF4", border: "1px solid #A7E8CF", padding: "5px 11px", borderRadius: 999 }}>{delta <= 0 ? t.atGoal : t.toGoal(delta)}</span>}
            </div>
            <Sparkline points={wpts} goal={goal} unit=" kg" />
          </>
        )}
        <a href={`/${locale}/app/cuerpo`} style={{ display: "inline-block", marginTop: 12, fontSize: 14.5, fontWeight: 700, color: "#0EA672", textDecoration: "none" }}>{t.logNow} →</a>
      </div>

      <div style={card}>
        <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#0EA672" }}>{t.next}</span>
        {appt ? (
          <p style={{ margin: "10px 0 0", fontSize: 16, color: "#0B3D33", fontWeight: 600 }}>
            {appt.title || "Coaching"}<br />
            <span style={{ fontWeight: 500, color: "#5C6B66", fontSize: 14.5 }}>{new Date(appt.starts_at).toLocaleString(locale, { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        ) : (
          <p style={{ margin: "10px 0 0", color: "#5C6B66" }}>{t.none} <a href={`/${locale}#agenda`} style={{ color: "#0EA672", fontWeight: 700, textDecoration: "none" }}>{t.book} →</a></p>
        )}
      </div>
    </div>
  );
}
