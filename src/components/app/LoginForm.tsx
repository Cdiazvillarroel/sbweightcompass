"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const T = {
  en: { title: "Client sign in", sub: "Enter your email and we'll send you a secure sign-in link.",
        email: "Email", send: "Send me the link", sending: "Sending…",
        sent: "Check your email for the sign-in link.", err: "Couldn't send the link. Please try again." },
  es: { title: "Acceso de clientes", sub: "Ingresa tu correo y te enviamos un enlace seguro para entrar.",
        email: "Correo", send: "Envíame el enlace", sending: "Enviando…",
        sent: "Revisa tu correo para el enlace de acceso.", err: "No se pudo enviar el enlace. Inténtalo de nuevo." },
};

export function LoginForm({ locale }: { locale: string }) {
  const t = T[locale === "es" ? "es" : "en"];
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/${locale}/app/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    setState(error ? "error" : "sent");
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0B3D33", margin: 0 }}>{t.title}</h1>
      <p style={{ color: "#5C6B66", marginTop: 8 }}>{t.sub}</p>
      {state === "sent" ? (
        <p style={{ marginTop: 24, padding: 16, borderRadius: 14, background: "#ECFBF4", color: "#0B3D33", fontWeight: 600 }}>{t.sent}</p>
      ) : (
        <form onSubmit={onSubmit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.email}
            style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #E3E8E6", fontSize: 16 }} />
          {state === "error" && <span style={{ color: "#DC2626", fontSize: 14 }}>{t.err}</span>}
          <button type="submit" disabled={state === "sending"}
            style={{ padding: "12px 18px", borderRadius: 999, border: "none", background: "#0EA672", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", opacity: state === "sending" ? 0.6 : 1 }}>
            {state === "sending" ? t.sending : t.send}
          </button>
        </form>
      )}
    </div>
  );
}
