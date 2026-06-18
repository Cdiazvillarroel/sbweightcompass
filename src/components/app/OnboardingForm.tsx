"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Option = { value: string; en?: string; es?: string };
type Question = {
  id: string;
  code: string;
  prompt: Record<string, string>;
  type: string;
  options: Option[];
  is_screening: boolean;
  position: number;
};

const T = {
  en: { submit: "Submit my answers", submitting: "Saving…", err: "Something went wrong. Please try again.", yes: "Yes", no: "No", disclaimer: "This intake is part of non-clinical lifestyle coaching, not medical care. Some answers help us flag if you should check with your GP first." },
  es: { submit: "Enviar mis respuestas", submitting: "Guardando…", err: "Algo salió mal. Inténtalo de nuevo.", yes: "Sí", no: "No", disclaimer: "Este intake es parte del coaching de estilo de vida no clínico, no atención médica. Algunas respuestas nos ayudan a indicar si deberías consultar a tu médico (GP) primero." },
};

export function OnboardingForm({
  locale, tenantId, clientId, templateId, existingSubmissionId, title, questions,
}: {
  locale: string; tenantId: string; clientId: string; templateId: string;
  existingSubmissionId: string | null; title: string; questions: Question[];
}) {
  const t = T[locale === "es" ? "es" : "en"];
  const lang = locale === "es" ? "es" : "en";
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");

  function set(qid: string, value: unknown) {
    setAnswers((a) => ({ ...a, [qid]: value }));
  }
  function toggleMulti(qid: string, value: string) {
    setAnswers((a) => {
      const cur = Array.isArray(a[qid]) ? (a[qid] as string[]) : [];
      return { ...a, [qid]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("saving");
    try {
      const supabase = createClient();
      const core = supabase.schema("core");
      let submissionId = existingSubmissionId;
      if (!submissionId) {
        const { data, error } = await core
          .from("intake_submissions")
          .insert({ tenant_id: tenantId, client_id: clientId, template_id: templateId, status: "in_progress" })
          .select("id").single();
        if (error) throw error;
        submissionId = (data as { id: string }).id;
      }
      const rows = questions
        .filter((q) => answers[q.id] !== undefined)
        .map((q) => ({ submission_id: submissionId, question_id: q.id, tenant_id: tenantId, value: answers[q.id] }));
      if (rows.length) {
        const { error } = await core.from("intake_answers").insert(rows);
        if (error) throw error;
      }
      const { error: rpcErr } = await supabase.rpc("submit_intake", { p_submission: submissionId });
      if (rpcErr) throw rpcErr;
      window.location.reload();
    } catch {
      setState("error");
    }
  }

  const inputStyle = { padding: "10px 12px", borderRadius: 10, border: "1px solid #E3E8E6", fontSize: 15, width: "100%" } as const;

  return (
    <form onSubmit={onSubmit}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0B3D33", marginBottom: 6 }}>{title}</h1>
      <p style={{ color: "#5C6B66", fontSize: 13, marginBottom: 24 }}>{t.disclaimer}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {questions.map((q) => {
          const label = q.prompt?.[lang] ?? q.prompt?.en ?? q.code;
          return (
            <div key={q.id}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>{label}</label>
              {q.type === "multi_choice" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(q.options ?? []).map((o) => {
                    const sel = Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(o.value);
                    return (
                      <button type="button" key={o.value} onClick={() => toggleMulti(q.id, o.value)}
                        style={{ padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                          border: "1px solid " + (sel ? "#0EA672" : "#E3E8E6"),
                          background: sel ? "#0EA672" : "#fff", color: sel ? "#fff" : "#11201C", fontSize: 14 }}>
                        {o[lang] ?? o.en ?? o.value}
                      </button>
                    );
                  })}
                </div>
              )}
              {q.type === "single_choice" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(q.options ?? []).map((o) => {
                    const sel = answers[q.id] === o.value;
                    return (
                      <button type="button" key={o.value} onClick={() => set(q.id, o.value)}
                        style={{ padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                          border: "1px solid " + (sel ? "#0EA672" : "#E3E8E6"),
                          background: sel ? "#0EA672" : "#fff", color: sel ? "#fff" : "#11201C", fontSize: 14 }}>
                        {o[lang] ?? o.en ?? o.value}
                      </button>
                    );
                  })}
                </div>
              )}
              {q.type === "boolean" && (
                <div style={{ display: "flex", gap: 8 }}>
                  {[["true", t.yes], ["false", t.no]].map(([v, lbl]) => {
                    const sel = answers[q.id] === (v === "true");
                    return (
                      <button type="button" key={v} onClick={() => set(q.id, v === "true")}
                        style={{ padding: "8px 18px", borderRadius: 999, cursor: "pointer",
                          border: "1px solid " + (sel ? "#0EA672" : "#E3E8E6"),
                          background: sel ? "#0EA672" : "#fff", color: sel ? "#fff" : "#11201C", fontSize: 14 }}>
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              )}
              {q.type === "long_text" && (
                <textarea rows={3} style={inputStyle} value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} />
              )}
              {(q.type === "text" || q.type === "date") && (
                <input type={q.type === "date" ? "date" : "text"} style={inputStyle} value={(answers[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} />
              )}
              {(q.type === "number" || q.type === "scale") && (
                <input type="number" style={inputStyle} value={(answers[q.id] as number) ?? ""} onChange={(e) => set(q.id, e.target.value === "" ? undefined : Number(e.target.value))} />
              )}
            </div>
          );
        })}
      </div>
      {state === "error" && <p style={{ color: "#DC2626", fontSize: 14, marginTop: 14 }}>{t.err}</p>}
      <button type="submit" disabled={state === "saving"}
        style={{ marginTop: 26, padding: "13px 22px", borderRadius: 999, border: "none", background: "#0EA672", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", opacity: state === "saving" ? 0.6 : 1 }}>
        {state === "saving" ? t.submitting : t.submit}
      </button>
    </form>
  );
}
