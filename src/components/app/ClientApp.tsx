"use client";

import { useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkline } from "@/components/app/Sparkline";
import { MetricLogger, type Metric } from "@/components/app/MetricLogger";

type Pt = { t: number; v: number };
export type AppData = {
  tenantId: string; clientId: string;
  name: string; fullName: string; initials: string; email: string;
  membership: string | null; goals: string[]; todayLabel: string; streak: number;
  goal: number | null; heightCm: number | null;
  weight: { current: number | null; delta: number | null };
  series: Record<string, Pt[]>;
  defs: Record<string, string>;
  history?: { title: string; date: string }[];
  checkins?: { week: string; adherence: number | null; energy: number | null }[];
  nextAppt: { whenLabel: string } | null;
};

type Seg = "inicio" | "cuerpo" | "nutricion" | "movimiento" | "coach" | "perfil";

const L = (es: boolean) => ({
  es: es, sub: "App del cliente", signout: "Cerrar sesión",
  nav: { inicio: "Inicio", cuerpo: "Mi cuerpo", nutricion: "Nutrición", movimiento: "Movimiento", coach: "Mi coach", perfil: "Perfil" } as Record<Seg, string>,
  metaSub: { inicio: es ? "Tu resumen de hoy" : "Your day at a glance", cuerpo: es ? "Peso, medidas y hábitos" : "Weight, measurements & habits", nutricion: es ? "Plan, registro y recetas" : "Plan, logging & recipes", movimiento: es ? "Pasos, entrenos y biblioteca" : "Steps, workouts & library", coach: es ? "Agenda, minutas y plan" : "Agenda, notes & plan", perfil: es ? "Cuenta, membresía e idioma" : "Account, membership & language" } as Record<Seg, string>,
  checkin: es ? "Check-in semanal" : "Weekly check-in", premium: "Premium", save: es ? "Guardar" : "Save", saving: es ? "Guardando…" : "Saving…", saved: es ? "Guardado ✓" : "Saved ✓", err: es ? "No se pudo guardar." : "Couldn't save.",
});
type TL = ReturnType<typeof L>;

const MLAB: Record<string, { en: string; es: string; u: string }> = {
  weight: { en: "Weight", es: "Peso", u: "kg" }, waist: { en: "Waist", es: "Cintura", u: "cm" }, hip: { en: "Hip", es: "Cadera", u: "cm" },
  body_fat: { en: "Body fat", es: "% grasa", u: "%" }, water: { en: "Water", es: "Agua", u: "" }, sleep: { en: "Sleep", es: "Sueño", u: "h" }, mood: { en: "Mood", es: "Ánimo", u: "" },
};

const eyebrow = { margin: 0, fontSize: 13, fontWeight: 600, color: "#5C6B66", textTransform: "uppercase", letterSpacing: ".05em" } as const;
const h3s = { margin: "0 0 10px", fontSize: 16, fontWeight: 700, color: "#0B3D33" } as const;

/* ---------------- charts ---------------- */
function Ring({ pct, color, center, label, size = 70 }: { pct: number; color: string; center: string; label?: string; size?: number }) {
  const r = size / 2 - 7, c = 2 * Math.PI * r, off = c * (1 - Math.min(Math.max(pct, 0), 1)), m = size / 2;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={m} cy={m} r={r} fill="none" stroke="#EAEFEC" strokeWidth="7" />
        <circle cx={m} cy={m} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform={`rotate(-90 ${m} ${m})`} />
        <text x={m} y={m + 5} textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#0B3D33">{center}</text>
      </svg>
      {label && <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 600, color: "#5C6B66" }}>{label}</p>}
    </div>
  );
}
function MiniSpark({ pts, color = "#0EA672" }: { pts: Pt[]; color?: string }) {
  if (!pts.length) return null;
  const w = 180, h = 44, pad = 4;
  const ys = pts.map((p) => p.v); let mn = Math.min(...ys), mx = Math.max(...ys); if (mn === mx) { mn -= 1; mx += 1; }
  const xs = pts.map((p) => p.t); const xmn = Math.min(...xs), xmx = Math.max(...xs);
  const sx = (x: number) => pad + (xmx === xmn ? w / 2 : ((x - xmn) / (xmx - xmn)) * (w - 2 * pad));
  const sy = (y: number) => pad + (1 - (y - mn) / (mx - mn)) * (h - 2 * pad);
  const d = pts.map((p, i) => (i ? "L" : "M") + sx(p.t).toFixed(1) + " " + sy(p.v).toFixed(1)).join(" ");
  const area = d + ` L ${sx(xmx).toFixed(1)} ${h} L ${sx(xmn).toFixed(1)} ${h} Z`;
  return <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none"><path d={area} fill={color} opacity="0.13" /><path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" /></svg>;
}
function Donut({ segs }: { segs: { pct: number; color: string }[] }) {
  const r = 42, C = 2 * Math.PI * r; let acc = 0;
  return (
    <svg width="118" height="118" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#EEF3F0" strokeWidth="16" />
      {segs.map((s, i) => { const len = s.pct * C; const el = <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={s.color} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 60 60)" />; acc += len; return el; })}
    </svg>
  );
}
function Bars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1); const n = values.length; const W = 340, H = 150, bw = W / n - 14;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      {values.map((v, i) => { const bh = (v / max) * 108; const x = i * (W / n) + 7; const y = 124 - bh; return <g key={i}><rect x={x} y={y} width={bw} height={bh} rx="6" fill={i === n - 1 ? "#0EA672" : "#A7E8CF"} /><text x={x + bw / 2} y={140} textAnchor="middle" fontSize="11" fill="#93A09B">{labels[i]}</text></g>; })}
    </svg>
  );
}
function Gauge({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  return (
    <div style={{ position: "relative", height: 22, margin: "6px 0" }}>
      <div style={{ height: 8, borderRadius: 999, background: "linear-gradient(90deg,#16A34A 0%,#E0A340 60%,#DC2626 100%)" }} />
      <div style={{ position: "absolute", top: -3, left: `calc(${pct * 100}% - 8px)`, width: 16, height: 16, borderRadius: "50%", background: "#fff", border: "3px solid #0B3D33" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#93A09B", marginTop: 8 }}><span>{min.toFixed(2)}</span><span>0.95</span><span>{max.toFixed(2)}</span></div>
    </div>
  );
}

function Icon({ name }: { name: Seg }) {
  const p: Record<Seg, ReactNode> = {
    inicio: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></>,
    cuerpo: <><circle cx="12" cy="5" r="2.6" /><path d="M12 8v7M8 21l4-6 4 6M7 11h10" /></>,
    nutricion: <path d="M3 2v7c0 1.1.9 2 2 2a2 2 0 0 0 2-2V2M5 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />,
    movimiento: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
    coach: <><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /></>,
    perfil: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{p[name]}</svg>;
}
const Compass = ({ s = 30, dark = false }: { s?: number; dark?: boolean }) => (
  <svg width={s} height={s} viewBox="0 0 64 64" aria-hidden><circle cx="32" cy="32" r="27" fill="none" stroke="#0EA672" strokeWidth="3.5" /><polygon points="32,7 25,39 32,33.5 39,39" fill="#E0A340" /><polygon points="32,57 25,25 32,30.5 39,25" fill={dark ? "#A7E8CF" : "#0B3D33"} /></svg>
);

export function ClientApp({ locale, data }: { locale: string; data: AppData }) {
  const es = locale === "es";
  const tl = L(es);
  const other = es ? "en" : "es";
  const [screen, setScreen] = useState<Seg>("inicio");
  const [chat, setChat] = useState(false);
  const [checkin, setCheckin] = useState(false);
  const navs: Seg[] = ["inicio", "cuerpo", "nutricion", "movimiento", "coach", "perfil"];

  const headRight = (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button className="pill ghost" onClick={() => setCheckin(true)} style={{ padding: "9px 16px", fontSize: 13.5 }}>{tl.checkin}</button>
      <span className="chip" style={{ background: "#FFF7EC", borderColor: "#F3D9A8", color: "#8A5A12" }}>{tl.premium}</span>
      <span style={{ width: 38, height: 38, borderRadius: "50%", background: "#0B3D33", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>{data.initials}</span>
    </div>
  );

  return (
    <div className="cliapp">
      <aside className="sidebar">
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 10px 20px" }}>
          <Compass s={34} dark />
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>SB My Weight Compass</span>
            <span style={{ fontWeight: 500, fontSize: 11, color: "#A7E8CF" }}>{tl.sub}</span>
          </span>
        </div>
        {navs.map((s) => <button key={s} className="snav" data-active={screen === s ? 1 : 0} onClick={() => setScreen(s)}><Icon name={s} /><span>{tl.nav[s]}</span></button>)}
        <div style={{ marginTop: "auto", paddingTop: 16 }}><a href={`/${other}/app`} style={{ color: "#A7E8CF", fontSize: 13, fontWeight: 600, textDecoration: "none", padding: "0 15px" }}>{es ? "Switch to English" : "Cambiar a Español"}</a></div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Compass s={26} /><span style={{ fontWeight: 800, fontSize: 14.5, color: "#0B3D33" }}>{tl.nav[screen]}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="pill ghost" onClick={() => setCheckin(true)} style={{ padding: "7px 12px", fontSize: 12.5 }}>{tl.checkin}</button>
            <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#0B3D33", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>{data.initials}</span>
          </div>
        </div>
        <div className="deskhead">
          <div><h1 style={{ fontSize: 24, fontWeight: 800, color: "#0B3D33", letterSpacing: "-0.02em", margin: 0 }}>{tl.nav[screen]}</h1><p style={{ margin: "3px 0 0", color: "#5C6B66", fontSize: 13.5 }}>{tl.metaSub[screen]}</p></div>
          {headRight}
        </div>

        <div className="content">
          {screen === "inicio" && <Inicio tl={tl} data={data} go={setScreen} openCheckin={() => setCheckin(true)} />}
          {screen === "cuerpo" && <Cuerpo tl={tl} data={data} />}
          {screen === "nutricion" && <Nutricion tl={tl} />}
          {screen === "movimiento" && <Movimiento tl={tl} />}
          {screen === "coach" && <Coach tl={tl} data={data} />}
          {screen === "perfil" && <Perfil tl={tl} data={data} other={other} />}
        </div>
      </div>

      <nav className="bottomnav">{navs.map((s) => <button key={s} className="navitem" data-active={screen === s ? 1 : 0} onClick={() => setScreen(s)}><Icon name={s} /><span>{tl.nav[s]}</span></button>)}</nav>

      <button className="fab" onClick={() => setChat(true)} aria-label="chat"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" /></svg></button>

      {chat && <ChatSheet es={es} close={() => setChat(false)} />}
      {checkin && <CheckinSheet es={es} data={data} close={() => setCheckin(false)} />}
    </div>
  );
}

function SignOut({ locale, label }: { locale: string; label: string }) {
  async function out() { await createClient().auth.signOut(); window.location.href = `/${locale}`; }
  return <button type="button" onClick={out} style={{ background: "transparent", border: "1px solid #E3E8E6", color: "#5C6B66", fontSize: 13, fontWeight: 600, padding: "7px 13px", borderRadius: 999, cursor: "pointer" }}>{label}</button>;
}

/* ---------------- Inicio ---------------- */
function Inicio({ tl, data, go, openCheckin }: { tl: TL; data: AppData; go: (s: Seg) => void; openCheckin: () => void }) {
  const es = tl.es;
  const wpts = data.series.weight ?? [];
  const habitsLogged = ["water", "sleep", "mood"].filter((c) => (data.series[c] ?? []).length).length;
  const waterLast = (data.series.water ?? []).slice(-1)[0]?.v ?? 0;
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <div><p style={{ margin: 0, fontSize: 14, color: "#5C6B66", fontWeight: 500 }}>{data.todayLabel}</p>
          <h2 style={{ margin: "4px 0 0", fontSize: 25, fontWeight: 800, letterSpacing: "-0.02em", color: "#0B3D33" }}>{es ? "Hola" : "Hi"}, {data.name} 👋</h2></div>
        {data.streak > 0 && <span className="chip" style={{ background: "#FFF7EC", borderColor: "#F3D9A8", color: "#8A5A12" }}>🔥 {data.streak} {es ? "días" : "days"}</span>}
      </div>
      <div className="dash">
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div><p style={eyebrow}>{es ? "Peso actual" : "Current weight"}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}><span style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", color: "#0B3D33", lineHeight: 1 }}>{data.weight.current ?? "—"}</span><span style={{ fontSize: 17, fontWeight: 600, color: "#5C6B66" }}>kg</span></div></div>
            <div style={{ textAlign: "right" }}>{data.weight.delta !== null && <span className="chip" style={{ background: "#ECFBF4" }}>{data.weight.delta <= 0 ? "▾" : "▴"} {Math.abs(data.weight.delta)} kg</span>}{data.goal !== null && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#93A09B" }}>{es ? "Meta" : "Goal"} {data.goal} kg</p>}</div>
          </div>
          <div style={{ marginTop: 10 }}>{wpts.length ? <Sparkline points={wpts} goal={data.goal} unit=" kg" /> : <p style={{ color: "#93A09B", fontSize: 14 }}>{es ? "Registra tu peso para ver tu curva." : "Log your weight to see your curve."}</p>}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0B3D33" }}>{es ? "Tu día de hoy" : "Today"}</p>
            <div style={{ display: "flex", justifyContent: "space-around", gap: 8 }}>
              <Ring pct={habitsLogged / 3} color="#0EA672" center={`${Math.round((habitsLogged / 3) * 100)}%`} label={es ? "Hábitos" : "Habits"} />
              <Ring pct={Math.min(waterLast / 8, 1)} color="#3BA7E0" center={String(waterLast)} label={es ? "Agua" : "Water"} />
              <Ring pct={0} color="#E0A340" center="—" label={es ? "Pasos" : "Steps"} />
            </div>
          </div>
          <div className="card" style={{ padding: 18, background: "linear-gradient(135deg,#0B3D33,#115C49)", border: "none" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#A7E8CF", textTransform: "uppercase", letterSpacing: ".06em" }}>{es ? "Próxima sesión" : "Next session"}</p>
            {data.nextAppt ? <><p style={{ margin: "9px 0 2px", fontSize: 17, fontWeight: 700, color: "#fff" }}>{data.nextAppt.whenLabel}</p><p style={{ margin: 0, fontSize: 13.5, color: "#A7E8CF" }}>{es ? "con Sebastián" : "with Sebastián"}</p></> : <p style={{ margin: "9px 0 0", fontSize: 14, color: "#A7E8CF" }}>{es ? "Sin sesión agendada" : "No session booked"}</p>}
          </div>
        </div>
      </div>
      <p style={{ margin: "22px 0 12px", fontSize: 15, fontWeight: 700, color: "#0B3D33" }}>{es ? "Registrar hoy" : "Log today"}</p>
      <div className="cards4">
        {[["⚖️", es ? "Peso" : "Weight", () => go("cuerpo")], ["🍽️", es ? "Comida" : "Food", () => go("nutricion")], ["🏃", es ? "Entreno" : "Workout", () => go("movimiento")], ["💧", es ? "Check-in" : "Check-in", openCheckin]].map(([emo, label, fn], i) => (
          <button key={i} className="card" onClick={fn as () => void} style={{ padding: "16px 12px", cursor: "pointer", textAlign: "center", fontFamily: "inherit" }}><div style={{ fontSize: 22 }}>{emo as string}</div><p style={{ margin: "7px 0 0", fontSize: 12.5, fontWeight: 700, color: "#0B3D33" }}>{label as string}</p></button>
        ))}
      </div>
    </>
  );
}

/* ---------------- Mi cuerpo ---------------- */
function Cuerpo({ tl, data }: { tl: TL; data: AppData }) {
  const es = tl.es;
  const [tab, setTab] = useState<"peso" | "antro" | "wearables" | "habitos">("peso");
  const [range, setRange] = useState<"1m" | "3m" | "6m" | "todo">("6m");
  const tabs: [string, string][] = [["peso", es ? "Peso" : "Weight"], ["antro", es ? "Antropometría" : "Anthropometry"], ["wearables", "Wearables"], ["habitos", es ? "Hábitos" : "Habits"]];
  const wAll = data.series.weight ?? [];
  const now = Date.now(); const span = range === "1m" ? 30 : range === "3m" ? 90 : range === "6m" ? 180 : 1e9;
  const wpts = wAll.filter((p) => (now - p.t) / 86400000 <= span);
  const last = (c: string) => (data.series[c] ?? []).slice(-1)[0]?.v ?? null;
  const first = (c: string) => (data.series[c] ?? [])[0]?.v ?? null;
  const dlt = (c: string) => { const a = first(c), b = last(c); return a !== null && b !== null ? Math.round((b - a) * 10) / 10 : null; };
  const bmi = data.weight.current && data.heightCm ? Math.round((data.weight.current / Math.pow(data.heightCm / 100, 2)) * 10) / 10 : null;
  const bmiCat = bmi === null ? "" : bmi < 18.5 ? (es ? "Bajo peso" : "Underweight") : bmi < 25 ? (es ? "Saludable" : "Healthy") : bmi < 30 ? (es ? "Sobrepeso leve" : "Overweight") : (es ? "Obesidad" : "Obesity");
  const whr = last("waist") && last("hip") ? Math.round((last("waist")! / last("hip")!) * 100) / 100 : null;
  const mk = (c: string, step: number): Metric => ({ code: c, defId: data.defs[c], label: MLAB[c][es ? "es" : "en"], unit: MLAB[c].u, step });

  const tiles: [string, number | null, string][] = [["waist", last("waist"), "cm"], ["hip", last("hip"), "cm"], ["body_fat", last("body_fat"), "%"]];

  return (
    <>
      <div className="subtabs" style={{ marginBottom: 16 }}>{tabs.map(([k, lab]) => <button key={k} className="stab" data-active={tab === k ? 1 : 0} onClick={() => setTab(k as "peso")}>{lab}</button>)}</div>

      {tab === "peso" && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div><p style={eyebrow}>{es ? "Tendencia de peso" : "Weight trend"}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}><span style={{ fontSize: 34, fontWeight: 800, color: "#0B3D33", lineHeight: 1 }}>{data.weight.current ?? "—"}</span><span style={{ fontSize: 15, color: "#5C6B66", fontWeight: 600 }}>kg</span>{data.weight.delta !== null && <span className="chip" style={{ background: "#ECFBF4" }}>{data.weight.delta <= 0 ? "▾" : "▴"} {Math.abs(data.weight.delta)} kg</span>}</div></div>
            {data.streak > 0 && <div style={{ textAlign: "right" }}><p style={{ margin: 0, fontSize: 12, color: "#93A09B" }}>{es ? "Racha registro" : "Logging streak"}</p><p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 800, color: "#0B3D33" }}>🔥 {data.streak} {es ? "días" : "days"}</p></div>}
          </div>
          <div className="seg" style={{ maxWidth: 240, margin: "14px 0 6px" }}>{(["1m", "3m", "6m", "todo"] as const).map((r) => <button key={r} className="segb" data-active={range === r ? 1 : 0} onClick={() => setRange(r)}>{r === "todo" ? (es ? "Todo" : "All") : r.toUpperCase()}</button>)}</div>
          <div style={{ marginTop: 6 }}>{wpts.length ? <Sparkline points={wpts} goal={data.goal} unit=" kg" /> : <p style={{ color: "#93A09B", fontSize: 14 }}>{es ? "Sin datos en este rango." : "No data in this range."}</p>}</div>
          <div style={{ marginTop: 18 }}><p style={h3s}>{es ? "Registrar peso de hoy" : "Log today's weight"}</p><MetricLogger tenantId={data.tenantId} clientId={data.clientId} cols={1} metrics={[mk("weight", 0.1)]} cta={tl.save} saving={tl.saving} saved={tl.saved} errorLabel={tl.err} /></div>
        </div>
      )}

      {tab === "antro" && (
        <>
          <div className="cards4" style={{ marginBottom: 14 }}>
            {tiles.map(([c, v, u]) => (
              <div key={c} className="card" style={{ padding: 16 }}>
                <p style={{ margin: 0, fontSize: 12.5, color: "#5C6B66", fontWeight: 600 }}>{MLAB[c][es ? "es" : "en"]}</p>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0B3D33", marginTop: 2 }}>{v ?? "—"}<span style={{ fontSize: 12, color: "#93A09B", fontWeight: 600 }}> {u}</span></div>
                {dlt(c) !== null && <p style={{ margin: "2px 0 6px", fontSize: 11.5, color: "#0EA672", fontWeight: 700 }}>{dlt(c)! <= 0 ? "▾" : "▴"} {Math.abs(dlt(c)!)} {u} {es ? "desde inicio" : "since start"}</p>}
                <MiniSpark pts={data.series[c] ?? []} />
              </div>
            ))}
            <div className="card" style={{ padding: 16 }}>
              <p style={{ margin: 0, fontSize: 12.5, color: "#5C6B66", fontWeight: 600 }}>IMC / BMI</p>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#0B3D33", marginTop: 2 }}>{bmi ?? "—"}</div>
              {bmiCat && <p style={{ margin: "2px 0 6px", fontSize: 11.5, color: "#C97A12", fontWeight: 700 }}>{bmiCat}</p>}
            </div>
          </div>
          <div className="cards2">
            <div className="card" style={{ padding: 20 }}>
              <p style={h3s}>{es ? "Relación cintura/cadera" : "Waist/hip ratio"}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}><span style={{ fontSize: 30, fontWeight: 800, color: "#0B3D33" }}>{whr ?? "—"}</span>{whr !== null && <span className="chip">{whr < 0.9 ? (es ? "Saludable" : "Healthy") : (es ? "A vigilar" : "Watch")}</span>}</div>
              {whr !== null && <Gauge value={whr} min={0.8} max={1.05} />}
            </div>
            <div className="card" style={{ padding: 20 }}>
              <p style={h3s}>{es ? "Registrar medidas" : "Log measurements"}</p>
              <MetricLogger tenantId={data.tenantId} clientId={data.clientId} cols={1} metrics={[mk("waist", 0.5), mk("hip", 0.5), mk("body_fat", 0.1)]} cta={es ? "Guardar medidas" : "Save measurements"} saving={tl.saving} saved={tl.saved} errorLabel={tl.err} />
            </div>
          </div>
        </>
      )}

      {tab === "wearables" && (
        <>
          <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 26 }}>🍎</span><div><p style={{ margin: 0, fontWeight: 700, color: "#0B3D33" }}>Apple Health</p><p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#93A09B" }}>{es ? "No conectado" : "Not connected"}</p></div></div>
            <button className="pill" style={{ padding: "9px 16px", fontSize: 13 }}>{es ? "Conectar" : "Connect"}</button>
          </div>
          <div className="card" style={{ padding: "36px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 30 }}>⌚</div>
            <p style={{ margin: "12px auto 0", maxWidth: 380, color: "#5C6B66", fontSize: 15.5, lineHeight: 1.5 }}>{es ? "Conecta un dispositivo para ver aquí pasos, sueño y frecuencia cardíaca como insights legibles." : "Connect a device to see steps, sleep and heart-rate insights here."}</p>
            <span className="chip" style={{ marginTop: 16 }}>{es ? "Próximamente" : "Coming soon"}</span>
          </div>
        </>
      )}

      {tab === "habitos" && (
        <div className="card" style={{ padding: 20 }}>
          <p style={h3s}>{es ? "Hábitos de hoy" : "Today's habits"}</p>
          <MetricLogger tenantId={data.tenantId} clientId={data.clientId} cols={3} metrics={[mk("water", 1), mk("sleep", 0.5), mk("mood", 1)]} cta={es ? "Guardar hábitos" : "Save habits"} saving={tl.saving} saved={tl.saved} errorLabel={tl.err} />
        </div>
      )}
    </>
  );
}

/* ---------------- Nutrición (design sample content) ---------------- */
function Nutricion({ tl }: { tl: TL }) {
  const es = tl.es;
  const [tab, setTab] = useState<"reque" | "plan" | "medidor" | "recetario" | "compras">("reque");
  const tabs: [string, string][] = [["reque", es ? "Requerimientos" : "Targets"], ["plan", "Plan"], ["medidor", es ? "Medidor" : "Logger"], ["recetario", es ? "Recetario" : "Recipes"], ["compras", es ? "Compras" : "Groceries"]];
  const meals = [
    { tag: es ? "Desayuno" : "Breakfast", kcal: 480, name: es ? "Avena con plátano, yogur griego y nueces" : "Oatmeal with banana, Greek yogurt and walnuts" },
    { tag: es ? "Almuerzo" : "Lunch", kcal: 720, name: es ? "Pollo a la plancha, arroz integral y ensalada" : "Grilled chicken, brown rice and salad" },
    { tag: "Snack", kcal: 220, name: es ? "Manzana y un puñado de almendras" : "Apple and a handful of almonds" },
    { tag: es ? "Cena" : "Dinner", kcal: 620, name: es ? "Salmón al horno con verduras y quinoa" : "Baked salmon with veggies and quinoa" },
  ];
  const recipes = [
    { n: es ? "Bowl de pollo y quinoa" : "Chicken & quinoa bowl", min: 20, kcal: 520, tag: es ? "Alta proteína" : "High protein", g: "linear-gradient(135deg,#0EA672,#A7E8CF)" },
    { n: es ? "Salmón con verduras" : "Salmon with veggies", min: 25, kcal: 480, tag: "< 500 kcal", g: "linear-gradient(135deg,#E0A340,#F3D9A8)" },
    { n: es ? "Tostada de aguacate y huevo" : "Avocado & egg toast", min: 10, kcal: 340, tag: es ? "Rápida" : "Quick", g: "linear-gradient(135deg,#0B3D33,#2BA876)" },
  ];
  const shop = [
    { g: es ? "Proteínas" : "Protein", items: [es ? "Pechuga de pollo · 1 kg" : "Chicken breast · 1 kg", es ? "Salmón · 2 filetes" : "Salmon · 2 fillets", es ? "Yogur griego · 1 L" : "Greek yogurt · 1 L"] },
    { g: es ? "Verduras y fruta" : "Veg & fruit", items: [es ? "Espinaca · 1 bolsa" : "Spinach · 1 bag", es ? "Plátano · 6" : "Banana · 6", es ? "Aguacate · 3" : "Avocado · 3"] },
  ];
  return (
    <>
      <div className="subtabs" style={{ marginBottom: 14 }}>{tabs.map(([k, lab]) => <button key={k} className="stab" data-active={tab === k ? 1 : 0} onClick={() => setTab(k as "reque")}>{lab}</button>)}</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#FFFBF0", border: "1px solid #F3E2B8", borderRadius: 14, padding: "11px 14px", marginBottom: 16 }}>
        <span>ℹ️</span><p style={{ margin: 0, fontSize: 13.5, color: "#7A5B12", lineHeight: 1.4 }}>{es ? <>Guía orientativa según tu evaluación, <b>no una prescripción clínica</b>. Ajústala con Sebastián.</> : <>Orientative guidance from your assessment, <b>not a clinical prescription</b>. Adjust it with Sebastián.</>}</p>
      </div>

      {tab === "reque" && (
        <div className="cards2">
          <div className="card" style={{ padding: 20 }}>
            <p style={eyebrow}>{es ? "Energía diaria orientativa" : "Daily energy (guide)"}</p>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#0B3D33", margin: "4px 0 2px" }}>2 100–2 300 <span style={{ fontSize: 15, color: "#5C6B66" }}>kcal</span></div>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#5C6B66" }}>{es ? "Objetivo: recomposición (mantener peso, bajar grasa)." : "Goal: recomposition (hold weight, drop fat)."}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Donut segs={[{ pct: 0.33, color: "#0EA672" }, { pct: 0.40, color: "#E0A340" }, { pct: 0.27, color: "#0B3D33" }]} />
              <div style={{ flex: 1 }}>
                {[["Proteína", "Protein", "180 g", "33%", "#0EA672"], ["Carbohidrato", "Carbs", "200 g", "40%", "#E0A340"], ["Grasa", "Fat", "70 g", "27%", "#0B3D33"]].map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 13.5 }}><span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: m[4] }} />{es ? m[0] : m[1]}</span><b style={{ color: "#0B3D33" }}>{m[2]} · {m[3]}</b></div>
                ))}
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <p style={eyebrow}>{es ? "Otras guías" : "Other guides"}</p>
            <div style={{ marginTop: 10 }}>
              {[["💧", es ? "Agua" : "Water", "2.5–3 L"], ["🥦", es ? "Fibra" : "Fiber", "30–35 g"], ["🍽️", es ? "Comidas" : "Meals", es ? "3 + 1 snack" : "3 + 1 snack"]].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? "1px solid #F0F4F2" : "none", fontSize: 14.5 }}><span>{r[0]} {r[1]}</span><b style={{ color: "#0B3D33" }}>{r[2]}</b></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "plan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {meals.map((m, i) => (
            <label key={i} className="check"><input type="checkbox" /><span className="box"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
              <span style={{ flex: 1 }}><span className="chip" style={{ background: "#FFF7EC", borderColor: "#F3D9A8", color: "#8A5A12", marginBottom: 4 }}>{m.tag} · {m.kcal} kcal</span><span className="lbl" style={{ display: "block", marginTop: 4 }}>{m.name}</span></span></label>
          ))}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><p style={{ margin: 0, fontWeight: 700, color: "#0B3D33" }}>{es ? "Calorías de hoy" : "Today's calories"}</p><span style={{ fontSize: 12.5, color: "#93A09B" }}>{es ? "Objetivo" : "Target"} 2 200</span></div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#0B3D33", margin: "4px 0" }}>1 650 <span style={{ fontSize: 14, color: "#93A09B" }}>/ 2 200 kcal</span></div>
            <div style={{ height: 8, borderRadius: 999, background: "#EEF3F0", overflow: "hidden" }}><div style={{ width: "75%", height: "100%", background: "#0EA672" }} /></div>
            <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#5C6B66" }}>P 132g · C 148g · G 52g</p>
          </div>
        </div>
      )}

      {tab === "medidor" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button className="pill" style={{ width: "100%", padding: "14px" }}>📷 {es ? "Registrar comida con foto" : "Log a meal with a photo"}</button>
          {[[es ? "Desayuno" : "Breakfast", "480"], [es ? "Almuerzo" : "Lunch", "720"]].map((m, i) => (
            <div key={i} className="card" style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 600, color: "#0B3D33" }}>{m[0]}</span><b style={{ color: "#0B3D33" }}>{m[1]} kcal</b></div>
          ))}
          <button className="card" style={{ padding: 16, cursor: "pointer", fontFamily: "inherit", color: "#0EA672", fontWeight: 700, background: "#fff" }}>＋ {es ? "Añadir cena / snack" : "Add dinner / snack"}</button>
        </div>
      )}

      {tab === "recetario" && (
        <>
          <div className="subtabs" style={{ marginBottom: 14 }}>{[es ? "Todas" : "All", es ? "Alta proteína" : "High protein", "< 500 kcal", es ? "Rápidas" : "Quick", es ? "Vegetarianas" : "Veg"].map((f, i) => <button key={i} className="stab" data-active={i === 0 ? 1 : 0}>{f}</button>)}</div>
          <div className="cards3">{recipes.map((r, i) => (
            <div key={i} className="card" style={{ overflow: "hidden" }}><div style={{ height: 92, background: r.g, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>🥗</div>
              <div style={{ padding: 14 }}><p style={{ margin: 0, fontWeight: 700, color: "#0B3D33", fontSize: 14.5 }}>{r.n}</p><p style={{ margin: "6px 0 8px", fontSize: 12.5, color: "#93A09B" }}>⏱ {r.min} min · 🔥 {r.kcal} kcal</p><span className="chip">{r.tag}</span></div></div>
          ))}</div>
        </>
      )}

      {tab === "compras" && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><p style={{ margin: 0, fontWeight: 700, color: "#0B3D33" }}>{es ? "Lista de compras" : "Shopping list"}</p><span style={{ fontSize: 12.5, color: "#93A09B" }}>6 {es ? "artículos" : "items"}</span></div>
          {shop.map((grp, gi) => (
            <div key={gi} style={{ marginTop: 12 }}><p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#0EA672", textTransform: "uppercase", letterSpacing: ".05em" }}>{grp.g}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{grp.items.map((it, ii) => <label key={ii} className="check"><input type="checkbox" /><span className="box"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span><span className="lbl">{it}</span></label>)}</div></div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------- Movimiento (design sample) ---------------- */
function Movimiento({ tl }: { tl: TL }) {
  const es = tl.es;
  const [tab, setTab] = useState<"hoy" | "plan" | "biblioteca">("hoy");
  const tabs: [string, string][] = [["hoy", es ? "Hoy" : "Today"], ["plan", es ? "Plan de entreno" : "Training plan"], ["biblioteca", es ? "Biblioteca" : "Library"]];
  const ex = [["Press de banca", "4 × 8–10"], ["Press militar", "3 × 10"], [es ? "Aperturas con mancuerna" : "Dumbbell flyes", "3 × 12"], [es ? "Fondos en paralelas" : "Dips", es ? "3 × máximo" : "3 × max"]];
  const lib = [[es ? "Press de banca" : "Bench press", es ? "Pecho · 1:20 min" : "Chest · 1:20", "linear-gradient(135deg,#0EA672,#A7E8CF)"], [es ? "Sentadilla" : "Squat", es ? "Piernas · 1:45 min" : "Legs · 1:45", "linear-gradient(135deg,#E0A340,#F3D9A8)"], [es ? "Remo con barra" : "Barbell row", es ? "Espalda · 1:30 min" : "Back · 1:30", "linear-gradient(135deg,#0B3D33,#2BA876)"], [es ? "Movilidad de cadera" : "Hip mobility", es ? "Movilidad · 2:00 min" : "Mobility · 2:00", "linear-gradient(135deg,#3BA7E0,#A7D8F0)"]];
  return (
    <>
      <div className="subtabs" style={{ marginBottom: 14 }}>{tabs.map(([k, lab]) => <button key={k} className="stab" data-active={tab === k ? 1 : 0} onClick={() => setTab(k as "hoy")}>{lab}</button>)}</div>

      {tab !== "biblioteca" && (
        <div className="cards2" style={{ marginBottom: 14 }}>
          <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}><Ring pct={0.87} color="#0EA672" center="87%" size={62} /><div style={{ textAlign: "right" }}><p style={{ margin: 0, fontSize: 12.5, color: "#5C6B66" }}>{es ? "Pasos hoy" : "Steps today"}</p><p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: "#0B3D33" }}>8 742</p><p style={{ margin: 0, fontSize: 11.5, color: "#93A09B" }}>{es ? "Meta" : "Goal"} 10 000</p></div></div>
          <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}><Ring pct={0.77} color="#E0A340" center="77%" size={62} /><div style={{ textAlign: "right" }}><p style={{ margin: 0, fontSize: 12.5, color: "#5C6B66" }}>{es ? "Calorías quemadas" : "Calories burned"}</p><p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800, color: "#0B3D33" }}>540</p><p style={{ margin: 0, fontSize: 11.5, color: "#93A09B" }}>{es ? "Meta" : "Goal"} 700 kcal</p></div></div>
        </div>
      )}

      {tab === "hoy" && (
        <>
          <div className="card" style={{ padding: 18, marginBottom: 14 }}><p style={h3s}>{es ? "Pasos esta semana" : "Steps this week"}</p><Bars values={[7000, 9000, 8000, 11000, 6800, 12500, 8742]} labels={es ? ["L", "M", "X", "J", "V", "S", "D"] : ["M", "T", "W", "T", "F", "S", "S"]} /></div>
          <div style={{ background: "#ECFBF4", border: "1px solid #A7E8CF", borderRadius: 14, padding: "12px 16px", marginBottom: 14, fontSize: 14, color: "#0B3D33" }}>🔥 <b>{es ? "Racha de 5 días entrenando." : "5-day training streak."}</b> {es ? "¡Sigue así!" : "Keep it up!"}</div>
          <div className="card" style={{ padding: 18, background: "linear-gradient(135deg,#0B3D33,#115C49)", border: "none", marginBottom: 12 }}><p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: "#A7E8CF", textTransform: "uppercase", letterSpacing: ".06em" }}>{es ? "Hoy · Miércoles" : "Today · Wednesday"}</p><p style={{ margin: "6px 0 0", fontSize: 18, fontWeight: 800, color: "#fff" }}>{es ? "Tren superior — Empuje" : "Upper body — Push"}</p><p style={{ margin: "2px 0 0", fontSize: 13, color: "#A7E8CF" }}>{es ? "5 ejercicios · ~45 min" : "5 exercises · ~45 min"}</p></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{ex.map((e, i) => <label key={i} className="check"><input type="checkbox" /><span className="box"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span><span style={{ flex: 1 }}><b className="lbl" style={{ color: "#0B3D33" }}>{e[0]}</b><span style={{ display: "block", fontSize: 12.5, color: "#93A09B", fontWeight: 500 }}>{e[1]}</span></span></label>)}</div>
          <button className="pill" style={{ width: "100%", marginTop: 14 }}>{es ? "Marcar entreno completo" : "Mark workout complete"}</button>
        </>
      )}

      {tab === "plan" && <div className="card" style={{ padding: 24, textAlign: "center", color: "#5C6B66" }}>{es ? "Tu coach publicará aquí el plan semanal de entrenamiento." : "Your coach will publish the weekly training plan here."}<div style={{ marginTop: 12 }}><span className="chip">{es ? "Próximamente" : "Coming soon"}</span></div></div>}

      {tab === "biblioteca" && (
        <div className="cards2">{lib.map((e, i) => (
          <div key={i} className="card" style={{ overflow: "hidden" }}><div style={{ height: 96, background: e[2], display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>▶</span></div><div style={{ padding: 14 }}><p style={{ margin: 0, fontWeight: 700, color: "#0B3D33", fontSize: 14.5 }}>{e[0]}</p><p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#93A09B" }}>{e[1]}</p></div></div>
        ))}</div>
      )}
    </>
  );
}

/* ---------------- Mi coach ---------------- */
function Coach({ tl, data }: { tl: TL; data: AppData }) {
  const es = tl.es;
  const [tab, setTab] = useState<"agenda" | "minutas" | "plan">("agenda");
  const tabs: [string, string][] = [["agenda", "Agenda"], ["minutas", es ? "Minutas" : "Notes"], ["plan", es ? "Plan & progreso" : "Plan & progress"]];
  const start = (data.series.weight ?? [])[0]?.v ?? null;
  const cur = data.weight.current; const goal = data.goal;
  const prog = start && cur && goal && start !== goal ? Math.min(Math.max((start - cur) / (start - goal), 0), 1) : null;
  return (
    <>
      <div className="subtabs" style={{ marginBottom: 16 }}>{tabs.map(([k, lab]) => <button key={k} className="stab" data-active={tab === k ? 1 : 0} onClick={() => setTab(k as "agenda")}>{lab}</button>)}</div>

      {tab === "agenda" && (
        <>
          <div className="card" style={{ padding: 18, marginBottom: 14 }}>
            <p style={eyebrow}>{es ? "Próxima sesión" : "Next session"}</p>
            {data.nextAppt ? <p style={{ margin: "8px 0 0", fontSize: 16, fontWeight: 700, color: "#0B3D33" }}>{data.nextAppt.whenLabel}<br /><span style={{ fontWeight: 500, color: "#5C6B66", fontSize: 13.5 }}>{es ? "videollamada con Sebastián" : "video call with Sebastián"}</span></p> : <p style={{ margin: "8px 0 0", color: "#5C6B66" }}>{es ? "Sin sesión agendada." : "No session booked."}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}><button className="pill" style={{ flex: 1 }}>{es ? "Unirme" : "Join"}</button><a className="pill ghost" href="/#agenda" style={{ flex: 1, textAlign: "center" }}>{es ? "Reagendar" : "Reschedule"}</a></div>
          </div>
          <p style={h3s}>{es ? "Historial de sesiones" : "Session history"}</p>
          {(data.history && data.history.length ? data.history : []).map((s, i) => (
            <div key={i} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><span style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0EA672" }} /><b style={{ color: "#0B3D33", fontSize: 14 }}>{s.title}</b><span style={{ color: "#93A09B", fontSize: 12.5 }}>{s.date}</span></span><span style={{ color: "#0EA672", fontSize: 13, fontWeight: 700 }}>{es ? "Ver minuta" : "View note"}</span></div>
          ))}
          {data.checkins && data.checkins.length > 0 && (
            <div className="card" style={{ padding: 18, marginTop: 6 }}>
              <p style={h3s}>{es ? "Check-ins recientes" : "Recent check-ins"}</p>
              {data.checkins.map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < (data.checkins!.length - 1) ? "1px solid #F0F4F2" : "none" }}>
                  <span style={{ color: "#5C6B66", fontSize: 13.5 }}>{c.week}</span>
                  <span style={{ display: "flex", gap: 8 }}><span className="chip">{(es ? "Adherencia " : "Adherence ") + (c.adherence ?? "—") + "/5"}</span><span className="chip" style={{ background: "#FFF7EC", borderColor: "#F3D9A8", color: "#8A5A12" }}>{(es ? "Energía " : "Energy ") + (c.energy ?? "—") + "/5"}</span></span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "minutas" && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className="chip">{es ? "Sesión 6 · 6 jun" : "Session 6 · Jun 6"}</span><span style={{ fontSize: 12.5, color: "#93A09B" }}>Sebastián Barrón</span></div>
          <p style={{ margin: "14px 0 4px", fontSize: 12.5, fontWeight: 700, color: "#0EA672", textTransform: "uppercase", letterSpacing: ".05em" }}>{es ? "Lo que vimos" : "What we covered"}</p>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, color: "#11201C" }}>{es ? "Excelente adherencia al plan (5/6 entrenos). La grasa bajó al 20.1% manteniendo el peso — recomposición en marcha. Sueño mejoró a ~7h." : "Great plan adherence (5/6 workouts). Body fat down to 20.1% while holding weight — recomposition underway. Sleep improved to ~7h."}</p>
          <p style={{ margin: "16px 0 4px", fontSize: 12.5, fontWeight: 700, color: "#0EA672", textTransform: "uppercase", letterSpacing: ".05em" }}>{es ? "Acuerdos para esta semana" : "This week's agreements"}</p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14.5, color: "#11201C", lineHeight: 1.7 }}><li>{es ? "Subir proteína a 180 g/día" : "Raise protein to 180 g/day"}</li><li>{es ? "Añadir 1 día de movilidad" : "Add 1 mobility day"}</li><li>{es ? "Registrar peso 3× por semana" : "Log weight 3×/week"}</li></ul>
        </div>
      )}

      {tab === "plan" && (
        <>
          <div className="cards3" style={{ marginBottom: 14 }}>
            {[[es ? "Programa" : "Program", es ? "Recomposición" : "Recomposition", es ? "Mes 2 de 4" : "Month 2 of 4"], [es ? "Adherencia" : "Adherence", "86%", es ? "últimas 4 sem" : "last 4 wks"], [es ? "Grasa perdida" : "Fat lost", "−3.9%", es ? "desde inicio" : "since start"]].map((s, i) => (
              <div key={i} className="card" style={{ padding: 16 }}><p style={{ margin: 0, fontSize: 12.5, color: "#5C6B66", fontWeight: 600 }}>{s[0]}</p><p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800, color: i === 0 ? "#0B3D33" : "#0EA672" }}>{s[1]}</p><p style={{ margin: 0, fontSize: 11.5, color: "#93A09B" }}>{s[2]}</p></div>
            ))}
          </div>
          <div className="card" style={{ padding: 20 }}>
            <p style={h3s}>{es ? `Hacia tu meta de peso (${goal ?? "—"} kg)` : `Toward your goal (${goal ?? "—"} kg)`}</p>
            <p style={{ margin: "0 0 8px", color: "#5C6B66", fontSize: 14 }}>{start ?? "—"} → <b style={{ color: "#0B3D33" }}>{cur ?? "—"}</b> → {goal ?? "—"} kg</p>
            <div style={{ position: "relative", height: 10, borderRadius: 999, background: "#EEF3F0", overflow: "visible" }}><div style={{ width: `${(prog ?? 0) * 100}%`, height: "100%", borderRadius: 999, background: "#0EA672" }} /><div style={{ position: "absolute", top: -3, left: `calc(${(prog ?? 0) * 100}% - 8px)`, width: 16, height: 16, borderRadius: "50%", background: "#fff", border: "3px solid #E0A340" }} /></div>
            {prog !== null && <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#93A09B" }}>{Math.round(prog * 100)}% {es ? "del camino" : "of the way"} · {es ? "faltan" : ""} {cur && goal ? Math.round((cur - goal) * 10) / 10 : "—"} kg {es ? "" : "to go"}</p>}
          </div>
        </>
      )}
    </>
  );
}

/* ---------------- Perfil ---------------- */
function Perfil({ tl, data, other }: { tl: TL; data: AppData; other: string }) {
  const es = tl.es;
  const row = { display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid #F0F4F2", fontSize: 14.5 } as const;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}><span style={{ width: 52, height: 52, borderRadius: "50%", background: "#0B3D33", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800 }}>{data.initials}</span><div><p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0B3D33" }}>{data.fullName}</p><p style={{ margin: "2px 0 0", fontSize: 13.5, color: "#93A09B" }}>{data.email}</p></div></div>
        <span className="chip" style={{ background: "#FFF7EC", borderColor: "#F3D9A8", color: "#8A5A12" }}>{tl.premium}</span>
      </div>

      <div className="cards2">
        <div className="card" style={{ padding: 20 }}>
          <p style={h3s}>{es ? "Mis objetivos" : "My goals"}</p>
          <div style={row}><span style={{ color: "#5C6B66" }}>{es ? "Objetivo principal" : "Main goal"}</span><b style={{ color: "#0B3D33" }}>{data.goals[0] ?? (es ? "Recomposición" : "Recomposition")}</b></div>
          <div style={row}><span style={{ color: "#5C6B66" }}>{es ? "Peso meta" : "Goal weight"}</span><b style={{ color: "#0B3D33" }}>{data.goal !== null ? `${data.goal} kg` : "—"}</b></div>
          <div style={{ ...row, borderBottom: "none" }}><span style={{ color: "#5C6B66" }}>{es ? "Idioma" : "Language"}</span><a href={`/${other}/app`} style={{ color: "#0EA672", fontWeight: 700, textDecoration: "none" }}>{es ? "Switch to English" : "Cambiar a Español"}</a></div>
        </div>
        <div className="card" style={{ padding: 20, background: "linear-gradient(135deg,#0B3D33,#115C49)", border: "none", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 12.5, fontWeight: 700, color: "#A7E8CF", textTransform: "uppercase", letterSpacing: ".05em" }}>{es ? "Membresía" : "Membership"}</span><span className="chip" style={{ background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.3)", color: "#fff" }}>{data.membership ? (es ? "Activa" : "Active") : "—"}</span></div>
          <p style={{ margin: "10px 0 2px", fontSize: 20, fontWeight: 800 }}>Plan {tl.premium}</p>
          <ul style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 13.5, color: "#DCF3E8", lineHeight: 1.8 }}><li>{es ? "Sesiones 1:1 con tu coach" : "1:1 sessions with your coach"}</li><li>{es ? "Plan de nutrición y entreno" : "Nutrition & training plan"}</li><li>{es ? "Chat con asistente IA" : "AI assistant chat"}</li><li>{es ? "Check-ins semanales" : "Weekly check-ins"}</li></ul>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}><SignOut locale={es ? "es" : "en"} label={tl.signout} /></div>
    </div>
  );
}

/* ---------------- sheets ---------------- */
function ChatSheet({ es, close }: { es: boolean; close: () => void }) {
  const hello = es ? "¡Hola! Soy tu asistente de coaching. Pregúntame por tu plan, hábitos o progreso. No soy médico — todo lo clínico se lo paso a Sebastián." : "Hi! I'm your coaching assistant. Ask me about your plan, habits or progress. I'm not a doctor — anything clinical I pass to Sebastián.";
  const soon = es ? "¡Gracias! El asistente se activa pronto — por ahora Sebastián te dará seguimiento personalmente." : "Thanks! The assistant goes live soon — for now Sebastián will follow up personally.";
  const [msgs, setMsgs] = useState<{ me: boolean; text: string }[]>([{ me: false, text: hello }]);
  const [val, setVal] = useState("");
  function send() { if (!val.trim()) return; setMsgs((m) => [...m, { me: true, text: val }, { me: false, text: soon }]); setVal(""); }
  return (
    <div className="overlay" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid #EAEFEC", background: "#fff" }}><b style={{ color: "#0B3D33" }}>{es ? "Asistente del coach" : "Coach assistant"}</b><button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "#5C6B66", fontSize: 20 }}>×</button></div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>{msgs.map((m, i) => <div key={i} className={"bub " + (m.me ? "me" : "bot")}>{m.text}</div>)}</div>
        <div style={{ display: "flex", gap: 8, padding: 14, borderTop: "1px solid #EAEFEC", background: "#fff" }}><input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={es ? "Escribe un mensaje…" : "Type a message…"} style={{ flex: 1, padding: "11px 14px", border: "1px solid #E3E8E6", borderRadius: 999, fontSize: 15, fontFamily: "inherit", outline: "none" }} /><button className="pill" onClick={send}>{es ? "Enviar" : "Send"}</button></div>
      </div>
    </div>
  );
}
function CheckinSheet({ es, data, close }: { es: boolean; data: AppData; close: () => void }) {
  const [adh, setAdh] = useState(0); const [ene, setEne] = useState(0); const [obs, setObs] = useState(""); const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  async function save() { setState("saving"); try { await createClient().schema("core").from("check_ins").insert({ tenant_id: data.tenantId, client_id: data.clientId, adherence: adh || null, energy: ene || null, obstacles: obs || null }); setState("done"); setTimeout(close, 900); } catch { setState("idle"); } }
  const scale = (val: number, set: (n: number) => void) => <div style={{ display: "flex", gap: 8 }}>{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => set(n)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid " + (val === n ? "#0EA672" : "#E3E8E6"), background: val === n ? "#0EA672" : "#fff", color: val === n ? "#fff" : "#11201C", fontWeight: 700, cursor: "pointer" }}>{n}</button>)}</div>;
  return (
    <div className="overlay" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid #EAEFEC", background: "#fff" }}><b style={{ color: "#0B3D33" }}>{es ? "Check-in semanal" : "Weekly check-in"}</b><button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "#5C6B66", fontSize: 20 }}>×</button></div>
        <div style={{ padding: 18, overflowY: "auto" }}>{state === "done" ? <p style={{ textAlign: "center", color: "#0B3D33", fontWeight: 700, padding: "20px 0" }}>{es ? "¡Gracias por tu check-in! 🙌" : "Thanks for checking in 🙌"}</p> : <>
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>{es ? "¿Cómo seguiste tu plan?" : "How did you stick to your plan?"}</p>{scale(adh, setAdh)}
          <p style={{ margin: "18px 0 8px", fontWeight: 600 }}>{es ? "Energía esta semana" : "Energy this week"}</p>{scale(ene, setEne)}
          <p style={{ margin: "18px 0 8px", fontWeight: 600 }}>{es ? "¿Algún obstáculo?" : "Any obstacles?"}</p><textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} placeholder={es ? "Qué se interpuso…" : "What got in the way…"} style={{ width: "100%", padding: "12px 14px", border: "1px solid #E3E8E6", borderRadius: 12, fontSize: 15, fontFamily: "inherit", resize: "vertical", outline: "none" }} />
          <button className="pill" onClick={save} disabled={state === "saving"} style={{ width: "100%", marginTop: 16, opacity: state === "saving" ? 0.6 : 1 }}>{state === "saving" ? (es ? "Guardando…" : "Saving…") : (es ? "Enviar check-in" : "Send check-in")}</button>
        </>}</div>
      </div>
    </div>
  );
}
