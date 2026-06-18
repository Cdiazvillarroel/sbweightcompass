"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Metric = { code: string; defId: string; label: string; unit: string; step?: number; placeholder?: string };

export function MetricLogger({
  tenantId, clientId, metrics, cta, saving, saved, errorLabel, cols = 2,
}: {
  tenantId: string; clientId: string; metrics: Metric[];
  cta: string; saving: string; saved: string; errorLabel: string; cols?: number;
}) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function save() {
    setState("saving");
    try {
      const core = createClient().schema("core");
      const rows = metrics
        .filter((m) => vals[m.code] !== undefined && vals[m.code] !== "")
        .map((m) => ({ tenant_id: tenantId, client_id: clientId, metric_def_id: m.defId, value: Number(vals[m.code]), recorded_at: new Date().toISOString(), source: "client" }));
      if (!rows.length) { setState("idle"); return; }
      const { error } = await core.from("metric_entries").insert(rows);
      if (error) throw error;
      setState("done");
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
        {metrics.map((m) => (
          <div key={m.code}>
            <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "#11201C", marginBottom: 6 }}>{m.label}{m.unit ? ` (${m.unit})` : ""}</label>
            <input type="number" inputMode="decimal" step={m.step ?? 0.1} placeholder={m.placeholder ?? ""}
              value={vals[m.code] ?? ""} onChange={(e) => setVals((v) => ({ ...v, [m.code]: e.target.value }))}
              style={{ width: "100%", padding: "11px 13px", border: "1px solid #E3E8E6", borderRadius: 12, fontSize: 15.5, fontFamily: "inherit", color: "#11201C", background: "#fff", outline: "none" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <button type="button" onClick={save} disabled={state === "saving"} style={{
          background: "#0EA672", color: "#fff", border: "none", borderRadius: 999, padding: "11px 22px",
          fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", opacity: state === "saving" ? 0.6 : 1,
        }}>{state === "saving" ? saving : state === "done" ? saved : cta}</button>
        {state === "error" && <span style={{ color: "#DC2626", fontSize: 13.5 }}>{errorLabel}</span>}
      </div>
    </div>
  );
}
