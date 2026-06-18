// Pass-through root layout. The real <html>/<body> markup lives in
// `app/[locale]/layout.tsx`, which is the effective root for all locale routes.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
