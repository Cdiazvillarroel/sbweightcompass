"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const T = {
  en: {
    title: "Client sign in", sub: "Access your plan, goals and tracking.",
    google: "Continue with Google", or: "or",
    email: "Email", password: "Password",
    signin: "Sign in", signup: "Create account",
    toSignup: "New here? Create an account", toSignin: "Already have an account? Sign in",
    working: "Please wait…",
    errCred: "Invalid email or password.", errGeneric: "Something went wrong. Please try again.",
    min: "Use at least 8 characters.",
    checkEmail: "Almost there — check your email to confirm your account.",
  },
  es: {
    title: "Acceso de clientes", sub: "Entra a tu plan, metas y seguimiento.",
    google: "Continuar con Google", or: "o",
    email: "Correo", password: "Contraseña",
    signin: "Ingresar", signup: "Crear cuenta",
    toSignup: "¿Nuevo? Crea una cuenta", toSignin: "¿Ya tienes cuenta? Ingresa",
    working: "Un momento…",
    errCred: "Correo o contraseña inválidos.", errGeneric: "Algo salió mal. Inténtalo de nuevo.",
    min: "Usa al menos 8 caracteres.",
    checkEmail: "Casi listo — revisa tu correo para confirmar tu cuenta.",
  },
};

export function LoginForm({ locale }: { locale: string }) {
  const t = T[locale === "es" ? "es" : "en"];
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function google() {
    setBusy(true); setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/${locale}/app/auth/callback` },
    });
    if (error) { setErr(t.errGeneric); setBusy(false); }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setErr(null);
    if (mode === "signup" && password.length < 8) { setErr(t.min); return; }
    setBusy(true);
    const supabase = createClient();
    const res = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password,
          options: { emailRedirectTo: `${window.location.origin}/${locale}/app/auth/callback` } });
    if (res.error) {
      setErr(mode === "signin" ? t.errCred : t.errGeneric);
      setBusy(false); return;
    }
    if (!res.data.session) { setSent(true); setBusy(false); return; } // email confirmation is on
    window.location.assign(`/${locale}/app`);
  }

  const input = { width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid #E3E8E6", fontSize: 16 } as const;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0B3D33", margin: 0 }}>{t.title}</h1>
      <p style={{ color: "#5C6B66", marginTop: 8 }}>{t.sub}</p>

      {sent ? (
        <p style={{ marginTop: 24, padding: 16, borderRadius: 14, background: "#ECFBF4", color: "#0B3D33", fontWeight: 600 }}>{t.checkEmail}</p>
      ) : (
        <>
          <button type="button" onClick={google} disabled={busy}
            style={{ marginTop: 24, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "12px 14px", borderRadius: 999, border: "1px solid #E3E8E6", background: "#fff", color: "#11201C",
              fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22 22-9.8 22-22c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 16.3 2 9.7 6.3 6.3 12.7z"/><path fill="#4CAF50" d="M24 46c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.6 36.6 26.9 37.5 24 37.5c-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.6 41.6 16.2 46 24 46z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.5c-.5.4 6.3-4.6 6.3-15 0-1.2-.1-2.3-.4-3.5z"/></svg>
            {t.google}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0", color: "#9aa6a2", fontSize: 13 }}>
            <span style={{ flex: 1, height: 1, background: "#E3E8E6" }} /> {t.or} <span style={{ flex: 1, height: 1, background: "#E3E8E6" }} />
          </div>

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="email" required placeholder={t.email} value={email} autoComplete="email"
              onChange={(e) => setEmail(e.target.value)} style={input} />
            <input type="password" required placeholder={t.password} value={password}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              onChange={(e) => setPassword(e.target.value)} style={input} />
            {err && <span style={{ color: "#DC2626", fontSize: 14 }}>{err}</span>}
            <button type="submit" disabled={busy}
              style={{ padding: "12px 18px", borderRadius: 999, border: "none", background: "#0EA672", color: "#fff",
                fontWeight: 700, fontSize: 16, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
              {busy ? t.working : mode === "signin" ? t.signin : t.signup}
            </button>
          </form>

          <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); }}
            style={{ marginTop: 16, background: "none", border: "none", color: "#0EA672", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: 0 }}>
            {mode === "signin" ? t.toSignup : t.toSignin}
          </button>
        </>
      )}
    </div>
  );
}
