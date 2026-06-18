const T = { en: { title: "Nutrition", body: "Your tailored meal plan, recipes and grocery guidance will live here." }, es: { title: "Nutrición", body: "Aquí vivirán tu plan alimenticio a medida, recetas y lista de compras." } };
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = T[locale === "es" ? "es" : "en"];
  return (
    <div style={{ background: "#fff", border: "1px solid #E8ECEA", borderRadius: 22, padding: "40px 28px", textAlign: "center", boxShadow: "0 24px 50px -34px rgba(11,61,51,0.35)" }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0EA672" }}>{t.title}</span>
      <p style={{ margin: "12px auto 0", maxWidth: 420, fontSize: 16, lineHeight: 1.55, color: "#5C6B66" }}>{t.body}</p>
      <span style={{ display: "inline-block", marginTop: 18, fontSize: 13, fontWeight: 700, color: "#0B3D33", background: "#ECFBF4", border: "1px solid #A7E8CF", padding: "6px 14px", borderRadius: 999 }}>{locale === "es" ? "Próximamente" : "Coming soon"}</span>
    </div>
  );
}
