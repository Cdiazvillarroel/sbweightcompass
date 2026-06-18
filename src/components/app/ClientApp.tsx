"use client";

import { useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkline } from "@/components/app/Sparkline";
import { MetricLogger, type Metric } from "@/components/app/MetricLogger";

export type AppData = {
  tenantId: string; clientId: string;
  name: string; email: string; membership: string | null; goals: string[];
  todayLabel: string; streak: number;
  weight: { current: number | null; delta: number | null; goal: number | null; bmi: number | null; bmiCat: string; pts: { t: number; v: number }[] };
  anthro: { waist: number | null; hip: number | null; bodyFat: number | null };
  habits: { water: number | null; sleep: number | null; mood: number | null };
  defs: Record<string, string>;
  nextAppt: { whenLabel: string } | null;
};

type Seg = "inicio" | "cuerpo" | "nutricion" | "movimiento" | "coach" | "perfil";

const TXT = {
  en: { sub: "Client app", signout: "Sign out", inicio: "Home", cuerpo: "My body", nutricion: "Nutrition", movimiento: "Movement", coach: "My coach", perfil: "Profile",
    weightNow: "Current weight", goal: "Goal", today: "Today", habits: "Habits", water: "Water", steps: "Steps", next: "Next session", join: "Join", rebook: "Reschedule", noNext: "No session booked",
    logToday: "Log today", weight: "Weight", food: "Food", workout: "Workout", onTrack: "On track", soon: "Coming soon",
    saveW: "Save weight", saveA: "Save measurements", saveH: "Save habits", saving: "Saving…", saved: "Saved ✓", err: "Couldn't save. Try again.",
    anthro: "Anthropometry", wearables: "Wearables", connect: "Connect a device to see steps, sleep and heart-rate insights here.", empty: "No data yet — log your first entry.",
    account: "Account", goalsT: "Goals", membership: "Membership", lang: "Language", switchTo: "Cambiar a Español", name: "Name", email: "Email", goalWeight: "Goal weight", status: "Status",
    agenda: "Agenda", minutes: "Meeting notes", summary: "Plan summary", soonBody: "We're building this section. Your coach-authored content will appear here soon.",
    chat: "Coach assistant", chatHello: "Hi! I'm your coaching assistant. Ask me about your plan, habits or progress. I'm not a doctor — anything clinical I'll pass to Sebastián.", chatPh: "Type a message…", chatSoon: "Thanks! The assistant goes live soon — for now Sebastián will follow up personally.", send: "Send",
    checkin: "Weekly check-in", adherence: "How did you stick to your plan?", energy: "Energy this week", obstacles: "Any obstacles?", obsPh: "What got in the way…", saveCheck: "Send check-in", close: "Close", thanks: "Thanks for checking in 🙌" },
  es: { sub: "App del cliente", signout: "Cerrar sesión", inicio: "Inicio", cuerpo: "Mi cuerpo", nutricion: "Nutrición", movimiento: "Movimiento", coach: "Mi coach", perfil: "Perfil",
    weightNow: "Peso actual", goal: "Meta", today: "Tu día de hoy", habits: "Hábitos", water: "Agua", steps: "Pasos", next: "Próxima sesión", join: "Unirme", rebook: "Reagendar", noNext: "Sin sesión agendada",
    logToday: "Registrar hoy", weight: "Peso", food: "Comida", workout: "Entreno", onTrack: "Vas en rumbo", soon: "Próximamente",
    saveW: "Guardar peso", saveA: "Guardar medidas", saveH: "Guardar hábitos", saving: "Guardando…", saved: "Guardado ✓", err: "No se pudo guardar. Reintenta.",
    anthro: "Antropometría", wearables: "Wearables", connect: "Conecta un dispositivo para ver aquí pasos, sueño y frecuencia cardíaca.", empty: "Aún sin datos — registra tu primer valor.",
    account: "Cuenta", goalsT: "Objetivos", membership: "Membresía", lang: "Idioma", switchTo: "Switch to English", name: "Nombre", email: "Correo", goalWeight: "Peso meta", status: "Estado",
    agenda: "Agenda", minutes: "Minutas de sesión", summary: "Resumen del plan", soonBody: "Estamos construyendo esta sección. El contenido que prepara tu coach aparecerá aquí pronto.",
    chat: "Asistente del coach", chatHello: "¡Hola! Soy tu asistente de coaching. Pregúntame por tu plan, hábitos o progreso. No soy médico — todo lo clínico se lo paso a Sebastián.", chatPh: "Escribe un mensaje…", chatSoon: "¡Gracias! El asistente se activa pronto — por ahora Sebastián te dará seguimiento personalmente.", send: "Enviar",
    checkin: "Check-in semanal", adherence: "¿Cómo seguiste tu plan?", energy: "Energía esta semana", obstacles: "¿Algún obstáculo?", obsPh: "Qué se interpuso…", saveCheck: "Enviar check-in", close: "Cerrar", thanks: "¡Gracias por tu check-in! 🙌" },
};


const MLAB: Record<string, { en: string; es: string; u: string }> = {
  weight: { en: "Weight", es: "Peso", u: "kg" }, waist: { en: "Waist", es: "Cintura", u: "cm" }, hip: { en: "Hip", es: "Cadera", u: "cm" },
  body_fat: { en: "Body fat", es: "% grasa", u: "%" }, water: { en: "Water", es: "Agua", u: "" }, sleep: { en: "Sleep", es: "Sueño", u: "h" }, mood: { en: "Mood", es: "Ánimo", u: "" },
};

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

function Ring({ pct, color, center, label }: { pct: number; color: string; center: string; label: string }) {
  const r = 26, c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(Math.max(pct, 0), 1));
  return (
    <div style={{ textAlign: "center" }}>
      <svg width="70" height="70" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={r} fill="none" stroke="#EAEFEC" strokeWidth="7" />
        <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 35 35)" />
        <text x="35" y="40" textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#0B3D33">{center}</text>
      </svg>
      <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 600, color: "#5C6B66" }}>{label}</p>
    </div>
  );
}

const eyebrow = { margin: 0, fontSize: 13, fontWeight: 600, color: "#5C6B66", textTransform: "uppercase", letterSpacing: ".05em" } as const;

export function ClientApp({ locale, data }: { locale: string; data: AppData }) {
  const lang = locale === "es" ? "es" : "en";
  const t = TXT[lang];
  const other = lang === "es" ? "en" : "es";
  const [screen, setScreen] = useState<Seg>("inicio");
  const [ctab, setCtab] = useState<"peso" | "antro" | "habitos" | "wearables">("peso");
  const [range, setRange] = useState<"1m" | "3m" | "6m" | "todo">("3m");
  const [chat, setChat] = useState(false);
  const [checkin, setCheckin] = useState(false);

  const def = (c: string) => data.defs[c];
  const mk = (c: string, step: number): Metric | null => def(c) ? { code: c, defId: def(c), label: MLAB[c]?.[lang] ?? c, unit: MLAB[c]?.u ?? "", step } : null;
  const mlab = (c: string) => MLAB[c]?.[lang] ?? c;

  const navs: Seg[] = ["inicio", "cuerpo", "nutricion", "movimiento", "coach", "perfil"];
  const title = t[screen];

  // weight chart windowed
  const now = Date.now();
  const span = range === "1m" ? 30 : range === "3m" ? 90 : range === "6m" ? 180 : 99999;
  const wpts = data.weight.pts.filter((p) => (now - p.t) / 86400000 <= span);

  const rings = (() => {
    const h = data.habits;
    const logged = [h.water, h.sleep, h.mood].filter((x) => x !== null).length;
    return { habits: logged / 3, water: h.water !== null ? Math.min(h.water / 8, 1) : 0, steps: 0 };
  })();

  return (
    <div className="cliapp">
      {/* sidebar (desktop) */}
      <aside className="sidebar">
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 10px 20px" }}>
          <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden><circle cx="32" cy="32" r="27" fill="none" stroke="#0EA672" strokeWidth="3.5" /><polygon points="32,7 25,39 32,33.5 39,39" fill="#E0A340" /><polygon points="32,57 25,25 32,30.5 39,25" fill="#A7E8CF" /><circle cx="32" cy="32" r="2.8" fill="#0B3D33" stroke="#A7E8CF" strokeWidth="1.4" /></svg>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>SB My Weight Compass</span>
            <span style={{ fontWeight: 500, fontSize: 11, color: "#A7E8CF" }}>{t.sub}</span>
          </span>
        </div>
        {navs.map((s) => (
          <button key={s} className="snav" data-active={screen === s ? 1 : 0} onClick={() => setScreen(s)}><Icon name={s} /><span>{t[s]}</span></button>
        ))}
        <div style={{ marginTop: "auto", paddingTop: 16 }}>
          <a href={`/${other}/app`} style={{ color: "#A7E8CF", fontSize: 13, fontWeight: 600, textDecoration: "none", padding: "0 15px" }}>{t.switchTo}</a>
        </div>
      </aside>

      <div className="main">
        {/* mobile topbar */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden><circle cx="32" cy="32" r="27" fill="none" stroke="#0EA672" strokeWidth="3.5" /><polygon points="32,7 25,39 32,33.5 39,39" fill="#E0A340" /><polygon points="32,57 25,25 32,30.5 39,25" fill="#0B3D33" /></svg>
            <span style={{ fontWeight: 800, fontSize: 14.5, color: "#0B3D33" }}>{title}</span>
          </div>
          <SignOut locale={locale} label={t.signout} />
        </div>
        {/* desktop header */}
        <div className="deskhead">
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0B3D33", letterSpacing: "-0.02em", margin: 0 }}>{title}</h1>
          <SignOut locale={locale} label={t.signout} />
        </div>

        <div className="content">
          {screen === "inicio" && <Inicio t={t} data={data} rings={rings} go={setScreen} openCheckin={() => setCheckin(true)} />}
          {screen === "cuerpo" && <Cuerpo t={t} data={data} ctab={ctab} setCtab={setCtab} range={range} setRange={setRange} wpts={wpts} mk={mk} mlab={mlab} />}
          {screen === "nutricion" && <Soon t={t} title={t.nutricion} />}
          {screen === "movimiento" && <Soon t={t} title={t.movimiento} />}
          {screen === "coach" && <Coach t={t} data={data} />}
          {screen === "perfil" && <Perfil t={t} data={data} other={other} />}
        </div>
      </div>

      {/* bottom nav (mobile) */}
      <nav className="bottomnav">
        {navs.map((s) => (
          <button key={s} className="navitem" data-active={screen === s ? 1 : 0} onClick={() => setScreen(s)}><Icon name={s} /><span>{t[s]}</span></button>
        ))}
      </nav>

      {/* chat FAB */}
      <button className="fab" onClick={() => setChat(true)} aria-label={t.chat}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" /></svg>
      </button>

      {chat && <ChatSheet t={t} close={() => setChat(false)} />}
      {checkin && <CheckinSheet t={t} data={data} close={() => setCheckin(false)} />}
    </div>
  );
}

function SignOut({ locale, label }: { locale: string; label: string }) {
  async function out() { await createClient().auth.signOut(); window.location.href = `/${locale}`; }
  return <button type="button" onClick={out} style={{ background: "transparent", border: "1px solid #E3E8E6", color: "#5C6B66", fontSize: 13, fontWeight: 600, padding: "7px 13px", borderRadius: 999, cursor: "pointer" }}>{label}</button>;
}

type T = typeof TXT["es"];

function Inicio({ t, data, rings, go, openCheckin }: { t: T; data: AppData; rings: { habits: number; water: number; steps: number }; go: (s: Seg) => void; openCheckin: () => void }) {
  const w = data.weight;
  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, color: "#5C6B66", fontWeight: 500 }}>{data.todayLabel}</p>
          <h2 style={{ margin: "4px 0 0", fontSize: 25, fontWeight: 800, letterSpacing: "-0.02em", color: "#0B3D33" }}>{t.inicio === "Home" ? `Hi, ${data.name} 👋` : `Hola, ${data.name} 👋`}</h2>
        </div>
        {data.streak > 0 && <span className="chip" style={{ background: "#FFF7EC", borderColor: "#F3D9A8", color: "#8A5A12" }}>🔥 {data.streak} {t.inicio === "Home" ? "days" : "días"}</span>}
      </div>

      <div className="dash">
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={eyebrow}>{t.weightNow}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", color: "#0B3D33", lineHeight: 1 }}>{w.current ?? "—"}</span>
                <span style={{ fontSize: 17, fontWeight: 600, color: "#5C6B66" }}>kg</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {w.delta !== null && <span className="chip" style={{ background: "#ECFBF4" }}>{w.delta <= 0 ? "▾" : "▴"} {Math.abs(w.delta)} kg</span>}
              {w.goal !== null && <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "#93A09B" }}>{t.goal} {w.goal} kg</p>}
            </div>
          </div>
          <div style={{ marginTop: 10 }}>{w.pts.length ? <Sparkline points={w.pts} goal={w.goal} unit=" kg" /> : <p style={{ color: "#93A09B", fontSize: 14 }}>{t.empty}</p>}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 6, fontSize: 12, color: "#5C6B66" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, height: 3, borderRadius: 2, background: "#0EA672" }} />{t.weight}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, height: 0, borderTop: "2px dashed #E0A340" }} />{t.goal}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0B3D33" }}>{t.today}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: 8 }}>
              <Ring pct={rings.habits} color="#0EA672" center={`${Math.round(rings.habits * 100)}%`} label={t.habits} />
              <Ring pct={rings.water} color="#3BA7E0" center={data.habits.water !== null ? String(data.habits.water) : "0"} label={t.water} />
              <Ring pct={rings.steps} color="#E0A340" center="—" label={t.steps} />
            </div>
          </div>
          <div className="card" style={{ padding: 18, background: "linear-gradient(135deg, #0B3D33, #115C49)", border: "none" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#A7E8CF", textTransform: "uppercase", letterSpacing: ".06em" }}>{t.next}</p>
            {data.nextAppt ? (
              <>
                <p style={{ margin: "9px 0 2px", fontSize: 17, fontWeight: 700, color: "#fff" }}>{data.nextAppt.whenLabel}</p>
                <p style={{ margin: 0, fontSize: 13.5, color: "#A7E8CF" }}>con Sebastián</p>
              </>
            ) : <p style={{ margin: "9px 0 0", fontSize: 14, color: "#A7E8CF" }}>{t.noNext}</p>}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, padding: "15px 18px", borderRadius: 18, background: "#ECFBF4", border: "1px solid #A7E8CF" }}>
        <span style={{ fontSize: 22 }}>🧭</span>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.45, color: "#0B3D33" }}><strong>{t.onTrack}, {data.name}.</strong></p>
      </div>

      <p style={{ margin: "22px 0 12px", fontSize: 15, fontWeight: 700, color: "#0B3D33" }}>{t.logToday}</p>
      <div className="cards4">
        {[["⚖️", t.weight, () => go("cuerpo")], ["🍽️", t.food, () => go("nutricion")], ["🏃", t.workout, () => go("movimiento")], ["💧", t.water, openCheckin]].map(([emo, label, fn], i) => (
          <button key={i} className="card" onClick={fn as () => void} style={{ padding: "16px 12px", cursor: "pointer", textAlign: "center", fontFamily: "inherit" }}>
            <div style={{ fontSize: 22 }}>{emo as string}</div>
            <p style={{ margin: "7px 0 0", fontSize: 12.5, fontWeight: 700, color: "#0B3D33" }}>{label as string}</p>
          </button>
        ))}
      </div>
    </>
  );
}

function Cuerpo({ t, data, ctab, setCtab, range, setRange, wpts, mk, mlab }: { t: T; data: AppData; ctab: string; setCtab: (s: "peso" | "antro" | "habitos" | "wearables") => void; range: string; setRange: (r: "1m" | "3m" | "6m" | "todo") => void; wpts: { t: number; v: number }[]; mk: (c: string, s: number) => Metric | null; mlab: (c: string) => string }) {
  const tabs: [string, string][] = [["peso", t.weight], ["antro", t.anthro], ["habitos", t.habits], ["wearables", t.wearables]];
  const anthroM = [mk("waist", 0.5), mk("hip", 0.5), mk("body_fat", 0.1)].filter(Boolean) as Metric[];
  const habitM = [mk("water", 1), mk("sleep", 0.5), mk("mood", 1)].filter(Boolean) as Metric[];
  return (
    <>
      <div className="subtabs" style={{ marginBottom: 16 }}>
        {tabs.map(([k, label]) => <button key={k} className="stab" data-active={ctab === k ? 1 : 0} onClick={() => setCtab(k as "peso")}>{label}</button>)}
      </div>

      {ctab === "peso" && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 34, fontWeight: 800, color: "#0B3D33", lineHeight: 1 }}>{data.weight.current ?? "—"}</span><span style={{ fontSize: 15, color: "#5C6B66", fontWeight: 600 }}>kg</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {data.weight.delta !== null && <span className="chip" style={{ background: "#ECFBF4" }}>{data.weight.delta <= 0 ? "▾" : "▴"} {Math.abs(data.weight.delta)} kg</span>}
                {data.weight.bmi !== null && <span className="chip">{data.weight.bmiCat} · {data.weight.bmi}</span>}
              </div>
            </div>
            <div className="seg" style={{ width: 180 }}>
              {(["1m", "3m", "6m", "todo"] as const).map((r) => <button key={r} className="segb" data-active={range === r ? 1 : 0} onClick={() => setRange(r)}>{r === "todo" ? (t.inicio === "Home" ? "All" : "Todo") : r.toUpperCase()}</button>)}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>{wpts.length ? <Sparkline points={wpts} goal={data.weight.goal} unit=" kg" /> : <p style={{ color: "#93A09B", fontSize: 14 }}>{t.empty}</p>}</div>
          <div style={{ marginTop: 16 }}>{mk("weight", 0.1) && <MetricLogger tenantId={data.tenantId} clientId={data.clientId} cols={1} metrics={[mk("weight", 0.1)!]} cta={t.saveW} saving={t.saving} saved={t.saved} errorLabel={t.err} />}</div>
        </div>
      )}

      {ctab === "antro" && (
        <div className="card" style={{ padding: 20 }}>
          <div className="cards3" style={{ marginBottom: 16 }}>
            {([["waist", data.anthro.waist, "cm"], ["hip", data.anthro.hip, "cm"], ["body_fat", data.anthro.bodyFat, "%"]] as const).map(([c, v, u]) => (
              <div key={c} style={{ background: "#F7FBF9", border: "1px solid #E8ECEA", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 12.5, color: "#5C6B66", fontWeight: 600 }}>{mlab(c)}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0B3D33", marginTop: 4 }}>{v ?? "—"}<span style={{ fontSize: 13, color: "#93A09B", fontWeight: 600 }}> {u}</span></div>
              </div>
            ))}
          </div>
          {anthroM.length > 0 && <MetricLogger tenantId={data.tenantId} clientId={data.clientId} cols={3} metrics={anthroM} cta={t.saveA} saving={t.saving} saved={t.saved} errorLabel={t.err} />}
        </div>
      )}

      {ctab === "habitos" && (
        <div className="card" style={{ padding: 20 }}>
          {habitM.length > 0 && <MetricLogger tenantId={data.tenantId} clientId={data.clientId} cols={3} metrics={habitM} cta={t.saveH} saving={t.saving} saved={t.saved} errorLabel={t.err} />}
        </div>
      )}

      {ctab === "wearables" && (
        <div className="card" style={{ padding: "36px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 30 }}>⌚</div>
          <p style={{ margin: "12px auto 0", maxWidth: 360, color: "#5C6B66", fontSize: 15.5, lineHeight: 1.5 }}>{t.connect}</p>
          <span style={{ display: "inline-block", marginTop: 16, fontSize: 13, fontWeight: 700, color: "#0B3D33", background: "#ECFBF4", border: "1px solid #A7E8CF", padding: "6px 14px", borderRadius: 999 }}>{t.soon}</span>
        </div>
      )}
    </>
  );
}

function Coach({ t, data }: { t: T; data: AppData }) {
  return (
    <>
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <p style={eyebrow}>{t.agenda}</p>
        {data.nextAppt
          ? <p style={{ margin: "10px 0 0", fontSize: 16, fontWeight: 600, color: "#0B3D33" }}>{data.nextAppt.whenLabel}<br /><span style={{ fontWeight: 500, color: "#5C6B66", fontSize: 14 }}>con Sebastián</span></p>
          : <p style={{ margin: "10px 0 0", color: "#5C6B66" }}>{t.noNext}</p>}
      </div>
      <Soon t={t} title={`${t.minutes} · ${t.summary}`} />
    </>
  );
}

function Perfil({ t, data, other }: { t: T; data: AppData; other: string }) {
  const row = { display: "flex", justifyContent: "space-between", gap: 16, padding: "11px 0", borderBottom: "1px solid #F0F4F2", fontSize: 15 } as const;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ padding: 20 }}>
        <p style={eyebrow}>{t.account}</p>
        <div style={{ marginTop: 8 }}>
          <div style={row}><span style={{ color: "#5C6B66" }}>{t.name}</span><b style={{ color: "#0B3D33" }}>{data.name}</b></div>
          <div style={row}><span style={{ color: "#5C6B66" }}>{t.email}</span><b style={{ color: "#0B3D33" }}>{data.email}</b></div>
          <div style={{ ...row, borderBottom: "none" }}><span style={{ color: "#5C6B66" }}>{t.lang}</span><a href={`/${other}/app`} style={{ color: "#0EA672", fontWeight: 700, textDecoration: "none" }}>{t.switchTo}</a></div>
        </div>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <p style={eyebrow}>{t.goalsT}</p>
        <div style={{ marginTop: 8 }}>
          <div style={row}><span style={{ color: "#5C6B66" }}>{t.goalWeight}</span><b style={{ color: "#0B3D33" }}>{data.weight.goal !== null ? `${data.weight.goal} kg` : "—"}</b></div>
          <div style={{ ...row, borderBottom: "none", flexWrap: "wrap" }}>{data.goals.length ? data.goals.map((g) => <span key={g} className="chip" style={{ marginRight: 8 }}>{g}</span>) : <span style={{ color: "#93A09B" }}>—</span>}</div>
        </div>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <p style={eyebrow}>{t.membership}</p>
        <div style={{ marginTop: 8 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}><span style={{ color: "#5C6B66" }}>{t.status}</span><b style={{ color: "#0B3D33", textTransform: "capitalize" }}>{data.membership ?? "—"}</b></div></div>
      </div>
    </div>
  );
}

function Soon({ t, title }: { t: T; title: string }) {
  return (
    <div className="card" style={{ padding: "40px 28px", textAlign: "center" }}>
      <span style={eyebrow}>{title}</span>
      <p style={{ margin: "12px auto 0", maxWidth: 420, fontSize: 16, lineHeight: 1.55, color: "#5C6B66" }}>{t.soonBody}</p>
      <span style={{ display: "inline-block", marginTop: 18, fontSize: 13, fontWeight: 700, color: "#0B3D33", background: "#ECFBF4", border: "1px solid #A7E8CF", padding: "6px 14px", borderRadius: 999 }}>{t.soon}</span>
    </div>
  );
}

function ChatSheet({ t, close }: { t: T; close: () => void }) {
  const [msgs, setMsgs] = useState<{ me: boolean; text: string }[]>([{ me: false, text: t.chatHello }]);
  const [val, setVal] = useState("");
  function send() {
    if (!val.trim()) return;
    setMsgs((m) => [...m, { me: true, text: val }, { me: false, text: t.chatSoon }]);
    setVal("");
  }
  return (
    <div className="overlay" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid #EAEFEC", background: "#fff" }}>
          <b style={{ color: "#0B3D33" }}>{t.chat}</b>
          <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "#5C6B66", fontSize: 20 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map((m, i) => <div key={i} className={"bub " + (m.me ? "me" : "bot")}>{m.text}</div>)}
        </div>
        <div style={{ display: "flex", gap: 8, padding: 14, borderTop: "1px solid #EAEFEC", background: "#fff" }}>
          <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={t.chatPh} style={{ flex: 1, padding: "11px 14px", border: "1px solid #E3E8E6", borderRadius: 999, fontSize: 15, fontFamily: "inherit", outline: "none" }} />
          <button className="pill" onClick={send}>{t.send}</button>
        </div>
      </div>
    </div>
  );
}

function CheckinSheet({ t, data, close }: { t: T; data: AppData; close: () => void }) {
  const [adh, setAdh] = useState(0);
  const [ene, setEne] = useState(0);
  const [obs, setObs] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  async function save() {
    setState("saving");
    try {
      await createClient().schema("core").from("check_ins").insert({ tenant_id: data.tenantId, client_id: data.clientId, adherence: adh || null, energy: ene || null, obstacles: obs || null });
      setState("done");
      setTimeout(close, 900);
    } catch { setState("idle"); }
  }
  const scale = (val: number, set: (n: number) => void) => (
    <div style={{ display: "flex", gap: 8 }}>{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => set(n)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid " + (val === n ? "#0EA672" : "#E3E8E6"), background: val === n ? "#0EA672" : "#fff", color: val === n ? "#fff" : "#11201C", fontWeight: 700, cursor: "pointer" }}>{n}</button>)}</div>
  );
  return (
    <div className="overlay" onClick={close}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid #EAEFEC", background: "#fff" }}>
          <b style={{ color: "#0B3D33" }}>{t.checkin}</b>
          <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: "#5C6B66", fontSize: 20 }}>×</button>
        </div>
        <div style={{ padding: 18, overflowY: "auto" }}>
          {state === "done" ? <p style={{ textAlign: "center", color: "#0B3D33", fontWeight: 700, padding: "20px 0" }}>{t.thanks}</p> : (
            <>
              <p style={{ margin: "0 0 8px", fontWeight: 600, color: "#11201C" }}>{t.adherence}</p>{scale(adh, setAdh)}
              <p style={{ margin: "18px 0 8px", fontWeight: 600, color: "#11201C" }}>{t.energy}</p>{scale(ene, setEne)}
              <p style={{ margin: "18px 0 8px", fontWeight: 600, color: "#11201C" }}>{t.obstacles}</p>
              <textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} placeholder={t.obsPh} style={{ width: "100%", padding: "12px 14px", border: "1px solid #E3E8E6", borderRadius: 12, fontSize: 15, fontFamily: "inherit", resize: "vertical", outline: "none" }} />
              <button className="pill" onClick={save} disabled={state === "saving"} style={{ width: "100%", marginTop: 16, opacity: state === "saving" ? 0.6 : 1 }}>{state === "saving" ? t.saving : t.saveCheck}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
