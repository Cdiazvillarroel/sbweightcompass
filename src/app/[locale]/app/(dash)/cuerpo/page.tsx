import { createClient } from "@/lib/supabase/server";
import { Sparkline } from "@/components/app/Sparkline";
import { MetricLogger, type Metric } from "@/components/app/MetricLogger";

const T = {
  en: { title: "My body", weight: "Weight", anthro: "Anthropometry", habits: "Today's habits", logWeight: "Save weight", logAnthro: "Save measurements", logHabits: "Save habits", saving: "Saving…", saved: "Saved ✓", err: "Couldn't save. Try again.", none: "No data yet — add your first entry below.", latest: "Latest" },
  es: { title: "Mi cuerpo", weight: "Peso", anthro: "Antropometría", habits: "Hábitos de hoy", logWeight: "Guardar peso", logAnthro: "Guardar medidas", logHabits: "Guardar hábitos", saving: "Guardando…", saved: "Guardado ✓", err: "No se pudo guardar. Reintenta.", none: "Aún sin datos — agrega tu primer registro abajo.", latest: "Último" },
};
const card = { background: "#fff", border: "1px solid #E8ECEA", borderRadius: 20, padding: "22px 22px", boxShadow: "0 24px 50px -36px rgba(11,61,51,0.35)" } as const;
const eyebrow = { fontSize: 12.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#0EA672" } as const;

export default async function Cuerpo({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === "es" ? "es" : "en";
  const t = T[lang];
  const supabase = await createClient();
  const core = supabase.schema("core");
  const { data: clients } = await core.from("clients").select("id, tenant_id").limit(1);
  const client = clients?.[0] as { id: string; tenant_id: string } | undefined;
  if (!client) return null;

  const { data: defsRaw } = await core.from("metric_definitions").select("id, code, unit, label");
  const defs = (defsRaw ?? []) as { id: string; code: string; unit: string; label: Record<string, string> }[];
  const dmap = Object.fromEntries(defs.map((d) => [d.code, d]));
  const { data: entriesRaw } = await core.from("metric_entries").select("value, recorded_at, metric_def_id").eq("client_id", client.id).order("recorded_at", { ascending: true });
  const entries = (entriesRaw ?? []) as { value: number; recorded_at: string; metric_def_id: string }[];
  const pts = (code: string) => { const id = dmap[code]?.id; return entries.filter((e) => e.metric_def_id === id).map((e) => ({ t: Date.parse(e.recorded_at), v: Number(e.value) })); };
  const lastV = (code: string) => { const p = pts(code); return p.length ? p[p.length - 1].v : null; };
  const lbl = (code: string) => dmap[code]?.label?.[lang] ?? code;
  const mk = (code: string, step: number): Metric | null => dmap[code] ? { code, defId: dmap[code].id, label: lbl(code), unit: dmap[code].unit, step } : null;

  const weightPts = pts("weight");
  const goal = (() => {
    return null as number | null;
  })();
  const anthro: Metric[] = [mk("waist", 0.5), mk("hip", 0.5), mk("body_fat", 0.1)].filter(Boolean) as Metric[];
  const habits: Metric[] = [mk("water", 1), mk("sleep", 0.5), mk("mood", 1)].filter(Boolean) as Metric[];
  const tiles = ["waist", "hip", "body_fat"].filter((c) => dmap[c]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0B3D33", margin: 0, letterSpacing: "-0.02em" }}>{t.title}</h1>

      <div style={card}>
        <span style={eyebrow}>{t.weight}</span>
        <div style={{ margin: "10px 0 14px" }}>{weightPts.length ? <Sparkline points={weightPts} goal={goal} unit=" kg" /> : <p style={{ color: "#93A09B", fontSize: 14 }}>{t.none}</p>}</div>
        {dmap.weight && <MetricLogger tenantId={client.tenant_id} clientId={client.id} cols={1} metrics={[{ code: "weight", defId: dmap.weight.id, label: lbl("weight"), unit: "kg", step: 0.1 }]} cta={t.logWeight} saving={t.saving} saved={t.saved} errorLabel={t.err} />}
      </div>

      <div style={card}>
        <span style={eyebrow}>{t.anthro}</span>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(tiles.length, 1)}, 1fr)`, gap: 12, margin: "12px 0 16px" }}>
          {tiles.map((c) => (
            <div key={c} style={{ background: "#F7FBF9", border: "1px solid #E8ECEA", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 12.5, color: "#5C6B66", fontWeight: 600 }}>{lbl(c)}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0B3D33", marginTop: 4 }}>{lastV(c) ?? "—"}<span style={{ fontSize: 13, color: "#93A09B", fontWeight: 600 }}> {dmap[c]?.unit}</span></div>
            </div>
          ))}
        </div>
        {anthro.length > 0 && <MetricLogger tenantId={client.tenant_id} clientId={client.id} cols={3} metrics={anthro} cta={t.logAnthro} saving={t.saving} saved={t.saved} errorLabel={t.err} />}
      </div>

      <div style={card}>
        <span style={eyebrow}>{t.habits}</span>
        <div style={{ height: 12 }} />
        {habits.length > 0 && <MetricLogger tenantId={client.tenant_id} clientId={client.id} cols={3} metrics={habits} cta={t.logHabits} saving={t.saving} saved={t.saved} errorLabel={t.err} />}
      </div>
    </div>
  );
}
