# SB My Weight Compass — Coaching platform

Multi-tenant coaching support platform (Next.js + Supabase). Built to measure for
**SB My Weight Compass** (tenant #1) and engineered as a multi-tenant SaaS core with
vertical modules. See `PROJECT_PLAN.md` and `docs/adr/0001-core-architecture-and-data-model.md`.

> **North Star:** give the professional their time back — move routine async client
> follow-up to AI agents, reserving human sync time for what needs judgement.

## Stack
- **Next.js** (App Router, TypeScript, Tailwind v4) on **Vercel**
- **next-intl** — bilingual EN/ES from the routing layer up
- **Supabase** (Postgres, Auth, RLS, Storage, Edge Functions) — region **ap-southeast-2 (Sydney)** for AU data residency
- **Figma** design system (modern "True North" compass identity)

## Architecture (non-negotiables)
- `tenant_id` on every core entity; RLS = "belongs to this professional" + "the client sees only their own"
- Professional rules as **data** (config tables), not hardcoded
- Hard seam: generic `core` schema vs vertical `nutrition` schema (nutrition references core, never the reverse)
- Privacy by design (consent log, audit, AU residency); human-in-the-loop on clinical-adjacent / publishable output
- "Coaching, not clinical" green/amber/red guardrail

## Layout
```
src/
  app/[locale]/      # bilingual routes (en, es)
  components/        # CompassMark, LocaleSwitcher, ...
  i18n/              # next-intl routing, navigation, request config
  messages/          # en.json, es.json
  lib/supabase/      # browser + server clients
  core/              # generic core (future server logic)
  modules/nutrition/ # vertical module (SB tenant)
supabase/
  migrations/        # 0001 core schema, 0002 core RLS
  seed.sql           # SB My Weight Compass seeded as tenant #1
```

## Local development
```bash
npm install
cp .env.example .env.local   # fill Supabase + Cal.com values
npm run dev
```

## Database
Apply `supabase/migrations/*` then `supabase/seed.sql` to the Supabase project
(via the Supabase MCP `apply_migration` / dashboard / CLI). Regenerate types into
`src/lib/supabase/types.ts` afterwards.

## Status
**Phase 0** — foundations (this scaffold). Next: wire the live Supabase project,
preview deploys, and begin Phase 1 (bilingual landing → Cal.com consult → lead capture → intake).
