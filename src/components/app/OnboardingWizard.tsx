"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type L = { en: string; es: string };
type Opt = { v: string; en: string; es: string };

type Block =
  | { kind: "input"; inputType: "email" | "tel" | "text"; name: string; label: L; ph: L }
  | { kind: "textarea"; name: string; ph: L }
  | { kind: "range"; name: string; heading: L; hint?: L; min: number; max: number; step: number; def: number; unit: L }
  | { kind: "choice"; multi: boolean; name: string; heading?: L; cols: number; long?: boolean; options: Opt[] }
  | { kind: "bmi" };

type Step = { eyebrow: L; title?: L; intro?: L; blocks: Block[] };

const G = "#0EA672";
const INK = "#0B3D33";
const MUT = "#5C6B66";

const UI = {
  welcomeTitle: { en: "Let's build your profile", es: "Construyamos tu perfil" },
  welcomeSub: {
    en: "A few quick questions about your details, habits and goals. Most are tap or slide — about 4 minutes, and it helps us design your tailored plan.",
    es: "Unas preguntas rápidas sobre tus datos, hábitos y objetivos. Casi todo es elegir o deslizar — toma unos 4 minutos y nos ayuda a diseñar tu plan a medida.",
  },
  chips: { en: ["~4 minutes", "Private & secure", "Bilingual EN/ES"], es: ["~4 minutos", "Privado y seguro", "Bilingüe EN/ES"] },
  start: { en: "Start questionnaire", es: "Comenzar cuestionario" },
  back: { en: "Back", es: "Atrás" },
  cont: { en: "Continue", es: "Continuar" },
  finish: { en: "Finish", es: "Finalizar" },
  welcome: { en: "Welcome", es: "Bienvenida" },
  subtitle: { en: "Client profile", es: "Perfil del cliente" },
  stepOf: { en: (a: number, b: number) => `Step ${a} of ${b}`, es: (a: number, b: number) => `Paso ${a} de ${b}` },
  thanksTitle: { en: "Thank you", es: "¡Gracias" },
  thanksBody: {
    en: "We've received your profile. Sebastián will review it and reach out for your free 30-minute consult and the next steps.",
    es: "Recibimos tu perfil. Sebastián lo revisará y se pondrá en contacto para tu consulta gratuita de 30 minutos y los siguientes pasos.",
  },
  recap: { en: "Summary", es: "Resumen" },
  book: { en: "Book my consult", es: "Agendar mi consulta" },
  err: { en: "Something went wrong. Please try again.", es: "Algo salió mal. Inténtalo de nuevo." },
  saving: { en: "Saving…", es: "Guardando…" },
  bmiLabel: { en: "Your estimated BMI", es: "Tu IMC estimado" },
  bmiNote: { en: "From your height and weight", es: "Con tu estatura y peso" },
};

function bmiCategory(b: number): L {
  if (b < 18.5) return { en: "Underweight", es: "Bajo peso" };
  if (b < 25) return { en: "Healthy", es: "Saludable" };
  if (b < 30) return { en: "Overweight", es: "Sobrepeso" };
  return { en: "Obesity", es: "Obesidad" };
}

function buildSteps(conditions: Opt[]): Step[] {
  return [
    {
      eyebrow: { en: "Contact", es: "Contacto" },
      title: { en: "Let's start with the basics", es: "Empecemos por lo básico" },
      blocks: [
        { kind: "input", inputType: "email", name: "email", label: { en: "Email", es: "Correo electrónico" }, ph: { en: "you@example.com", es: "tucorreo@ejemplo.com" } },
        { kind: "input", inputType: "tel", name: "phone", label: { en: "Phone (WhatsApp)", es: "Teléfono (WhatsApp)" }, ph: { en: "+61 ___ ___ ___", es: "+61 ___ ___ ___" } },
      ],
    },
    {
      eyebrow: { en: "About you", es: "Sobre ti" },
      title: { en: "A little about you", es: "Un poco sobre ti" },
      blocks: [
        { kind: "range", name: "age", heading: { en: "Age", es: "Edad" }, min: 14, max: 90, step: 1, def: 35, unit: { en: " yrs", es: " años" } },
        { kind: "choice", multi: false, name: "sex", heading: { en: "Sex", es: "Sexo" }, cols: 3, options: [
          { v: "female", en: "Female", es: "Femenino" }, { v: "male", en: "Male", es: "Masculino" }, { v: "na", en: "Prefer not to say", es: "Prefiero no decir" } ] },
      ],
    },
    {
      eyebrow: { en: "Measurements", es: "Medidas" },
      title: { en: "Your measurements", es: "Tus medidas" },
      blocks: [
        { kind: "range", name: "height", heading: { en: "Height", es: "Estatura" }, min: 140, max: 210, step: 1, def: 170, unit: { en: " cm", es: " cm" } },
        { kind: "range", name: "currentWeight", heading: { en: "Current weight", es: "Peso actual" }, hint: { en: "Approximate is fine", es: "Aproximado está bien" }, min: 40, max: 180, step: 0.5, def: 75, unit: { en: " kg", es: " kg" } },
      ],
    },
    {
      eyebrow: { en: "Your goal", es: "Tu meta" },
      title: { en: "Where you're headed", es: "A dónde quieres llegar" },
      blocks: [
        { kind: "range", name: "goalWeight", heading: { en: "Goal weight", es: "Peso meta" }, min: 40, max: 180, step: 0.5, def: 70, unit: { en: " kg", es: " kg" } },
        { kind: "bmi" },
      ],
    },
    {
      eyebrow: { en: "Body composition (optional)", es: "Composición corporal (opcional)" },
      title: { en: "A few optional details", es: "Algunos datos opcionales" },
      intro: { en: "Adjust if you know them; otherwise just continue.", es: "Ajústalas si las conoces; si no, continúa sin problema." },
      blocks: [
        { kind: "range", name: "bodyFat", heading: { en: "Body fat %", es: "% de grasa corporal" }, hint: { en: "Leave it if you don't know", es: "Déjalo si no lo sabes" }, min: 5, max: 55, step: 1, def: 25, unit: { en: " %", es: " %" } },
        { kind: "range", name: "waist", heading: { en: "Waist", es: "Cintura" }, min: 50, max: 160, step: 1, def: 85, unit: { en: " cm", es: " cm" } },
        { kind: "range", name: "hip", heading: { en: "Hip", es: "Cadera" }, min: 60, max: 170, step: 1, def: 95, unit: { en: " cm", es: " cm" } },
      ],
    },
    {
      eyebrow: { en: "Physical activity", es: "Actividad física" },
      title: { en: "How you move", es: "Cómo te mueves" },
      blocks: [
        { kind: "range", name: "trainDays", heading: { en: "Training days per week", es: "Días de entrenamiento por semana" }, hint: { en: "Strength, cardio or sport", es: "Fuerza, cardio o deportes" }, min: 0, max: 7, step: 1, def: 3, unit: { en: " days", es: " días" } },
        { kind: "choice", multi: false, name: "activityType", heading: { en: "Main activity", es: "Tu actividad principal" }, cols: 2, options: [
          { v: "strength", en: "Weights / strength", es: "Pesas / fuerza" }, { v: "cardio", en: "Cardio", es: "Cardio" },
          { v: "sports", en: "Sports", es: "Deportes" }, { v: "mixed", en: "Mixed", es: "Mixto" },
          { v: "none", en: "Hardly any right now", es: "Casi nada por ahora" } ] },
      ],
    },
    {
      eyebrow: { en: "Lifestyle", es: "Estilo de vida" },
      title: { en: "Your everyday life", es: "Tu día a día" },
      blocks: [
        { kind: "choice", multi: false, name: "activityLevel", heading: { en: "Day-to-day (excluding exercise)", es: "Tu día a día (sin contar ejercicio)" }, cols: 2, options: [
          { v: "sedentary", en: "Sedentary", es: "Sedentario" }, { v: "moderate", en: "Moderately active", es: "Moderadamente activo" },
          { v: "active", en: "Active", es: "Activo" }, { v: "very", en: "Very active", es: "Muy activo" } ] },
        { kind: "choice", multi: false, name: "describes", heading: { en: "Which best describes you?", es: "¿Cuál te describe mejor?" }, cols: 2, options: [
          { v: "sed_adult", en: "Sedentary adult", es: "Adulto sedentario" }, { v: "training_adult", en: "Adult who trains", es: "Adulto que entrena" },
          { v: "athlete", en: "Competitive athlete", es: "Atleta competitivo" }, { v: "teen", en: "Growing teen", es: "Adolescente en crecimiento" },
          { v: "muscle", en: "Adult building muscle", es: "Adulto ganando músculo" }, { v: "restricting", en: "Calorie restricting", es: "Restringiendo calorías" } ] },
      ],
    },
    {
      eyebrow: { en: "Your goals", es: "Tus metas" },
      title: { en: "What do you want to achieve?", es: "¿Qué quieres lograr?" },
      intro: { en: "Pick all that apply.", es: "Elige todas las que apliquen." },
      blocks: [
        { kind: "choice", multi: true, name: "goals", cols: 2, options: [
          { v: "lose", en: "Lose weight", es: "Pérdida de peso" }, { v: "habits", en: "Better habits", es: "Mejores hábitos" },
          { v: "gain", en: "Gain weight", es: "Ganar peso" }, { v: "strength", en: "Build strength", es: "Mejorar fuerza" },
          { v: "flex", en: "More flexibility", es: "Mejorar flexibilidad" }, { v: "cardio", en: "Better cardio", es: "Mejorar cardio" },
          { v: "maintain", en: "Maintain my shape", es: "Mantener mi forma" }, { v: "energy", en: "More energy", es: "Más energía" } ] },
      ],
    },
    {
      eyebrow: { en: "Body type", es: "Tipo de cuerpo" },
      title: { en: "Which phrase fits you best?", es: "¿Qué frase te describe mejor?" },
      blocks: [
        { kind: "choice", multi: false, name: "bodyType", cols: 1, long: true, options: [
          { v: "hard_gain", en: "I can eat almost anything and not gain. It's hard for me to put on weight.", es: "Puedo comer casi cualquier cosa y no engordo. Me cuesta mucho subir de peso." },
          { v: "adjustable", en: "I can gain or lose by adjusting my activity and food.", es: "Puedo subir o bajar de peso ajustando mi actividad y mi alimentación." },
          { v: "hard_lose", en: "I find it hard to lose weight. I gain easily and must watch what I eat.", es: "Me cuesta bajar de peso. Subo con facilidad y debo cuidar lo que como." } ] },
      ],
    },
    {
      eyebrow: { en: "Health", es: "Salud" },
      title: { en: "Any medical conditions?", es: "¿Alguna condición médica?" },
      intro: { en: "Tick any that apply. This doesn't replace your doctor's assessment.", es: "Marca las que apliquen. No sustituye la valoración de tu médico." },
      blocks: [{ kind: "choice", multi: true, name: "conditions", cols: 2, options: conditions }],
    },
    {
      eyebrow: { en: "Nutrition", es: "Alimentación" },
      title: { en: "Eating & hydration", es: "Alimentación e hidratación" },
      blocks: [
        { kind: "range", name: "meals", heading: { en: "Meals per day", es: "Comidas al día" }, hint: { en: "Include main snacks", es: "Incluye snacks principales" }, min: 1, max: 6, step: 1, def: 3, unit: { en: " meals", es: " comidas" } },
        { kind: "range", name: "water", heading: { en: "Glasses of water per day", es: "Vasos de agua al día" }, min: 0, max: 14, step: 1, def: 6, unit: { en: " glasses", es: " vasos" } },
      ],
    },
    {
      eyebrow: { en: "Rest", es: "Descanso" },
      title: { en: "Sleep", es: "Sueño" },
      blocks: [
        { kind: "range", name: "sleepHours", heading: { en: "Hours of sleep per night", es: "Horas de sueño por noche" }, hint: { en: "On average", es: "En promedio" }, min: 3, max: 12, step: 0.5, def: 7, unit: { en: " h", es: " h" } },
        { kind: "choice", multi: false, name: "sleepQuality", heading: { en: "Sleep quality", es: "Calidad de tu sueño" }, cols: 3, options: [
          { v: "poor", en: "Poor", es: "Mala" }, { v: "fair", en: "Fair", es: "Regular" }, { v: "good", en: "Good", es: "Buena" } ] },
      ],
    },
    {
      eyebrow: { en: "Habits", es: "Hábitos" },
      title: { en: "Tobacco & alcohol", es: "Tabaco y alcohol" },
      blocks: [
        { kind: "choice", multi: false, name: "tobacco", heading: { en: "Tobacco", es: "Tabaco" }, cols: 3, options: [
          { v: "no", en: "Don't smoke", es: "No fumo" }, { v: "occasional", en: "Occasional", es: "Ocasional" }, { v: "daily", en: "Daily", es: "A diario" } ] },
        { kind: "choice", multi: false, name: "alcohol", heading: { en: "Alcohol", es: "Alcohol" }, cols: 3, options: [
          { v: "no", en: "Don't drink", es: "No bebo" }, { v: "occasional", en: "Occasional", es: "Ocasional" }, { v: "frequent", en: "Frequent", es: "Frecuente" } ] },
      ],
    },
    {
      eyebrow: { en: "Body & mobility", es: "Cuerpo y movilidad" },
      title: { en: "Injuries & mobility", es: "Lesiones y movilidad" },
      blocks: [
        { kind: "choice", multi: true, name: "injuries", heading: { en: "Injuries or pain? (tick any)", es: "¿Lesiones o molestias? (marca las que apliquen)" }, cols: 3, options: [
          { v: "none", en: "None", es: "Ninguna" }, { v: "knee", en: "Knee", es: "Rodilla" }, { v: "back", en: "Back", es: "Espalda" },
          { v: "shoulder", en: "Shoulder", es: "Hombro" }, { v: "hip", en: "Hip", es: "Cadera" }, { v: "other", en: "Other", es: "Otra" } ] },
        { kind: "choice", multi: false, name: "stretch", heading: { en: "Do you stretch daily?", es: "¿Estiras a diario?" }, cols: 2, options: [
          { v: "yes", en: "Yes", es: "Sí" }, { v: "no", en: "No", es: "No" } ] },
      ],
    },
    {
      eyebrow: { en: "To finish", es: "Para terminar" },
      title: { en: "Anything else to add?", es: "¿Algo más que quieras agregar?" },
      intro: { en: "Optional. Any detail about your routine, preferences or what you hope for helps us tailor your plan.", es: "Opcional. Cualquier detalle sobre tu rutina, preferencias o lo que esperas nos ayuda a personalizar tu plan." },
      blocks: [{ kind: "textarea", name: "notes", ph: { en: "Write anything you'd like to share…", es: "Escribe aquí lo que quieras compartir…" } }],
    },
  ];
}

const Check = ({ s = "#fff", w = 3.5 }: { s?: string; w?: number }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={s} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);
const Compass = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="27" fill="none" stroke={G} strokeWidth="3.5" />
    <polygon points="32,7 25,39 32,33.5 39,39" fill="#E0A340" />
    <polygon points="32,57 25,25 32,30.5 39,25" fill={INK} />
    <circle cx="32" cy="32" r="2.8" fill="#FFFFFF" stroke={INK} strokeWidth="1.4" />
  </svg>
);
const Arrow = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
const ArrowL = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>);

export function OnboardingWizard(props: {
  locale: string;
  tenantId: string;
  clientId: string;
  templateId: string;
  existingSubmissionId: string | null;
  medicalQuestionId: string;
  conditionOptions: Opt[];
  userEmail: string;
  displayName: string | null;
}) {
  const lang: "en" | "es" = props.locale === "es" ? "es" : "en";
  const tr = (l: L) => l[lang];
  const steps = useMemo(() => buildSteps(props.conditionOptions), [props.conditionOptions]);
  const N = steps.length;

  const initial = useMemo(() => {
    const d: Record<string, unknown> = { email: props.userEmail };
    for (const s of steps) for (const b of s.blocks) if (b.kind === "range") d[b.name] = b.def;
    return d;
  }, [steps, props.userEmail]);

  const [data, setData] = useState<Record<string, unknown>>(initial);
  const [phase, setPhase] = useState<"welcome" | "q" | "thanks">("welcome");
  const [qi, setQi] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const set = (k: string, v: unknown) => setData((d) => ({ ...d, [k]: v }));
  const toggle = (k: string, v: string) =>
    setData((d) => {
      const cur = Array.isArray(d[k]) ? (d[k] as string[]) : [];
      return { ...d, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
    });

  const pct = phase === "welcome" ? 4 : phase === "thanks" ? 100 : Math.round(((qi + 1) / N) * 100);

  async function submit() {
    setSaving(true);
    setError(false);
    try {
      const supabase = createClient();
      const core = supabase.schema("core");
      let sid = props.existingSubmissionId;
      const profile = { ...data, locale: props.locale, capturedAt: new Date().toISOString() };
      if (!sid) {
        const { data: ins, error: e1 } = await core
          .from("intake_submissions")
          .insert({ tenant_id: props.tenantId, client_id: props.clientId, template_id: props.templateId, status: "in_progress", profile })
          .select("id").single();
        if (e1) throw e1;
        sid = (ins as { id: string }).id;
      } else {
        const { error: eU } = await core.from("intake_submissions").update({ profile }).eq("id", sid);
        if (eU) throw eU;
        await core.from("intake_answers").delete().eq("submission_id", sid);
      }
      const conditions = Array.isArray(data.conditions) ? (data.conditions as string[]) : [];
      const { error: e2 } = await core.from("intake_answers").insert({
        submission_id: sid, question_id: props.medicalQuestionId, tenant_id: props.tenantId, value: conditions,
      });
      if (e2) throw e2;
      const { error: e3 } = await supabase.rpc("submit_intake", { p_submission: sid });
      if (e3) throw e3;
      setPhase("thanks");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (phase === "welcome") { setPhase("q"); setQi(0); window.scrollTo({ top: 0 }); return; }
    if (qi < N - 1) { setQi(qi + 1); window.scrollTo({ top: 0 }); return; }
    submit();
  }
  function back() {
    if (qi === 0) { setPhase("welcome"); return; }
    setQi(qi - 1); window.scrollTo({ top: 0 });
  }

  const bmi = (() => {
    const h = Number(data.height) / 100;
    const w = Number(data.currentWeight);
    if (!h || !w) return null;
    return Math.round((w / (h * h)) * 10) / 10;
  })();

  const eyebrow = (t: L) => (<span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: G }}>{tr(t)}</span>);

  function renderBlock(b: Block, i: number) {
    if (b.kind === "input")
      return (
        <div key={i} style={{ margin: "18px 0 0" }}>
          <label style={{ display: "block", fontSize: 14.5, fontWeight: 600, color: "#11201C", marginBottom: 8 }}>{tr(b.label)}</label>
          <input type={b.inputType} value={(data[b.name] as string) ?? ""} placeholder={tr(b.ph)} onChange={(e) => set(b.name, e.target.value)}
            style={{ width: "100%", padding: "13px 15px", border: "1px solid #E3E8E6", borderRadius: 12, fontSize: 15.5, fontFamily: "inherit", color: "#11201C", background: "#fff", outline: "none" }} />
        </div>
      );
    if (b.kind === "textarea")
      return (
        <textarea key={i} rows={5} value={(data[b.name] as string) ?? ""} placeholder={tr(b.ph)} onChange={(e) => set(b.name, e.target.value)}
          style={{ marginTop: 18, width: "100%", padding: "14px 15px", border: "1px solid #E3E8E6", borderRadius: 12, fontSize: 15.5, fontFamily: "inherit", lineHeight: 1.5, color: "#11201C", background: "#fff", outline: "none", resize: "vertical" }} />
      );
    if (b.kind === "range") {
      const v = Number(data[b.name] ?? b.def);
      const disp = (b.step < 1 ? v : Math.round(v)) + tr(b.unit);
      return (
        <div key={i} style={{ margin: "22px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <label style={{ fontSize: 15, fontWeight: 700, color: INK }}>{tr(b.heading)}{b.hint ? <span style={{ fontWeight: 500, color: MUT, fontSize: 13, marginLeft: 8 }}>{tr(b.hint)}</span> : null}</label>
            <span style={{ fontSize: 17, fontWeight: 800, color: INK }}>{disp}</span>
          </div>
          <input type="range" min={b.min} max={b.max} step={b.step} value={v} onChange={(e) => set(b.name, Number(e.target.value))} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#93A09B", marginTop: 6 }}><span>{b.min}</span><span>{b.max}</span></div>
        </div>
      );
    }
    if (b.kind === "bmi") {
      return (
        <div key={i} style={{ margin: "24px 0 0" }}>
          <h3 style={{ margin: 0, fontSize: 18.5, fontWeight: 700, color: INK }}>{tr(UI.bmiLabel)}</h3>
          <div style={{ margin: "14px 0 0", display: "flex", alignItems: "center", gap: 16, background: "#F7FBF9", border: "1px solid #E8ECEA", borderRadius: 16, padding: "18px 20px" }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: INK, lineHeight: 1 }}>{bmi ?? "—"}</span>
            {bmi ? <span style={{ display: "inline-flex", alignItems: "center", fontSize: 13.5, fontWeight: 700, color: INK, background: "#ECFBF4", border: "1px solid #A7E8CF", padding: "6px 12px", borderRadius: 999 }}>{tr(bmiCategory(bmi))}</span> : null}
            <span style={{ fontSize: 13, color: "#93A09B", marginLeft: "auto", textAlign: "right", lineHeight: 1.4 }}>{tr(UI.bmiNote)}</span>
          </div>
        </div>
      );
    }
    // choice
    const cols = b.cols;
    const gridCols = cols === 1 ? "1fr" : cols === 2 ? "1fr 1fr" : "1fr 1fr 1fr";
    return (
      <div key={i} style={{ margin: "22px 0 0" }}>
        {b.heading ? <h3 style={{ margin: "0 0 14px", fontSize: 18.5, fontWeight: 700, color: INK }}>{tr(b.heading)}</h3> : null}
        <div className={cols === 3 ? "onb-grid-3" : undefined} style={{ display: "grid", gridTemplateColumns: gridCols, gap: 10 }}>
          {b.options.map((o) => {
            const checked = b.multi ? (Array.isArray(data[b.name]) && (data[b.name] as string[]).includes(o.v)) : data[b.name] === o.v;
            return (
              <label key={o.v} className={"opt" + (b.multi ? " sq" : "")} style={b.long ? { alignItems: "flex-start" } : undefined}>
                <input type={b.multi ? "checkbox" : "radio"} name={b.name} checked={checked} onChange={() => (b.multi ? toggle(b.name, o.v) : set(b.name, o.v))} />
                <span className="dot" style={b.long ? { marginTop: 2 } : undefined}><Check /></span>
                <span style={b.long ? { fontWeight: 500, lineHeight: 1.5 } : undefined}>{tr(o)}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  const cur = steps[qi];
  const stepLabel = phase === "welcome" ? tr(UI.welcome) : phase === "thanks" ? "" : UI.stepOf[lang](qi + 1, N);
  const greet = props.displayName ? `, ${props.displayName.split(" ")[0]}` : "";

  return (
    <div className="onb-wizard" style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#11201C", minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, #ECFBF4 0%, #F7FBF9 320px, #F7FBF9 100%)" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(247,251,249,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E3E8E6" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Compass />
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
              <span style={{ fontWeight: 800, fontSize: 14.5, letterSpacing: "-0.01em", color: INK }}>SB My Weight Compass</span>
              <span style={{ fontWeight: 500, fontSize: 11, color: MUT }}>{tr(UI.subtitle)}</span>
            </span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: MUT }}>{stepLabel}</span>
        </div>
        <div style={{ height: 4, background: "#E3E8E6" }}>
          <div style={{ height: "100%", width: pct + "%", background: "linear-gradient(90deg, #0EA672, #16C088)", transition: "width .35s ease" }} />
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 22px 64px" }}>
        <div style={{ width: "100%", maxWidth: 640, background: "#FFFFFF", border: "1px solid #E8ECEA", borderRadius: 26, boxShadow: "0 30px 64px -34px rgba(11,61,51,0.42)", overflow: "hidden" }}>
          <div className="onb-card-pad onb-step" style={{ padding: "40px 40px 8px" }} key={phase + qi}>
            {phase === "welcome" && (
              <div style={{ textAlign: "center", padding: "14px 0 6px" }}>
                <div style={{ margin: "0 auto", width: 68 }}><Compass size={68} /></div>
                <h1 style={{ margin: "22px 0 0", fontSize: 30, lineHeight: 1.12, letterSpacing: "-0.02em", fontWeight: 800, color: INK }}>{tr(UI.welcomeTitle)}</h1>
                <p style={{ margin: "14px auto 0", fontSize: 16.5, lineHeight: 1.55, color: MUT, maxWidth: 440 }}>{tr(UI.welcomeSub)}</p>
                <div style={{ margin: "24px 0 6px", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 9 }}>
                  {UI.chips[lang].map((c) => (
                    <span key={c} style={{ fontSize: 13, fontWeight: 600, color: INK, background: "#ECFBF4", border: "1px solid #A7E8CF", padding: "6px 13px", borderRadius: 999 }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            {phase === "q" && (
              <div>
                {eyebrow(cur.eyebrow)}
                {cur.title ? <h2 style={{ margin: "10px 0 0", fontSize: 25, lineHeight: 1.15, letterSpacing: "-0.015em", fontWeight: 800, color: INK }}>{tr(cur.title)}</h2> : null}
                {cur.intro ? <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.55, color: MUT }}>{tr(cur.intro)}</p> : null}
                {cur.blocks.map((b, i) => renderBlock(b, i))}
                {error ? <p style={{ color: "#DC2626", fontSize: 14, marginTop: 16 }}>{tr(UI.err)}</p> : null}
              </div>
            )}

            {phase === "thanks" && (
              <div style={{ textAlign: "center", padding: "18px 0 8px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 76, height: 76, borderRadius: "50%", background: "#ECFBF4", border: "1px solid #A7E8CF", animation: "onbPopIn .45s ease both" }}>
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                <h1 style={{ margin: "22px 0 0", fontSize: 29, lineHeight: 1.12, letterSpacing: "-0.02em", fontWeight: 800, color: INK }}>{tr(UI.thanksTitle)}{greet}{lang === "es" ? "!" : "!"}</h1>
                <p style={{ margin: "14px auto 0", fontSize: 16.5, lineHeight: 1.55, color: MUT, maxWidth: 440 }}>{tr(UI.thanksBody)}</p>
                <div style={{ margin: "26px 0 6px", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
                  <a href={`/${props.locale}#agenda`} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: G, color: "#fff", fontSize: 15.5, fontWeight: 600, textDecoration: "none", padding: "13px 24px", borderRadius: 999, boxShadow: "0 10px 26px -10px rgba(14,166,114,0.65)" }}>{tr(UI.book)}</a>
                </div>
              </div>
            )}
          </div>

          {phase === "welcome" && (
            <div className="onb-foot-pad" style={{ padding: "16px 40px 36px" }}>
              <button type="button" onClick={next} style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, background: G, color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "inherit", border: "none", cursor: "pointer", padding: "15px 24px", borderRadius: 999, boxShadow: "0 12px 28px -10px rgba(14,166,114,0.65)" }}>
                {tr(UI.start)} <Arrow />
              </button>
            </div>
          )}

          {phase === "q" && (
            <div className="onb-foot-pad" style={{ padding: "14px 40px 32px", borderTop: "1px solid #F0F3F1", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
              <button type="button" onClick={back} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", color: MUT, fontSize: 15, fontWeight: 600, fontFamily: "inherit", border: "1px solid #E3E8E6", cursor: "pointer", padding: "12px 20px", borderRadius: 999 }}>
                <ArrowL /> {tr(UI.back)}
              </button>
              <button type="button" onClick={next} disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: G, color: "#fff", fontSize: 15.5, fontWeight: 700, fontFamily: "inherit", border: "none", cursor: "pointer", padding: "12px 26px", borderRadius: 999, boxShadow: "0 10px 24px -10px rgba(14,166,114,0.6)", opacity: saving ? 0.6 : 1 }}>
                {saving ? tr(UI.saving) : qi === N - 1 ? tr(UI.finish) : tr(UI.cont)} {!saving && <Arrow />}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
