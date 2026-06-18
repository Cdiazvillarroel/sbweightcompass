import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompassMark } from "@/components/CompassMark";
import { AppNav } from "@/components/app/AppNav";
import { SignOutButton } from "@/components/app/SignOutButton";

const NAV = {
  en: { home: "Home", cuerpo: "My body", nutricion: "Nutrition", movimiento: "Movement", plan: "My coach", perfil: "Profile", signout: "Sign out" },
  es: { home: "Inicio", cuerpo: "Mi cuerpo", nutricion: "Nutrición", movimiento: "Movimiento", plan: "Mi coach", perfil: "Perfil", signout: "Cerrar sesión" },
};

export default async function DashLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const n = NAV[locale === "es" ? "es" : "en"];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/app/login`);
  const core = supabase.schema("core");
  const { data: clients } = await core.from("clients").select("id").limit(1);
  const client = clients?.[0] as { id: string } | undefined;
  if (!client) redirect(`/${locale}/app`);
  const { data: subs } = await core.from("intake_submissions").select("status").eq("client_id", client.id).order("created_at", { ascending: false }).limit(1);
  const sub = subs?.[0] as { status: string } | undefined;
  if (sub?.status !== "submitted") redirect(`/${locale}/app`);

  const items = [
    { seg: "home", label: n.home }, { seg: "cuerpo", label: n.cuerpo }, { seg: "nutricion", label: n.nutricion },
    { seg: "movimiento", label: n.movimiento }, { seg: "plan", label: n.plan }, { seg: "perfil", label: n.perfil },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#ECFBF4 0%,#F7FBF9 280px,#F7FBF9 100%)", fontFamily: "'Inter',system-ui,sans-serif", color: "#11201C" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(247,251,249,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #E3E8E6" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <CompassMark size={26} />
            <span style={{ fontWeight: 800, fontSize: 14.5, color: "#0B3D33" }}>SB My Weight Compass</span>
          </div>
          <SignOutButton locale={locale} label={n.signout} />
        </div>
        <AppNav locale={locale} items={items} />
        <div style={{ height: 10 }} />
      </header>
      <main style={{ maxWidth: 920, margin: "0 auto", padding: "22px 16px 64px" }}>{children}</main>
    </div>
  );
}
