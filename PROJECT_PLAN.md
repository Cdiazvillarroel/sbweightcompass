# Project Plan — Coaching Support Platform (working name: **Compass**)

> Status: **DRAFT FOR REVIEW** · Owner: Claudio · Date: 2026-06-18
> First tenant: **SB My Weight Compass** (Sebastián Barrón — weight & lifestyle coach, AU, EN/ES, non-clinical)
> Nothing in this plan is built until it is approved. Documentation, code, schema and commits are in English; product content is bilingual EN/ES.

---

## 1. North Star

**Give the professional their time back.** Move routine, asynchronous client follow-up to AI agents that operate 24/7, so the professional's synchronous time is reserved only for what needs human judgement and relationship.

Every roadmap decision is judged against one question: *does this move async load off the human, or protect the human's high-value sync time?*

---

## 2. Strategic frame (this defines the architecture)

Built to measure for Sebastián, but engineered as a **multi-tenant SaaS** for independent professionals and content creators. Concretely:

- **Multi-tenant from day 1, one active tenant.** Sebastián is seeded as tenant #1. Every core entity carries a `coach_id` / tenant reference; RLS enforces isolation from the first migration.
- **Generic CORE vs vertical MODULES.** A clean seam between the reusable engine and the nutrition-specific behaviour that belongs to Sebastián's tenant. The nutrition vertical is a *module of the tenant*, never part of the core.
- **Professional-specific rules are DATA, not code.** Scope, intake questions, disclaimers, plan templates, agent prompts and branding live in configuration tables — so a second tenant is a config exercise, not a code fork, and white-label becomes possible later.

### Core vs vertical module map

| GENERIC CORE (reusable engine) | VERTICAL MODULE — Nutrition (SB tenant) |
|---|---|
| Tenant / professional, branding & config | Nutrition plan structure & templates |
| Client records, lead→client lifecycle | AI cooking assistant + **AUSNUT** food data |
| Appointments / consultations (Cal.com) | Medical-condition screening checklist (intake) |
| Configurable intake/onboarding engine | Exercise plan structure |
| Content delivery (plans, resources) | Recipe book domain model |
| AI follow-up engine (scheduling, triggers, escalation) | Wearables → weight/lifestyle metrics mapping |
| Messaging (client↔professional, human-in-the-loop) | Eating-disorder safety guardrails (domain rules) |
| Metrics & tracking framework (generic) | Disclaimers & referral logic copy |
| Consent, audit, data export/erase | |
| Traffic-light scope guardrail (cross-cutting) | |

> The line to hold: the core knows about *"a tracked metric"*, *"a plan made of items"*, *"an intake made of questions"*. It does **not** know what a macro, a recipe, or a GP clearance is — those are the nutrition module's concern.

---

## 3. Stack & residency

- **Frontend / app:** Next.js on **Vercel** (preview deploy per PR).
- **Source control:** **GitHub**, trunk-based with PRs.
- **Backend:** **Supabase** — Postgres, Auth, RLS, Realtime, Storage, Edge Functions — provisioned in **Australia (Sydney)** region for data residency.
- **Design:** **Figma** design system (tokens + components), modern compass identity.
- **Payments (later phase):** **Stripe** for client packages (Basic 3-month, Premium 6-month) + add-ons.

---

## 4. Phased roadmap

Sequenced so value lands early and the data model stays stable. We **stop and checkpoint at each milestone**, and any change to the data model or scope triggers an ADR + a pause.

### Phase 0 — Foundations (infra + design system)
GitHub repo, Next.js app, Vercel preview, Supabase (Sydney) with Auth + base RLS + i18n scaffolding, Sebastián seeded as tenant #1. Figma tokens + base components from the modern compass identity.
*Exit:* a deployed bilingual shell that proves the multi-tenant + RLS + i18n spine.

### Phase 1 — Commercial (revenue-generating front door) ⭐ first real value
Bilingual public site: marketing landing → **free initial consult booking (Cal.com)** → **lead capture** → **onboarding/intake form** (configurable engine, with the nutrition module's medical-screening checklist). Coach can see captured leads.
*Exit:* a real lead can find the site, book the free consult, and submit intake; the coach receives it.

### Phase 2 — Professional panel (the time-back engine, v1)
Client management + light CRM, lead→client conversion, KPIs, at-risk client alerts, AI pre-consult brief and post-consult summary+plan (human-in-the-loop approval).

### Phase 3 — Client app
Onboarding results, nutrition + exercise plan, recipe book + AI cooking assistant, goals & tracking, wearables.

### Phase 4 — AI agents (full async engine)
Cooking assistant, client↔professional communication agent (human-in-the-loop), social-media automation. This is where the North Star is most fully realised.

### Phase 5 — Monetisation
Stripe for client packages + add-ons (Basic/Premium).

### Phase 6 — Community
Later-phase community features.

> Phasing is about *sequencing*, not commitment to build all of it now. We only build Phase 0 + Phase 1 after this plan is approved; each later phase gets its own plan/ADR pass.

---

## 5. Non-negotiable architecture principles

1. **Tenant on every core entity.** `coach_id` / tenant FK everywhere; RLS written as *"belongs to this professional"* and *"the client sees only their own."*
2. **Rules as data.** Scope, intake questions, disclaimers, plan templates, agent prompts, branding → config tables. Nothing tenant-specific is hardcoded.
3. **Bilingual from the schema.** EN/ES i18n designed into content storage, not bolted on.
4. **Privacy by design.** Health data = sensitive information under the **federal Privacy Act** and **Victoria's Health Records Act**. RLS, encryption, consent logging, AU residency, audit trail, and data export/erase are first-class.
5. **Human-in-the-loop** on everything clinical-adjacent or publishable.

---

## 6. "Coaching, not clinical" — product guardrail

- A **green / amber / red traffic-light** model applied to both the professional and the AI agents.
- Agents **never give clinical advice**; they detect triggers (medical conditions, medication, eating-disorder language) and **escalate / refer**.
- The intake medical-conditions checklist is **active screening** → it raises a **"GP clearance" flag**.
- Disclaimers and referral logic are **visible by design**; eating-disorder safety guardrails are built in, not optional.

This is implemented as a cross-cutting core concern (the traffic-light state + escalation routing) that the nutrition module supplies trigger rules to.

---

## 7. Explicitly NOT building yet

Professional self-signup, billing to professionals (Stripe Connect), marketplace, white-label engine, super-admin. **Branding stays in config** so white-label remains possible later without rework.

---

## 8. Way of working

- **Plan first, then incremental execution.** Commit to GitHub via PRs, preview deploys on Vercel, checkpoint with Claudio at every milestone.
- **Decisions recorded as ADRs** in `docs/adr/`.
- **Stop-and-ask rule:** any decision that changes the data model or scope → pause and confirm before proceeding.

---

## 9. Immediate next steps (only after this plan + ADR-0001 are approved)

1. Provision GitHub repo + Next.js app + Vercel preview.
2. Provision Supabase project in **Sydney**, apply the ADR-0001 core schema migration with RLS, seed Sebastián as tenant #1.
3. Stand up Figma tokens + base components from the approved compass direction.
4. Begin Phase 1 (commercial).

**Open items needing your sign-off are listed at the end of ADR-0001.**
