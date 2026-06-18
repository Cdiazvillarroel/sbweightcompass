"use client";
import { usePathname } from "next/navigation";

type Item = { seg: string; label: string };

export function AppNav({ locale, items }: { locale: string; items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav style={{ display: "flex", gap: 6, overflowX: "auto", padding: "10px 16px 0", maxWidth: 920, margin: "0 auto" }}>
      {items.map((it) => {
        const href = `/${locale}/app/${it.seg}`;
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <a key={it.seg} href={href} style={{
            whiteSpace: "nowrap", textDecoration: "none", fontSize: 14.5, fontWeight: 600,
            padding: "9px 15px", borderRadius: 999, transition: "all .15s",
            color: active ? "#fff" : "#0B3D33", background: active ? "#0EA672" : "#fff",
            border: "1px solid " + (active ? "#0EA672" : "#E3E8E6"),
          }}>{it.label}</a>
        );
      })}
    </nav>
  );
}
